"""
BAHB Ground Station Reporter

Real-time telemetry reporting, detection alerts, and mission status updates
for ground station integration during power infrastructure inspection flights.
"""

import json
import time
import socket
import logging
import threading
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, List, Any, Callable
from enum import Enum
from queue import Queue, Empty


class AlertLevel(Enum):
    """Alert severity levels for ground station notifications."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class MessageType(Enum):
    """Types of messages sent to ground station."""
    TELEMETRY = "telemetry"
    DETECTION = "detection"
    STATUS = "status"
    ALERT = "alert"
    HEARTBEAT = "heartbeat"
    MISSION_UPDATE = "mission_update"
    SYSTEM_HEALTH = "system_health"


@dataclass
class TelemetryPacket:
    """Aircraft telemetry data packet."""
    timestamp: str
    latitude: float
    longitude: float
    altitude_m: float
    heading_deg: float
    speed_mps: float
    battery_percent: float
    gps_satellites: int
    signal_strength_dbm: float
    cpu_temp_c: float
    gpu_temp_c: float
    storage_free_gb: float
    mission_progress_percent: float
    current_waypoint: int
    total_waypoints: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class DetectionAlert:
    """AI detection alert for ground station."""
    timestamp: str
    detection_id: str
    class_name: str
    confidence: float
    priority: str
    latitude: float
    longitude: float
    altitude_m: float
    image_path: Optional[str] = None
    bbox: Optional[List[float]] = None
    requires_immediate_action: bool = False
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class MissionStatusUpdate:
    """Mission status update for ground station."""
    timestamp: str
    mission_id: str
    mission_name: str
    state: str
    progress_percent: float
    waypoints_completed: int
    total_waypoints: int
    detections_count: int
    critical_detections: int
    elapsed_time_s: float
    estimated_remaining_s: float
    battery_remaining_percent: float
    distance_flown_m: float
    area_covered_sqm: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SystemHealthReport:
    """System health report for ground station."""
    timestamp: str
    ai_model_loaded: bool
    ai_inference_fps: float
    camera_connected: bool
    camera_streaming: bool
    gps_fix: bool
    gps_accuracy_m: float
    imu_healthy: bool
    compass_calibrated: bool
    motors_armed: bool
    battery_health_percent: float
    storage_health: str
    network_latency_ms: float
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class GroundStationReporter:
    """
    Manages real-time communication with ground station during flight operations.

    Supports multiple communication protocols:
    - UDP (low latency, best for telemetry)
    - TCP (reliable, best for alerts and mission data)
    - File-based logging (for offline review)
    - WebSocket (for web-based ground stations)
    """

    # Communication settings
    DEFAULT_UDP_PORT = 14550
    DEFAULT_TCP_PORT = 14551
    DEFAULT_HEARTBEAT_INTERVAL_S = 1.0
    DEFAULT_TELEMETRY_RATE_HZ = 10.0

    def __init__(
        self,
        ground_station_ip: str = "127.0.0.1",
        udp_port: int = DEFAULT_UDP_PORT,
        tcp_port: int = DEFAULT_TCP_PORT,
        log_dir: Optional[Path] = None,
        telemetry_rate_hz: float = DEFAULT_TELEMETRY_RATE_HZ,
        heartbeat_interval_s: float = DEFAULT_HEARTBEAT_INTERVAL_S,
        enable_udp: bool = True,
        enable_tcp: bool = True,
        enable_file_logging: bool = True,
        simulation_mode: bool = False
    ):
        self.ground_station_ip = ground_station_ip
        self.udp_port = udp_port
        self.tcp_port = tcp_port
        self.telemetry_rate_hz = telemetry_rate_hz
        self.heartbeat_interval_s = heartbeat_interval_s
        self.enable_udp = enable_udp
        self.enable_tcp = enable_tcp
        self.enable_file_logging = enable_file_logging
        self.simulation_mode = simulation_mode

        # Logging
        self.logger = logging.getLogger("BAHB.GroundStation")
        self.log_dir = log_dir or Path("/home/user/BAHB/data/ground_station_logs")
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # Communication state
        self._udp_socket: Optional[socket.socket] = None
        self._tcp_socket: Optional[socket.socket] = None
        self._tcp_connected = False

        # Message queues for async transmission
        self._message_queue: Queue = Queue(maxsize=1000)
        self._priority_queue: Queue = Queue(maxsize=100)  # For alerts

        # Threading
        self._running = False
        self._sender_thread: Optional[threading.Thread] = None
        self._heartbeat_thread: Optional[threading.Thread] = None

        # Statistics
        self._stats = {
            "messages_sent": 0,
            "messages_failed": 0,
            "bytes_sent": 0,
            "alerts_sent": 0,
            "detections_reported": 0,
            "connection_drops": 0,
            "start_time": None
        }

        # Session logging
        self._session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self._session_log_file: Optional[Path] = None
        self._detection_log_file: Optional[Path] = None

        # Callbacks for received commands
        self._command_callbacks: Dict[str, Callable] = {}

    def start(self) -> bool:
        """Start ground station communication."""
        self.logger.info("Starting ground station reporter...")
        self._stats["start_time"] = datetime.now().isoformat()

        try:
            # Initialize UDP socket
            if self.enable_udp and not self.simulation_mode:
                self._udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                self._udp_socket.setblocking(False)
                self.logger.info(f"UDP socket ready for {self.ground_station_ip}:{self.udp_port}")

            # Initialize TCP connection
            if self.enable_tcp and not self.simulation_mode:
                self._connect_tcp()

            # Initialize session logging
            if self.enable_file_logging:
                self._init_session_logs()

            # Start sender thread
            self._running = True
            self._sender_thread = threading.Thread(target=self._sender_loop, daemon=True)
            self._sender_thread.start()

            # Start heartbeat thread
            self._heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
            self._heartbeat_thread.start()

            self.logger.info("Ground station reporter started successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to start ground station reporter: {e}")
            return False

    def stop(self):
        """Stop ground station communication."""
        self.logger.info("Stopping ground station reporter...")
        self._running = False

        # Wait for threads to finish
        if self._sender_thread and self._sender_thread.is_alive():
            self._sender_thread.join(timeout=2.0)
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            self._heartbeat_thread.join(timeout=2.0)

        # Close sockets
        if self._udp_socket:
            self._udp_socket.close()
            self._udp_socket = None
        if self._tcp_socket:
            self._tcp_socket.close()
            self._tcp_socket = None
            self._tcp_connected = False

        # Close log files
        self._close_session_logs()

        self.logger.info("Ground station reporter stopped")

    def _connect_tcp(self) -> bool:
        """Establish TCP connection to ground station."""
        try:
            if self._tcp_socket:
                self._tcp_socket.close()

            self._tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self._tcp_socket.settimeout(5.0)
            self._tcp_socket.connect((self.ground_station_ip, self.tcp_port))
            self._tcp_connected = True
            self.logger.info(f"TCP connected to {self.ground_station_ip}:{self.tcp_port}")
            return True

        except Exception as e:
            self.logger.warning(f"TCP connection failed: {e}")
            self._tcp_connected = False
            self._stats["connection_drops"] += 1
            return False

    def _init_session_logs(self):
        """Initialize session log files."""
        session_dir = self.log_dir / self._session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        self._session_log_file = session_dir / "session.jsonl"
        self._detection_log_file = session_dir / "detections.jsonl"

        # Write session header
        header = {
            "type": "session_start",
            "timestamp": datetime.now().isoformat(),
            "session_id": self._session_id,
            "ground_station_ip": self.ground_station_ip,
            "simulation_mode": self.simulation_mode
        }
        self._write_to_log(self._session_log_file, header)

        self.logger.info(f"Session logs initialized: {session_dir}")

    def _close_session_logs(self):
        """Close session log files with summary."""
        if self._session_log_file:
            summary = {
                "type": "session_end",
                "timestamp": datetime.now().isoformat(),
                "session_id": self._session_id,
                "stats": self._stats
            }
            self._write_to_log(self._session_log_file, summary)

    def _write_to_log(self, log_file: Path, data: Dict):
        """Write data to log file in JSONL format."""
        try:
            with open(log_file, "a") as f:
                f.write(json.dumps(data) + "\n")
        except Exception as e:
            self.logger.error(f"Failed to write to log: {e}")

    def _sender_loop(self):
        """Background thread for sending queued messages."""
        while self._running:
            try:
                # Process priority queue first (alerts)
                try:
                    msg = self._priority_queue.get_nowait()
                    self._send_message(msg, priority=True)
                except Empty:
                    pass

                # Process regular queue
                try:
                    msg = self._message_queue.get(timeout=0.1)
                    self._send_message(msg, priority=False)
                except Empty:
                    pass

            except Exception as e:
                self.logger.error(f"Sender loop error: {e}")

    def _heartbeat_loop(self):
        """Background thread for sending heartbeats."""
        while self._running:
            try:
                self.send_heartbeat()
                time.sleep(self.heartbeat_interval_s)
            except Exception as e:
                self.logger.error(f"Heartbeat error: {e}")

    def _send_message(self, message: Dict, priority: bool = False):
        """Send a message to ground station."""
        try:
            data = json.dumps(message).encode('utf-8')

            # Send via UDP (best for telemetry)
            if self.enable_udp and self._udp_socket and not self.simulation_mode:
                try:
                    self._udp_socket.sendto(data, (self.ground_station_ip, self.udp_port))
                except socket.error:
                    pass  # UDP is fire-and-forget

            # Send via TCP (for reliable delivery of alerts)
            if priority and self.enable_tcp and self._tcp_connected and not self.simulation_mode:
                try:
                    self._tcp_socket.sendall(data + b'\n')
                except socket.error:
                    self._tcp_connected = False
                    self._stats["connection_drops"] += 1
                    # Attempt reconnection
                    self._connect_tcp()

            # Log to file
            if self.enable_file_logging and self._session_log_file:
                self._write_to_log(self._session_log_file, message)

            self._stats["messages_sent"] += 1
            self._stats["bytes_sent"] += len(data)

        except Exception as e:
            self.logger.error(f"Failed to send message: {e}")
            self._stats["messages_failed"] += 1

    def send_telemetry(self, telemetry: TelemetryPacket):
        """Send telemetry packet to ground station."""
        message = {
            "type": MessageType.TELEMETRY.value,
            "data": telemetry.to_dict()
        }

        # Telemetry goes to regular queue (high volume, can drop)
        try:
            self._message_queue.put_nowait(message)
        except:
            pass  # Drop if queue is full

    def send_detection(self, detection: DetectionAlert):
        """Send detection alert to ground station."""
        message = {
            "type": MessageType.DETECTION.value,
            "data": detection.to_dict()
        }

        # Log detection separately
        if self.enable_file_logging and self._detection_log_file:
            self._write_to_log(self._detection_log_file, detection.to_dict())

        self._stats["detections_reported"] += 1

        # Critical detections go to priority queue
        if detection.requires_immediate_action:
            try:
                self._priority_queue.put_nowait(message)
            except:
                self._message_queue.put(message)
        else:
            self._message_queue.put(message)

    def send_alert(
        self,
        level: AlertLevel,
        title: str,
        message: str,
        data: Optional[Dict] = None
    ):
        """Send alert notification to ground station."""
        alert = {
            "type": MessageType.ALERT.value,
            "data": {
                "timestamp": datetime.now().isoformat(),
                "level": level.value,
                "title": title,
                "message": message,
                "data": data or {}
            }
        }

        self._stats["alerts_sent"] += 1

        # All alerts go to priority queue
        try:
            self._priority_queue.put_nowait(alert)
        except:
            self._message_queue.put(alert)

        self.logger.warning(f"Alert [{level.value}]: {title} - {message}")

    def send_mission_update(self, status: MissionStatusUpdate):
        """Send mission status update to ground station."""
        message = {
            "type": MessageType.MISSION_UPDATE.value,
            "data": status.to_dict()
        }
        self._message_queue.put(message)

    def send_system_health(self, health: SystemHealthReport):
        """Send system health report to ground station."""
        message = {
            "type": MessageType.SYSTEM_HEALTH.value,
            "data": health.to_dict()
        }

        # Health reports with errors go to priority queue
        if health.errors:
            try:
                self._priority_queue.put_nowait(message)
            except:
                self._message_queue.put(message)
        else:
            self._message_queue.put(message)

    def send_heartbeat(self):
        """Send heartbeat to ground station."""
        heartbeat = {
            "type": MessageType.HEARTBEAT.value,
            "data": {
                "timestamp": datetime.now().isoformat(),
                "session_id": self._session_id,
                "uptime_s": self._get_uptime(),
                "stats": {
                    "messages_sent": self._stats["messages_sent"],
                    "detections_reported": self._stats["detections_reported"]
                }
            }
        }

        # Heartbeats go directly (bypass queue)
        if self.simulation_mode:
            return

        try:
            data = json.dumps(heartbeat).encode('utf-8')
            if self._udp_socket:
                self._udp_socket.sendto(data, (self.ground_station_ip, self.udp_port))
        except:
            pass

    def _get_uptime(self) -> float:
        """Get reporter uptime in seconds."""
        if self._stats["start_time"]:
            start = datetime.fromisoformat(self._stats["start_time"])
            return (datetime.now() - start).total_seconds()
        return 0.0

    def register_command_callback(self, command: str, callback: Callable):
        """Register callback for ground station commands."""
        self._command_callbacks[command] = callback
        self.logger.info(f"Registered callback for command: {command}")

    def get_stats(self) -> Dict[str, Any]:
        """Get reporter statistics."""
        return {
            **self._stats,
            "uptime_s": self._get_uptime(),
            "tcp_connected": self._tcp_connected,
            "queue_size": self._message_queue.qsize(),
            "priority_queue_size": self._priority_queue.qsize()
        }

    def create_telemetry_from_flight_data(
        self,
        latitude: float,
        longitude: float,
        altitude_m: float,
        heading_deg: float,
        speed_mps: float,
        battery_percent: float,
        gps_satellites: int,
        signal_strength_dbm: float,
        cpu_temp_c: float,
        gpu_temp_c: float,
        storage_free_gb: float,
        mission_progress_percent: float,
        current_waypoint: int,
        total_waypoints: int
    ) -> TelemetryPacket:
        """Helper to create telemetry packet from flight data."""
        return TelemetryPacket(
            timestamp=datetime.now().isoformat(),
            latitude=latitude,
            longitude=longitude,
            altitude_m=altitude_m,
            heading_deg=heading_deg,
            speed_mps=speed_mps,
            battery_percent=battery_percent,
            gps_satellites=gps_satellites,
            signal_strength_dbm=signal_strength_dbm,
            cpu_temp_c=cpu_temp_c,
            gpu_temp_c=gpu_temp_c,
            storage_free_gb=storage_free_gb,
            mission_progress_percent=mission_progress_percent,
            current_waypoint=current_waypoint,
            total_waypoints=total_waypoints
        )

    def create_detection_alert(
        self,
        detection_id: str,
        class_name: str,
        confidence: float,
        priority: str,
        latitude: float,
        longitude: float,
        altitude_m: float,
        image_path: Optional[str] = None,
        bbox: Optional[List[float]] = None,
        notes: str = ""
    ) -> DetectionAlert:
        """Helper to create detection alert from inference result."""
        # Determine if immediate action is required
        critical_classes = {"insulator_damaged", "conductor_damaged", "fire", "smoke"}
        requires_action = class_name in critical_classes or priority == "CRITICAL"

        return DetectionAlert(
            timestamp=datetime.now().isoformat(),
            detection_id=detection_id,
            class_name=class_name,
            confidence=confidence,
            priority=priority,
            latitude=latitude,
            longitude=longitude,
            altitude_m=altitude_m,
            image_path=image_path,
            bbox=bbox,
            requires_immediate_action=requires_action,
            notes=notes
        )


class GroundStationSimulator:
    """
    Simulates a ground station for testing without actual network connection.
    Useful for development and integration testing.
    """

    def __init__(self, log_dir: Optional[Path] = None):
        self.log_dir = log_dir or Path("/home/user/BAHB/data/ground_station_sim")
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logging.getLogger("BAHB.GroundStationSim")

        self.received_messages: List[Dict] = []
        self.alerts: List[Dict] = []
        self.detections: List[Dict] = []
        self.telemetry_history: List[Dict] = []

        self._running = False
        self._server_thread: Optional[threading.Thread] = None
        self._udp_socket: Optional[socket.socket] = None

    def start(self, port: int = 14550) -> bool:
        """Start the ground station simulator."""
        try:
            self._udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self._udp_socket.bind(("127.0.0.1", port))
            self._udp_socket.settimeout(1.0)

            self._running = True
            self._server_thread = threading.Thread(target=self._receive_loop, daemon=True)
            self._server_thread.start()

            self.logger.info(f"Ground station simulator started on port {port}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to start simulator: {e}")
            return False

    def stop(self):
        """Stop the ground station simulator."""
        self._running = False
        if self._server_thread:
            self._server_thread.join(timeout=2.0)
        if self._udp_socket:
            self._udp_socket.close()
        self.logger.info("Ground station simulator stopped")

    def _receive_loop(self):
        """Receive and process messages."""
        while self._running:
            try:
                data, addr = self._udp_socket.recvfrom(65535)
                message = json.loads(data.decode('utf-8'))
                self._process_message(message)
            except socket.timeout:
                continue
            except Exception as e:
                if self._running:
                    self.logger.error(f"Receive error: {e}")

    def _process_message(self, message: Dict):
        """Process received message."""
        self.received_messages.append(message)

        msg_type = message.get("type", "unknown")
        data = message.get("data", {})

        if msg_type == "alert":
            self.alerts.append(data)
            level = data.get("level", "info")
            title = data.get("title", "Unknown")
            self.logger.info(f"[ALERT:{level}] {title}")

        elif msg_type == "detection":
            self.detections.append(data)
            cls = data.get("class_name", "unknown")
            conf = data.get("confidence", 0)
            self.logger.info(f"[DETECTION] {cls} ({conf:.2%})")

        elif msg_type == "telemetry":
            self.telemetry_history.append(data)
            # Only log every 10th telemetry to reduce noise
            if len(self.telemetry_history) % 10 == 0:
                lat = data.get("latitude", 0)
                lon = data.get("longitude", 0)
                alt = data.get("altitude_m", 0)
                self.logger.debug(f"[TELEMETRY] ({lat:.6f}, {lon:.6f}) @ {alt:.1f}m")

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of received data."""
        return {
            "total_messages": len(self.received_messages),
            "alerts_count": len(self.alerts),
            "detections_count": len(self.detections),
            "telemetry_count": len(self.telemetry_history),
            "critical_alerts": len([a for a in self.alerts if a.get("level") == "critical"]),
            "critical_detections": len([d for d in self.detections if d.get("requires_immediate_action")])
        }

    def export_data(self, output_path: Optional[Path] = None) -> Path:
        """Export all received data to JSON file."""
        output_path = output_path or self.log_dir / f"sim_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        export_data = {
            "summary": self.get_summary(),
            "alerts": self.alerts,
            "detections": self.detections,
            "telemetry_sample": self.telemetry_history[-100:] if self.telemetry_history else []
        }

        with open(output_path, "w") as f:
            json.dump(export_data, f, indent=2)

        self.logger.info(f"Exported data to {output_path}")
        return output_path
