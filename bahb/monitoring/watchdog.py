"""
Process watchdog for BAHB system.

Monitors critical processes and restarts them on failure with exponential backoff.
Detects memory leaks, GPU memory issues, and sends alerts on repeated failures.
"""

import asyncio
import psutil
import signal
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Optional, Callable, Dict, List
from loguru import logger


class ProcessState(Enum):
    """Process state enumeration."""
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    RESTARTING = "restarting"
    FAILED = "failed"
    CRASHED = "crashed"


@dataclass
class ProcessInfo:
    """Information about a monitored process."""
    name: str
    pid: Optional[int] = None
    state: ProcessState = ProcessState.STOPPED
    start_time: Optional[datetime] = None
    restart_count: int = 0
    crash_count: int = 0
    last_crash_time: Optional[datetime] = None
    memory_usage_mb: float = 0.0
    gpu_memory_mb: float = 0.0
    cpu_percent: float = 0.0
    uptime_seconds: float = 0.0


@dataclass
class WatchdogConfig:
    """Watchdog configuration."""
    # Restart behavior
    max_restarts: int = 5
    restart_window_seconds: int = 300  # 5 minutes
    initial_backoff_seconds: float = 1.0
    max_backoff_seconds: float = 60.0
    backoff_multiplier: float = 2.0

    # Health checks
    health_check_interval_seconds: float = 5.0
    process_timeout_seconds: float = 30.0

    # Memory leak detection
    memory_leak_threshold_mb: float = 1000.0  # 1GB
    memory_growth_threshold_mb_per_min: float = 50.0  # 50MB/min
    memory_check_interval_seconds: float = 60.0

    # GPU memory monitoring
    gpu_memory_threshold_mb: float = 14000.0  # 14GB on Orin NX
    gpu_memory_check_interval_seconds: float = 10.0

    # Alert thresholds
    alert_on_crash: bool = True
    alert_on_repeated_failures: int = 3
    alert_on_memory_leak: bool = True


