"""
Distributed Backtesting Cluster Management

Manages distributed workers for parallel strategy backtesting.
Supports horizontal scaling across multiple machines.
"""

import asyncio
import json
import pickle
import hashlib
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
from enum import Enum
from datetime import datetime, timedelta
from abc import ABC, abstractmethod
import uuid
import queue
import threading
import time


class WorkerStatus(Enum):
    """Worker node status."""
    IDLE = "idle"
    BUSY = "busy"
    OFFLINE = "offline"
    FAILED = "failed"
    DRAINING = "draining"  # Finishing current work, not accepting new


class TaskStatus(Enum):
    """Task status."""
    PENDING = "pending"
    ASSIGNED = "assigned"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


class TaskPriority(Enum):
    """Task priority levels."""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class WorkerNode:
    """Represents a worker node in the cluster."""
    worker_id: str
    host: str
    port: int
    status: WorkerStatus = WorkerStatus.IDLE
    capacity: int = 4                          # Max concurrent tasks
    current_load: int = 0
    cpu_cores: int = 4
    memory_gb: float = 16.0
    gpu_available: bool = False
    last_heartbeat: datetime = field(default_factory=datetime.utcnow)
    total_tasks_completed: int = 0
    total_tasks_failed: int = 0
    avg_task_duration_ms: float = 0.0
    specializations: List[str] = field(default_factory=list)  # Strategy types this worker is good at

    @property
    def is_available(self) -> bool:
        return (
            self.status == WorkerStatus.IDLE and
            self.current_load < self.capacity and
            (datetime.utcnow() - self.last_heartbeat).seconds < 60
        )

    @property
    def available_slots(self) -> int:
        if self.status != WorkerStatus.IDLE:
            return 0
        return max(0, self.capacity - self.current_load)


@dataclass
class BacktestTask:
    """A backtesting task to be distributed."""
    task_id: str
    strategy_id: str
    strategy_code: str
    strategy_params: Dict[str, Any]
    symbol: str
    start_date: str                            # ISO format
    end_date: str
    data_hash: str                             # Hash of data for caching
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    assigned_worker: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    timeout_seconds: int = 300                 # 5 minute default timeout
    retry_count: int = 0
    max_retries: int = 3
    result: Optional[Dict] = None
    error: Optional[str] = None
    dependencies: List[str] = field(default_factory=list)  # Task IDs that must complete first

    def __lt__(self, other: 'BacktestTask') -> bool:
        """For priority queue ordering."""
        return self.priority.value > other.priority.value


@dataclass
class TaskResult:
    """Result of a backtest task."""
    task_id: str
    strategy_id: str
    success: bool
    metrics: Dict[str, float] = field(default_factory=dict)
    equity_curve: List[float] = field(default_factory=list)
    trades: List[Dict] = field(default_factory=list)
    execution_time_ms: float = 0.0
    worker_id: str = ""
    error_message: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


