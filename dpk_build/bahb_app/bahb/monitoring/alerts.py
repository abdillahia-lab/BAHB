"""
Alert system for BAHB monitoring.

Provides comprehensive alerting with:
- Critical detection alerts (damage, hotspot, leak)
- System health alerts
- MQTT publishing
- Webhook notifications
- Alert deduplication and rate limiting
"""

import asyncio
import hashlib
import json
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Callable
from loguru import logger


class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertCategory(Enum):
    """Alert categories."""
    DETECTION = "detection"
    THERMAL = "thermal"
    SYSTEM = "system"
    HEALTH = "health"
    PERFORMANCE = "performance"


@dataclass
class Alert:
    """Alert data structure."""
    id: str
    timestamp: datetime
    severity: AlertSeverity
    category: AlertCategory
    title: str
    message: str
    source: str
    metadata: Dict = None
    dedupe_key: Optional[str] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "severity": self.severity.value,
            "category": self.category.value,
            "title": self.title,
            "message": self.message,
            "source": self.source,
            "metadata": self.metadata or {},
        }

    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())


@dataclass
class AlertRule:
    """Alert rule configuration."""
    name: str
    enabled: bool = True
    severity: AlertSeverity = AlertSeverity.WARNING
    category: AlertCategory = AlertCategory.SYSTEM
    condition: Callable = None
    message_template: str = ""
    rate_limit_seconds: int = 60
    deduplicate: bool = True