class ProcessWatchdog:
    """
    Process watchdog for monitoring and auto-recovery.

    Features:
    - Auto-restart on crash with exponential backoff
    - Memory leak detection
    - GPU memory monitoring
    - Process health checks
    - Alert on repeated failures
    - Graceful shutdown handling
    """

    def __init__(
        self,
        process_name: str,
        start_command: Callable,
        config: Optional[WatchdogConfig] = None,
        alert_callback: Optional[Callable[[str, str], None]] = None,
    ):
        """
        Initialize watchdog.

        Args:
            process_name: Name of the process to monitor
            start_command: Async callable that starts the process
            config: Watchdog configuration
            alert_callback: Optional callback for alerts (severity, message)
        """
        self.process_name = process_name
        self.start_command = start_command
        self.config = config or WatchdogConfig()
        self.alert_callback = alert_callback

        self.process_info = ProcessInfo(name=process_name)
        self._running = False
        self._process_handle: Optional[asyncio.subprocess.Process] = None
        self._psutil_process: Optional[psutil.Process] = None

        # Memory tracking for leak detection
        self._memory_samples: List[tuple[datetime, float]] = []

        # Restart tracking
        self._restart_times: List[datetime] = []
        self._current_backoff = self.config.initial_backoff_seconds

        # Background tasks
        self._monitor_task: Optional[asyncio.Task] = None
        self._health_check_task: Optional[asyncio.Task] = None
        self._memory_check_task: Optional[asyncio.Task] = None

    async def start(self) -> bool:
        """
        Start the watchdog and the monitored process.

        Returns:
            True if started successfully
        """
        if self._running:
            logger.warning(f"Watchdog for {self.process_name} already running")
            return False

        logger.info(f"Starting watchdog for {self.process_name}")
        self._running = True

        # Start the process
        if not await self._start_process():
            self._running = False
            return False

        # Start monitoring tasks
        self._monitor_task = asyncio.create_task(self._monitor_loop())
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        self._memory_check_task = asyncio.create_task(self._memory_check_loop())

        return True

    async def stop(self, timeout: float = 10.0) -> None:
        """
        Stop the watchdog and the monitored process.

        Args:
            timeout: Graceful shutdown timeout in seconds
        """
        logger.info(f"Stopping watchdog for {self.process_name}")
        self._running = False

        # Cancel monitoring tasks
        for task in [self._monitor_task, self._health_check_task, self._memory_check_task]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        # Stop the process gracefully
        await self._stop_process(timeout)

        logger.info(f"Watchdog for {self.process_name} stopped")

    async def _start_process(self) -> bool:
        """Start the monitored process."""
        try:
            self.process_info.state = ProcessState.STARTING
            logger.info(f"Starting process: {self.process_name}")

            # Call the start command (should return a process or PID)
            result = await self.start_command()

            if isinstance(result, int):
                # Got a PID
                self.process_info.pid = result
                self._psutil_process = psutil.Process(result)
            elif hasattr(result, 'pid'):
                # Got a process object
                self._process_handle = result
                self.process_info.pid = result.pid
                self._psutil_process = psutil.Process(result.pid)
            else:
                logger.error(f"Invalid result from start_command: {result}")
                return False

            self.process_info.state = ProcessState.RUNNING
            self.process_info.start_time = datetime.now()
            self.process_info.restart_count += 1

            logger.info(f"Process {self.process_name} started with PID {self.process_info.pid}")
            return True

        except Exception as e:
            logger.error(f"Failed to start {self.process_name}: {e}")
            self.process_info.state = ProcessState.FAILED
            await self._send_alert("critical", f"Failed to start {self.process_name}: {e}")
            return False

    async def _stop_process(self, timeout: float = 10.0) -> None:
        """Stop the monitored process gracefully."""
        if not self._psutil_process or not self._psutil_process.is_running():
            return

        try:
            logger.info(f"Stopping process {self.process_name} (PID {self.process_info.pid})")

            # Try graceful shutdown first
            self._psutil_process.send_signal(signal.SIGTERM)

            # Wait for graceful shutdown
            try:
                self._psutil_process.wait(timeout=timeout)
                logger.info(f"Process {self.process_name} stopped gracefully")
            except psutil.TimeoutExpired:
                logger.warning(f"Process {self.process_name} did not stop gracefully, force killing")
                self._psutil_process.kill()
                self._psutil_process.wait(timeout=5)

            self.process_info.state = ProcessState.STOPPED
            self.process_info.pid = None

        except psutil.NoSuchProcess:
            logger.info(f"Process {self.process_name} already stopped")
            self.process_info.state = ProcessState.STOPPED
            self.process_info.pid = None
        except Exception as e:
            logger.error(f"Error stopping {self.process_name}: {e}")

    async def _monitor_loop(self) -> None:
        """Main monitoring loop."""
        while self._running:
            try:
                await asyncio.sleep(1.0)

                # Check if process is still running
                if not self._is_process_running():
                    await self._handle_process_crash()
                else:
                    # Update process info
                    await self._update_process_info()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Monitor loop error: {e}")
                await asyncio.sleep(5.0)

    async def _health_check_loop(self) -> None:
        """Health check loop."""
        while self._running:
            try:
                await asyncio.sleep(self.config.health_check_interval_seconds)

                if self.process_info.state == ProcessState.RUNNING:
                    # Update metrics
                    await self._update_process_info()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check loop error: {e}")

    async def _memory_check_loop(self) -> None:
        """Memory leak detection loop."""
        while self._running:
            try:
                await asyncio.sleep(self.config.memory_check_interval_seconds)

                if self.process_info.state == ProcessState.RUNNING:
                    await self._check_memory_leak()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Memory check loop error: {e}")

    def _is_process_running(self) -> bool:
        """Check if process is running."""
        try:
            if self._psutil_process and self._psutil_process.is_running():
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
        return False

    async def _update_process_info(self) -> None:
        """Update process information."""
        try:
            if not self._psutil_process or not self._psutil_process.is_running():
                return

            # CPU and memory
            self.process_info.cpu_percent = self._psutil_process.cpu_percent(interval=0.1)
            memory_info = self._psutil_process.memory_info()
            self.process_info.memory_usage_mb = memory_info.rss / 1024 / 1024

            # Uptime
            if self.process_info.start_time:
                self.process_info.uptime_seconds = (
                    datetime.now() - self.process_info.start_time
                ).total_seconds()

            # GPU memory (if available)
            try:
                gpu_memory = await self._get_gpu_memory_usage()
                self.process_info.gpu_memory_mb = gpu_memory

                # Check GPU memory threshold
                if gpu_memory > self.config.gpu_memory_threshold_mb:
                    await self._send_alert(
                        "warning",
                        f"{self.process_name} GPU memory high: {gpu_memory:.0f}MB"
                    )
            except Exception:
                pass  # GPU monitoring not available

        except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
            logger.warning(f"Could not update process info: {e}")

    async def _check_memory_leak(self) -> None:
        """Check for memory leaks."""
        current_time = datetime.now()
        current_memory = self.process_info.memory_usage_mb

        # Store sample
        self._memory_samples.append((current_time, current_memory))

        # Keep only last hour of samples
        cutoff_time = current_time - timedelta(hours=1)
        self._memory_samples = [
            s for s in self._memory_samples if s[0] > cutoff_time
        ]

        # Check absolute threshold
        if current_memory > self.config.memory_leak_threshold_mb:
            await self._send_alert(
                "warning",
                f"{self.process_name} memory usage high: {current_memory:.0f}MB"
            )

        # Check growth rate (need at least 5 minutes of data)
        if len(self._memory_samples) >= 5:
            first_sample = self._memory_samples[0]
            time_diff_minutes = (current_time - first_sample[0]).total_seconds() / 60
            memory_diff_mb = current_memory - first_sample[1]

            if time_diff_minutes > 5:
                growth_rate = memory_diff_mb / time_diff_minutes

                if growth_rate > self.config.memory_growth_threshold_mb_per_min:
                    await self._send_alert(
                        "critical",
                        f"{self.process_name} possible memory leak detected: "
                        f"{growth_rate:.1f}MB/min growth rate"
                    )

    async def _get_gpu_memory_usage(self) -> float:
        """Get GPU memory usage for the process (in MB)."""
        try:
            import pynvml
            pynvml.nvmlInit()

            # Get GPU 0 (assuming single GPU)
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)

            # Get processes on GPU
            processes = pynvml.nvmlDeviceGetComputeRunningProcesses(handle)

            for proc in processes:
                if proc.pid == self.process_info.pid:
                    return proc.usedGpuMemory / 1024 / 1024

            return 0.0

        except Exception:
            # pynvml not available or GPU not found
            return 0.0

    async def _handle_process_crash(self) -> None:
        """Handle process crash."""
        logger.error(f"Process {self.process_name} crashed!")

        self.process_info.state = ProcessState.CRASHED
        self.process_info.crash_count += 1
        self.process_info.last_crash_time = datetime.now()

        # Send crash alert
        if self.config.alert_on_crash:
            await self._send_alert(
                "critical",
                f"{self.process_name} crashed (crash #{self.process_info.crash_count})"
            )

        # Check restart limits
        if not self._should_restart():
            logger.error(f"Maximum restarts exceeded for {self.process_name}")
            self.process_info.state = ProcessState.FAILED
            await self._send_alert(
                "critical",
                f"{self.process_name} failed permanently after {self.process_info.restart_count} restarts"
            )
            self._running = False
            return

        # Restart with backoff
        await self._restart_with_backoff()

    def _should_restart(self) -> bool:
        """Check if process should be restarted."""
        current_time = datetime.now()

        # Clean up old restart times
        cutoff_time = current_time - timedelta(seconds=self.config.restart_window_seconds)
        self._restart_times = [t for t in self._restart_times if t > cutoff_time]

        # Check restart limit
        if len(self._restart_times) >= self.config.max_restarts:
            return False

        return True

    async def _restart_with_backoff(self) -> None:
        """Restart process with exponential backoff."""
        self.process_info.state = ProcessState.RESTARTING

        logger.info(
            f"Restarting {self.process_name} in {self._current_backoff:.1f}s "
            f"(restart #{len(self._restart_times) + 1})"
        )

        await asyncio.sleep(self._current_backoff)

        # Exponential backoff
        self._current_backoff = min(
            self._current_backoff * self.config.backoff_multiplier,
            self.config.max_backoff_seconds
        )

        # Record restart time
        self._restart_times.append(datetime.now())

        # Attempt restart
        if await self._start_process():
            # Reset backoff on successful start
            self._current_backoff = self.config.initial_backoff_seconds

            # Alert on repeated failures
            if (
                len(self._restart_times) >= self.config.alert_on_repeated_failures
                and self.alert_callback
            ):
                await self._send_alert(
                    "warning",
                    f"{self.process_name} has restarted {len(self._restart_times)} times "
                    f"in the last {self.config.restart_window_seconds}s"
                )
        else:
            logger.error(f"Failed to restart {self.process_name}")

    async def _send_alert(self, severity: str, message: str) -> None:
        """Send alert via callback."""
        if self.alert_callback:
            try:
                await self.alert_callback(severity, message)
            except Exception as e:
                logger.error(f"Alert callback error: {e}")
        else:
            logger.log(severity.upper(), message)

    def get_status(self) -> Dict:
        """Get current watchdog status."""
        return {
            "process_name": self.process_name,
            "state": self.process_info.state.value,
            "pid": self.process_info.pid,
            "uptime_seconds": self.process_info.uptime_seconds,
            "restart_count": self.process_info.restart_count,
            "crash_count": self.process_info.crash_count,
            "memory_usage_mb": round(self.process_info.memory_usage_mb, 2),
            "gpu_memory_mb": round(self.process_info.gpu_memory_mb, 2),
            "cpu_percent": round(self.process_info.cpu_percent, 2),
            "is_healthy": self.process_info.state == ProcessState.RUNNING,
        }