class TaskQueue:
    """
    Priority queue for backtest tasks.

    Supports priorities, dependencies, and task grouping.
    """

    def __init__(self):
        self._queue: List[BacktestTask] = []
        self._pending: Dict[str, BacktestTask] = {}
        self._assigned: Dict[str, BacktestTask] = {}
        self._completed: Dict[str, TaskResult] = {}
        self._lock = threading.Lock()

    def add_task(self, task: BacktestTask) -> None:
        """Add task to queue."""
        with self._lock:
            # Check if dependencies are met
            if task.dependencies:
                unmet = [
                    dep for dep in task.dependencies
                    if dep not in self._completed
                ]
                if unmet:
                    # Keep in pending until dependencies are met
                    self._pending[task.task_id] = task
                    return

            # Add to priority queue
            import heapq
            heapq.heappush(self._queue, task)

    def get_task(self, worker: WorkerNode) -> Optional[BacktestTask]:
        """Get highest priority task suitable for worker."""
        with self._lock:
            if not self._queue:
                return None

            import heapq

            # Find task matching worker specialization if any
            best_task = None
            best_idx = -1

            for i, task in enumerate(self._queue):
                if task.status != TaskStatus.PENDING:
                    continue

                # Check if worker specializes in this strategy type
                is_specialized = (
                    not worker.specializations or
                    task.strategy_id in worker.specializations
                )

                if best_task is None or (is_specialized and not best_task):
                    best_task = task
                    best_idx = i

            if best_task:
                # Remove from queue
                self._queue.pop(best_idx)
                heapq.heapify(self._queue)

                # Mark as assigned
                best_task.status = TaskStatus.ASSIGNED
                best_task.assigned_worker = worker.worker_id
                best_task.started_at = datetime.utcnow()
                self._assigned[best_task.task_id] = best_task

                return best_task

            return None

    def complete_task(self, task_id: str, result: TaskResult) -> None:
        """Mark task as completed."""
        with self._lock:
            if task_id in self._assigned:
                task = self._assigned.pop(task_id)
                task.status = TaskStatus.COMPLETED
                task.completed_at = datetime.utcnow()
                task.result = result.metrics

            self._completed[task_id] = result

            # Check for tasks waiting on this dependency
            for pending_id, pending_task in list(self._pending.items()):
                if task_id in pending_task.dependencies:
                    pending_task.dependencies.remove(task_id)

                    if not pending_task.dependencies:
                        del self._pending[pending_id]
                        import heapq
                        heapq.heappush(self._queue, pending_task)

    def fail_task(self, task_id: str, error: str) -> bool:
        """Mark task as failed, optionally retry."""
        with self._lock:
            if task_id not in self._assigned:
                return False

            task = self._assigned.pop(task_id)

            if task.retry_count < task.max_retries:
                # Retry
                task.retry_count += 1
                task.status = TaskStatus.PENDING
                task.assigned_worker = None
                task.error = error

                import heapq
                heapq.heappush(self._queue, task)
                return True
            else:
                # Mark as failed
                task.status = TaskStatus.FAILED
                task.error = error

                result = TaskResult(
                    task_id=task_id,
                    strategy_id=task.strategy_id,
                    success=False,
                    error_message=error
                )
                self._completed[task_id] = result
                return False

    def get_status(self) -> Dict[str, Any]:
        """Get queue status."""
        with self._lock:
            return {
                'pending': len(self._queue) + len(self._pending),
                'assigned': len(self._assigned),
                'completed': len(self._completed),
                'waiting_dependencies': len(self._pending),
            }


class WorkerPool:
    """
    Manages pool of worker nodes.

    Handles worker registration, health monitoring, and load balancing.
    """

    def __init__(
        self,
        heartbeat_interval_seconds: int = 10,
        worker_timeout_seconds: int = 60
    ):
        self.workers: Dict[str, WorkerNode] = {}
        self.heartbeat_interval = heartbeat_interval_seconds
        self.worker_timeout = worker_timeout_seconds
        self._lock = threading.Lock()

    def register_worker(self, worker: WorkerNode) -> None:
        """Register a worker node."""
        with self._lock:
            self.workers[worker.worker_id] = worker

    def unregister_worker(self, worker_id: str) -> None:
        """Unregister a worker node."""
        with self._lock:
            if worker_id in self.workers:
                del self.workers[worker_id]

    def heartbeat(self, worker_id: str, load: int = 0) -> bool:
        """Update worker heartbeat."""
        with self._lock:
            if worker_id not in self.workers:
                return False

            worker = self.workers[worker_id]
            worker.last_heartbeat = datetime.utcnow()
            worker.current_load = load

            if load < worker.capacity:
                worker.status = WorkerStatus.IDLE
            else:
                worker.status = WorkerStatus.BUSY

            return True

    def get_available_workers(self) -> List[WorkerNode]:
        """Get list of available workers, sorted by load."""
        with self._lock:
            self._check_worker_health()

            available = [
                w for w in self.workers.values()
                if w.is_available
            ]

            # Sort by available capacity (descending)
            available.sort(key=lambda w: w.available_slots, reverse=True)
            return available

    def get_best_worker(self, task: BacktestTask) -> Optional[WorkerNode]:
        """Get best worker for a specific task."""
        available = self.get_available_workers()

        if not available:
            return None

        # Prefer workers specialized in this strategy type
        for worker in available:
            if (worker.specializations and
                task.strategy_id in worker.specializations):
                return worker

        # Otherwise return worker with most capacity
        return available[0]

    def _check_worker_health(self) -> None:
        """Mark stale workers as offline."""
        now = datetime.utcnow()
        for worker in self.workers.values():
            if (now - worker.last_heartbeat).seconds > self.worker_timeout:
                worker.status = WorkerStatus.OFFLINE

    def get_pool_status(self) -> Dict[str, Any]:
        """Get pool status summary."""
        with self._lock:
            self._check_worker_health()

            return {
                'total_workers': len(self.workers),
                'available_workers': sum(1 for w in self.workers.values() if w.is_available),
                'busy_workers': sum(1 for w in self.workers.values() if w.status == WorkerStatus.BUSY),
                'offline_workers': sum(1 for w in self.workers.values() if w.status == WorkerStatus.OFFLINE),
                'total_capacity': sum(w.capacity for w in self.workers.values()),
                'current_load': sum(w.current_load for w in self.workers.values()),
            }