class AlertSystem:
    """
    Comprehensive alert system for BAHB monitoring.

    Features:
    - Multiple alert channels (MQTT, webhook, local)
    - Alert deduplication
    - Rate limiting
    - Priority routing
    - Alert history
    """

    def __init__(
        self,
        mqtt_broker: Optional[str] = None,
        mqtt_port: int = 1883,
        mqtt_topic: str = "bahb/alerts",
        webhook_url: Optional[str] = None,
        enable_local_alerts: bool = True,
    ):
        """
        Initialize alert system.

        Args:
            mqtt_broker: MQTT broker address
            mqtt_port: MQTT broker port
            mqtt_topic: MQTT topic for alerts
            webhook_url: Webhook URL for HTTP alerts
            enable_local_alerts: Enable local logging alerts
        """
        self.mqtt_broker = mqtt_broker
        self.mqtt_port = mqtt_port
        self.mqtt_topic = mqtt_topic
        self.webhook_url = webhook_url
        self.enable_local_alerts = enable_local_alerts

        # MQTT client
        self._mqtt_client = None
        self._mqtt_connected = False

        # HTTP session for webhooks
        self._http_session = None

        # Alert tracking
        self._alert_history: List[Alert] = []
        self._max_history = 1000
        self._alert_counter = 0

        # Deduplication
        self._recent_alerts: Set[str] = set()
        self._dedupe_window_seconds = 300  # 5 minutes

        # Rate limiting
        self._rate_limit_cache: Dict[str, List[datetime]] = {}

        # Alert rules
        self._rules: Dict[str, AlertRule] = {}
        self._setup_default_rules()

        # Statistics
        self.stats = {
            "total_alerts": 0,
            "alerts_by_severity": {s.value: 0 for s in AlertSeverity},
            "alerts_by_category": {c.value: 0 for c in AlertCategory},
            "deduplicated_alerts": 0,
            "rate_limited_alerts": 0,
        }

        # Background tasks
        self._cleanup_task: Optional[asyncio.Task] = None
        self._running = False

    def _setup_default_rules(self) -> None:
        """Setup default alert rules."""
        # Critical detection alerts
        self._rules["critical_damage"] = AlertRule(
            name="critical_damage",
            severity=AlertSeverity.CRITICAL,
            category=AlertCategory.DETECTION,
            message_template="Critical damage detected: {details}",
            rate_limit_seconds=30,
        )

        self._rules["thermal_hotspot"] = AlertRule(
            name="thermal_hotspot",
            severity=AlertSeverity.CRITICAL,
            category=AlertCategory.THERMAL,
            message_template="Thermal hotspot detected: {temperature}°C at {location}",
            rate_limit_seconds=60,
        )

        self._rules["oil_leak"] = AlertRule(
            name="oil_leak",
            severity=AlertSeverity.CRITICAL,
            category=AlertCategory.DETECTION,
            message_template="Oil leak detected at {location}",
            rate_limit_seconds=30,
        )

        # System health alerts
        self._rules["gpu_memory_high"] = AlertRule(
            name="gpu_memory_high",
            severity=AlertSeverity.WARNING,
            category=AlertCategory.HEALTH,
            message_template="GPU memory usage high: {usage_mb}MB ({percent}%)",
            rate_limit_seconds=300,
        )

        self._rules["disk_space_low"] = AlertRule(
            name="disk_space_low",
            severity=AlertSeverity.WARNING,
            category=AlertCategory.HEALTH,
            message_template="Disk space low: {free_gb}GB remaining",
            rate_limit_seconds=600,
        )

        self._rules["camera_disconnected"] = AlertRule(
            name="camera_disconnected",
            severity=AlertSeverity.CRITICAL,
            category=AlertCategory.HEALTH,
            message_template="Camera disconnected: {camera_name}",
            rate_limit_seconds=60,
        )

        # Performance alerts
        self._rules["low_fps"] = AlertRule(
            name="low_fps",
            severity=AlertSeverity.WARNING,
            category=AlertCategory.PERFORMANCE,
            message_template="Low FPS detected: {fps:.1f} FPS",
            rate_limit_seconds=120,
        )

        self._rules["high_latency"] = AlertRule(
            name="high_latency",
            severity=AlertSeverity.WARNING,
            category=AlertCategory.PERFORMANCE,
            message_template="High inference latency: {latency_ms:.1f}ms",
            rate_limit_seconds=120,
        )

    async def start(self) -> None:
        """Start the alert system."""
        logger.info("Starting alert system")

        # Connect to MQTT
        if self.mqtt_broker:
            await self._connect_mqtt()

        # Initialize HTTP session
        if self.webhook_url:
            await self._init_http_session()

        # Start background tasks
        self._running = True
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())

        logger.info("Alert system started")

    async def stop(self) -> None:
        """Stop the alert system."""
        logger.info("Stopping alert system")
        self._running = False

        # Stop cleanup task
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        # Disconnect MQTT
        if self._mqtt_client:
            await self._disconnect_mqtt()

        # Close HTTP session
        if self._http_session:
            await self._http_session.close()

        logger.info("Alert system stopped")

    async def _connect_mqtt(self) -> None:
        """Connect to MQTT broker."""
        try:
            import paho.mqtt.client as mqtt

            self._mqtt_client = mqtt.Client()

            def on_connect(client, userdata, flags, rc):
                if rc == 0:
                    self._mqtt_connected = True
                    logger.info(f"Connected to MQTT broker: {self.mqtt_broker}")
                else:
                    logger.error(f"MQTT connection failed: {rc}")

            def on_disconnect(client, userdata, rc):
                self._mqtt_connected = False
                logger.warning(f"MQTT disconnected: {rc}")

            self._mqtt_client.on_connect = on_connect
            self._mqtt_client.on_disconnect = on_disconnect

            self._mqtt_client.connect_async(self.mqtt_broker, self.mqtt_port)
            self._mqtt_client.loop_start()

        except ImportError:
            logger.warning("paho-mqtt not available, MQTT alerts disabled")
        except Exception as e:
            logger.error(f"MQTT connection error: {e}")

    async def _disconnect_mqtt(self) -> None:
        """Disconnect from MQTT broker."""
        if self._mqtt_client:
            self._mqtt_client.loop_stop()
            self._mqtt_client.disconnect()
            self._mqtt_connected = False

    async def _init_http_session(self) -> None:
        """Initialize HTTP session for webhooks."""
        try:
            import aiohttp
            self._http_session = aiohttp.ClientSession()
        except ImportError:
            logger.warning("aiohttp not available, webhook alerts disabled")

    async def _cleanup_loop(self) -> None:
        """Background cleanup loop."""
        while self._running:
            try:
                await asyncio.sleep(60)  # Run every minute

                # Clean up old dedupe entries
                current_time = datetime.now()
                cutoff_time = current_time - timedelta(seconds=self._dedupe_window_seconds)

                # Clean up rate limit cache
                for key in list(self._rate_limit_cache.keys()):
                    self._rate_limit_cache[key] = [
                        t for t in self._rate_limit_cache[key] if t > cutoff_time
                    ]
                    if not self._rate_limit_cache[key]:
                        del self._rate_limit_cache[key]

                # Limit alert history
                if len(self._alert_history) > self._max_history:
                    self._alert_history = self._alert_history[-self._max_history:]

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")

    async def send_alert(
        self,
        severity: AlertSeverity,
        category: AlertCategory,
        title: str,
        message: str,
        source: str = "BAHB",
        metadata: Optional[Dict] = None,
        rule_name: Optional[str] = None,
    ) -> Optional[str]:
        """
        Send an alert.

        Args:
            severity: Alert severity
            category: Alert category
            title: Alert title
            message: Alert message
            source: Alert source
            metadata: Additional metadata
            rule_name: Optional rule name for rate limiting

        Returns:
            Alert ID if sent, None if deduplicated/rate-limited
        """
        # Check rule-based rate limiting
        if rule_name and rule_name in self._rules:
            rule = self._rules[rule_name]

            if not rule.enabled:
                return None

            if not self._check_rate_limit(rule_name, rule.rate_limit_seconds):
                self.stats["rate_limited_alerts"] += 1
                logger.debug(f"Alert rate-limited: {rule_name}")
                return None

            # Override severity/category from rule
            severity = rule.severity
            category = rule.category

        # Create dedupe key
        dedupe_key = self._create_dedupe_key(severity, category, title, message)

        # Check deduplication
        if dedupe_key in self._recent_alerts:
            self.stats["deduplicated_alerts"] += 1
            logger.debug(f"Alert deduplicated: {title}")
            return None

        # Create alert
        self._alert_counter += 1
        alert_id = f"BAHB-{self._alert_counter:06d}"

        alert = Alert(
            id=alert_id,
            timestamp=datetime.now(),
            severity=severity,
            category=category,
            title=title,
            message=message,
            source=source,
            metadata=metadata,
            dedupe_key=dedupe_key,
        )

        # Add to history
        self._alert_history.append(alert)
        self._recent_alerts.add(dedupe_key)

        # Update statistics
        self.stats["total_alerts"] += 1
        self.stats["alerts_by_severity"][severity.value] += 1
        self.stats["alerts_by_category"][category.value] += 1

        # Send through channels
        await self._dispatch_alert(alert)

        return alert_id

    async def _dispatch_alert(self, alert: Alert) -> None:
        """Dispatch alert through all channels."""
        tasks = []

        # Local logging
        if self.enable_local_alerts:
            tasks.append(self._send_local_alert(alert))

        # MQTT
        if self._mqtt_connected:
            tasks.append(self._send_mqtt_alert(alert))

        # Webhook
        if self._http_session and self.webhook_url:
            tasks.append(self._send_webhook_alert(alert))

        # Execute all in parallel
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _send_local_alert(self, alert: Alert) -> None:
        """Send local log alert."""
        log_method = {
            AlertSeverity.INFO: logger.info,
            AlertSeverity.WARNING: logger.warning,
            AlertSeverity.CRITICAL: logger.critical,
        }.get(alert.severity, logger.info)

        log_method(
            f"[{alert.category.value.upper()}] {alert.title} - {alert.message}"
        )

    async def _send_mqtt_alert(self, alert: Alert) -> None:
        """Send alert via MQTT."""
        try:
            payload = alert.to_json()
            result = self._mqtt_client.publish(self.mqtt_topic, payload, qos=1)

            if result.rc != 0:
                logger.error(f"MQTT publish failed: {result.rc}")

        except Exception as e:
            logger.error(f"MQTT alert error: {e}")

    async def _send_webhook_alert(self, alert: Alert) -> None:
        """Send alert via webhook."""
        try:
            async with self._http_session.post(
                self.webhook_url,
                json=alert.to_dict(),
                headers={"Content-Type": "application/json"},
                timeout=5.0
            ) as response:
                if response.status >= 400:
                    logger.error(f"Webhook alert failed: {response.status}")

        except asyncio.TimeoutError:
            logger.error("Webhook alert timeout")
        except Exception as e:
            logger.error(f"Webhook alert error: {e}")

    def _create_dedupe_key(
        self,
        severity: AlertSeverity,
        category: AlertCategory,
        title: str,
        message: str
    ) -> str:
        """Create deduplication key."""
        key_string = f"{severity.value}:{category.value}:{title}:{message}"
        return hashlib.md5(key_string.encode()).hexdigest()

    def _check_rate_limit(self, key: str, limit_seconds: int) -> bool:
        """
        Check if alert is within rate limit.

        Returns:
            True if alert should be sent, False if rate-limited
        """
        current_time = datetime.now()
        cutoff_time = current_time - timedelta(seconds=limit_seconds)

        # Get recent alerts for this key
        if key not in self._rate_limit_cache:
            self._rate_limit_cache[key] = []

        # Clean up old entries
        self._rate_limit_cache[key] = [
            t for t in self._rate_limit_cache[key] if t > cutoff_time
        ]

        # Check if we can send
        if len(self._rate_limit_cache[key]) > 0:
            # Already sent within rate limit window
            return False

        # Record this alert
        self._rate_limit_cache[key].append(current_time)
        return True

    # Pre-configured alert methods

    async def alert_critical_detection(
        self,
        detection_type: str,
        location: Optional[str] = None,
        confidence: Optional[float] = None,
    ) -> Optional[str]:
        """Send critical detection alert."""
        metadata = {
            "detection_type": detection_type,
            "location": location,
            "confidence": confidence,
        }

        message = f"Critical detection: {detection_type}"
        if location:
            message += f" at {location}"
        if confidence:
            message += f" (confidence: {confidence:.1%})"

        return await self.send_alert(
            severity=AlertSeverity.CRITICAL,
            category=AlertCategory.DETECTION,
            title=f"Critical {detection_type} Detected",
            message=message,
            metadata=metadata,
            rule_name="critical_damage" if "damage" in detection_type.lower() else None,
        )

    async def alert_thermal_hotspot(
        self,
        temperature: float,
        location: Optional[str] = None,
    ) -> Optional[str]:
        """Send thermal hotspot alert."""
        metadata = {
            "temperature_celsius": temperature,
            "location": location,
        }

        message = f"Thermal hotspot: {temperature:.1f}°C"
        if location:
            message += f" at {location}"

        return await self.send_alert(
            severity=AlertSeverity.CRITICAL,
            category=AlertCategory.THERMAL,
            title="Thermal Hotspot Detected",
            message=message,
            metadata=metadata,
            rule_name="thermal_hotspot",
        )

    async def alert_system_health(
        self,
        component: str,
        status: str,
        details: Optional[Dict] = None,
    ) -> Optional[str]:
        """Send system health alert."""
        return await self.send_alert(
            severity=AlertSeverity.WARNING,
            category=AlertCategory.HEALTH,
            title=f"{component} Health Issue",
            message=status,
            metadata=details,
        )

    async def alert_performance_degradation(
        self,
        metric: str,
        current_value: float,
        threshold: float,
    ) -> Optional[str]:
        """Send performance degradation alert."""
        metadata = {
            "metric": metric,
            "current_value": current_value,
            "threshold": threshold,
        }

        return await self.send_alert(
            severity=AlertSeverity.WARNING,
            category=AlertCategory.PERFORMANCE,
            title=f"Performance Degradation: {metric}",
            message=f"{metric} is {current_value:.2f} (threshold: {threshold:.2f})",
            metadata=metadata,
        )

    async def alert_camera_disconnected(
        self,
        camera_name: str,
    ) -> Optional[str]:
        """Send camera disconnection alert."""
        return await self.send_alert(
            severity=AlertSeverity.CRITICAL,
            category=AlertCategory.HEALTH,
            title="Camera Disconnected",
            message=f"Camera '{camera_name}' has disconnected",
            metadata={"camera_name": camera_name},
            rule_name="camera_disconnected",
        )

    async def alert_gpu_memory_high(
        self,
        usage_mb: float,
        total_mb: float,
    ) -> Optional[str]:
        """Send GPU memory high alert."""
        percent = (usage_mb / total_mb) * 100

        return await self.send_alert(
            severity=AlertSeverity.WARNING,
            category=AlertCategory.HEALTH,
            title="GPU Memory High",
            message=f"GPU memory usage: {usage_mb:.0f}MB / {total_mb:.0f}MB ({percent:.1f}%)",
            metadata={"usage_mb": usage_mb, "total_mb": total_mb, "percent": percent},
            rule_name="gpu_memory_high",
        )

    async def alert_disk_space_low(
        self,
        free_gb: float,
        total_gb: float,
    ) -> Optional[str]:
        """Send disk space low alert."""
        percent_free = (free_gb / total_gb) * 100

        return await self.send_alert(
            severity=AlertSeverity.WARNING,
            category=AlertCategory.HEALTH,
            title="Disk Space Low",
            message=f"Disk space low: {free_gb:.1f}GB free ({percent_free:.1f}%)",
            metadata={"free_gb": free_gb, "total_gb": total_gb, "percent_free": percent_free},
            rule_name="disk_space_low",
        )

    def get_recent_alerts(
        self,
        count: int = 10,
        severity: Optional[AlertSeverity] = None,
        category: Optional[AlertCategory] = None,
    ) -> List[Alert]:
        """Get recent alerts with optional filtering."""
        filtered = self._alert_history

        if severity:
            filtered = [a for a in filtered if a.severity == severity]

        if category:
            filtered = [a for a in filtered if a.category == category]

        return filtered[-count:]

    def get_statistics(self) -> Dict:
        """Get alert statistics."""
        return {
            **self.stats,
            "total_history": len(self._alert_history),
            "mqtt_connected": self._mqtt_connected,
            "webhook_enabled": self.webhook_url is not None,
        }

    def add_rule(self, rule: AlertRule) -> None:
        """Add or update an alert rule."""
        self._rules[rule.name] = rule

    def enable_rule(self, rule_name: str) -> bool:
        """Enable an alert rule."""
        if rule_name in self._rules:
            self._rules[rule_name].enabled = True
            return True
        return False

    def disable_rule(self, rule_name: str) -> bool:
        """Disable an alert rule."""
        if rule_name in self._rules:
            self._rules[rule_name].enabled = False
            return True
        return False