class ClusterScheduler:
    """
    Scheduler for distributed backtesting.

    Coordinates task assignment across worker pool.
    """

    def __init__(
        self,
        worker_pool: WorkerPool,
        task_queue: TaskQueue
    ):
        self.worker_pool = worker_pool
        self.task_queue = task_queue
        self._running = False
        self._scheduler_thread: Optional[threading.Thread] = None

    def start(self) -> None:
        """Start the scheduler."""
        self._running = True
        self._scheduler_thread = threading.Thread(target=self._schedule_loop)
        self._scheduler_thread.daemon = True
        self._scheduler_thread.start()

    def stop(self) -> None:
        """Stop the scheduler."""
        self._running = False
        if self._scheduler_thread:
            self._scheduler_thread.join(timeout=5)

    def _schedule_loop(self) -> None:
        """Main scheduling loop."""
        while self._running:
            try:
                self._schedule_tasks()
            except Exception as e:
                print(f"Scheduler error: {e}")

            time.sleep(0.1)  # 100ms scheduling interval

    def _schedule_tasks(self) -> None:
        """Assign pending tasks to available workers."""
        workers = self.worker_pool.get_available_workers()

        for worker in workers:
            while worker.available_slots > 0:
                task = self.task_queue.get_task(worker)
                if task is None:
                    break

                # Simulate sending task to worker
                # In production, use actual RPC/message queue
                self._dispatch_task(worker, task)

                worker.current_load += 1

    def _dispatch_task(self, worker: WorkerNode, task: BacktestTask) -> None:
        """Dispatch task to worker."""
        # In production, send via RPC or message queue
        print(f"Dispatching task {task.task_id} to worker {worker.worker_id}")


class DistributedBacktester:
    """
    High-level interface for distributed backtesting.

    Provides easy-to-use API for running backtests across cluster.
    """

    def __init__(self, num_local_workers: int = 4):
        self.worker_pool = WorkerPool()
        self.task_queue = TaskQueue()
        self.scheduler = ClusterScheduler(self.worker_pool, self.task_queue)

        # Results storage
        self.results: Dict[str, TaskResult] = {}
        self.result_callbacks: List[Callable[[TaskResult], None]] = []

        # Initialize local workers
        self._init_local_workers(num_local_workers)

    def _init_local_workers(self, count: int) -> None:
        """Initialize local worker processes."""
        import multiprocessing

        for i in range(count):
            worker = WorkerNode(
                worker_id=f"local_worker_{i}",
                host="localhost",
                port=8000 + i,
                capacity=1,
                cpu_cores=multiprocessing.cpu_count() // count,
                memory_gb=8.0
            )
            self.worker_pool.register_worker(worker)

    def add_remote_worker(
        self,
        host: str,
        port: int,
        capacity: int = 4,
        **kwargs
    ) -> str:
        """Add a remote worker to the pool."""
        worker_id = f"remote_{host}_{port}"
        worker = WorkerNode(
            worker_id=worker_id,
            host=host,
            port=port,
            capacity=capacity,
            **kwargs
        )
        self.worker_pool.register_worker(worker)
        return worker_id

    async def run_backtest(
        self,
        strategy_id: str,
        strategy_code: str,
        parameters: Dict[str, Any],
        symbol: str,
        start_date: str,
        end_date: str,
        priority: TaskPriority = TaskPriority.NORMAL,
        timeout: int = 300
    ) -> str:
        """
        Submit a backtest task.

        Returns task ID for tracking.
        """
        # Create data hash for caching
        data_key = f"{symbol}_{start_date}_{end_date}"
        data_hash = hashlib.md5(data_key.encode()).hexdigest()

        task = BacktestTask(
            task_id=str(uuid.uuid4()),
            strategy_id=strategy_id,
            strategy_code=strategy_code,
            strategy_params=parameters,
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            data_hash=data_hash,
            priority=priority,
            timeout_seconds=timeout
        )

        self.task_queue.add_task(task)
        return task.task_id

    async def run_batch(
        self,
        strategies: List[Dict[str, Any]],
        symbols: List[str],
        date_ranges: List[Tuple[str, str]],
        priority: TaskPriority = TaskPriority.NORMAL
    ) -> List[str]:
        """
        Submit batch of backtests.

        Creates cross-product of strategies × symbols × date ranges.
        """
        task_ids = []

        for strategy in strategies:
            for symbol in symbols:
                for start_date, end_date in date_ranges:
                    task_id = await self.run_backtest(
                        strategy_id=strategy['id'],
                        strategy_code=strategy['code'],
                        parameters=strategy.get('params', {}),
                        symbol=symbol,
                        start_date=start_date,
                        end_date=end_date,
                        priority=priority
                    )
                    task_ids.append(task_id)

        return task_ids

    async def run_walk_forward(
        self,
        strategy_id: str,
        strategy_code: str,
        base_params: Dict[str, Any],
        param_grid: Dict[str, List[Any]],
        symbol: str,
        train_months: int,
        test_months: int,
        total_months: int
    ) -> List[str]:
        """
        Run walk-forward optimization as distributed tasks.

        Creates dependent tasks for train/test windows.
        """
        from itertools import product

        task_ids = []

        # Generate parameter combinations
        param_names = list(param_grid.keys())
        param_values = list(param_grid.values())
        param_combos = list(product(*param_values))

        # Generate walk-forward windows
        from datetime import datetime, timedelta
        start = datetime(2020, 1, 1)
        window = 0

        while (window + 1) * test_months < total_months:
            train_start = start + timedelta(days=window * test_months * 30)
            train_end = train_start + timedelta(days=train_months * 30)
            test_start = train_end
            test_end = test_start + timedelta(days=test_months * 30)

            # Submit training tasks (optimization)
            train_task_ids = []
            for combo in param_combos:
                params = {**base_params}
                for name, value in zip(param_names, combo):
                    params[name] = value

                task_id = await self.run_backtest(
                    strategy_id=f"{strategy_id}_train_w{window}",
                    strategy_code=strategy_code,
                    parameters=params,
                    symbol=symbol,
                    start_date=train_start.isoformat()[:10],
                    end_date=train_end.isoformat()[:10],
                    priority=TaskPriority.HIGH
                )
                train_task_ids.append(task_id)

            # Test task depends on all training tasks
            # (in practice, would pick best params after training)
            test_task_id = await self.run_backtest(
                strategy_id=f"{strategy_id}_test_w{window}",
                strategy_code=strategy_code,
                parameters=base_params,  # Would use best from training
                symbol=symbol,
                start_date=test_start.isoformat()[:10],
                end_date=test_end.isoformat()[:10],
                priority=TaskPriority.NORMAL
            )

            task_ids.extend(train_task_ids)
            task_ids.append(test_task_id)

            window += 1

        return task_ids

    async def get_result(
        self,
        task_id: str,
        timeout: float = 60.0
    ) -> Optional[TaskResult]:
        """Wait for and return task result."""
        start = time.time()

        while time.time() - start < timeout:
            if task_id in self.results:
                return self.results[task_id]

            # Check task queue for completed
            status = self.task_queue.get_status()
            if task_id in self.task_queue._completed:
                result = self.task_queue._completed[task_id]
                self.results[task_id] = result
                return result

            await asyncio.sleep(0.1)

        return None

    async def get_results(
        self,
        task_ids: List[str],
        timeout: float = 300.0
    ) -> Dict[str, TaskResult]:
        """Wait for and return multiple task results."""
        results = {}
        start = time.time()

        remaining = set(task_ids)

        while remaining and time.time() - start < timeout:
            for task_id in list(remaining):
                if task_id in self.task_queue._completed:
                    results[task_id] = self.task_queue._completed[task_id]
                    remaining.remove(task_id)

            if remaining:
                await asyncio.sleep(0.1)

        return results

    def on_result(self, callback: Callable[[TaskResult], None]) -> None:
        """Register callback for task results."""
        self.result_callbacks.append(callback)

    def start(self) -> None:
        """Start the distributed backtester."""
        self.scheduler.start()

    def stop(self) -> None:
        """Stop the distributed backtester."""
        self.scheduler.stop()

    def get_status(self) -> Dict[str, Any]:
        """Get overall cluster status."""
        return {
            'pool': self.worker_pool.get_pool_status(),
            'queue': self.task_queue.get_status(),
            'results': len(self.results),
        }


class DataPartitioner:
    """
    Partitions historical data for distributed processing.

    Ensures consistent data access across workers.
    """

    def __init__(self, chunk_size_days: int = 30):
        self.chunk_size_days = chunk_size_days
        self.data_cache: Dict[str, Any] = {}

    def partition_date_range(
        self,
        start_date: str,
        end_date: str
    ) -> List[Tuple[str, str]]:
        """Partition date range into chunks."""
        from datetime import datetime, timedelta

        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)

        partitions = []
        current = start

        while current < end:
            chunk_end = min(
                current + timedelta(days=self.chunk_size_days),
                end
            )
            partitions.append((
                current.isoformat()[:10],
                chunk_end.isoformat()[:10]
            ))
            current = chunk_end

        return partitions

    def get_data_hash(self, symbol: str, start_date: str, end_date: str) -> str:
        """Get hash for data chunk."""
        key = f"{symbol}_{start_date}_{end_date}"
        return hashlib.md5(key.encode()).hexdigest()


class ResultAggregator:
    """
    Aggregates results from distributed backtests.

    Combines partial results and calculates overall metrics.
    """

    def __init__(self):
        self.partial_results: Dict[str, List[TaskResult]] = {}

    def add_result(self, group_id: str, result: TaskResult) -> None:
        """Add result to a group."""
        if group_id not in self.partial_results:
            self.partial_results[group_id] = []
        self.partial_results[group_id].append(result)

    def aggregate_equity_curves(
        self,
        group_id: str
    ) -> Optional[List[float]]:
        """Combine equity curves from partial results."""
        if group_id not in self.partial_results:
            return None

        results = self.partial_results[group_id]

        # Sort by time
        results.sort(key=lambda r: r.timestamp)

        # Combine curves
        combined = []
        scale = 1.0

        for result in results:
            if result.equity_curve:
                # Scale to match end of previous
                if combined:
                    scale = combined[-1] / result.equity_curve[0]
                scaled = [v * scale for v in result.equity_curve]
                combined.extend(scaled[1:] if combined else scaled)

        return combined

    def aggregate_metrics(self, group_id: str) -> Dict[str, float]:
        """Calculate aggregate metrics from partial results."""
        if group_id not in self.partial_results:
            return {}

        results = self.partial_results[group_id]

        # Aggregate key metrics
        total_return = 1.0
        total_trades = 0
        winning_trades = 0
        total_execution_time = 0.0

        for result in results:
            if 'total_return' in result.metrics:
                total_return *= (1 + result.metrics['total_return'])
            if 'num_trades' in result.metrics:
                total_trades += int(result.metrics['num_trades'])
            if 'winning_trades' in result.metrics:
                winning_trades += int(result.metrics['winning_trades'])
            total_execution_time += result.execution_time_ms

        return {
            'total_return': total_return - 1,
            'num_trades': total_trades,
            'win_rate': winning_trades / total_trades if total_trades > 0 else 0,
            'execution_time_ms': total_execution_time,
            'num_partitions': len(results),
        }
