"""Priority-based alert routing system.

Enhances the base alert manager with:
- Intelligent priority routing
- Alert aggregation and deduplication
- Escalation policies
- Multi-channel delivery
- Alert correlation and grouping
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Callable, Any

from loguru import logger

from bahb.core.types import SeverityLevel


class AlertPriority(Enum):
    """Alert priority levels for routing."""
    P1_CRITICAL = 1    # Immediate response required
    P2_HIGH = 2        # Response within 15 minutes
    P3_MEDIUM = 3      # Response within 1 hour
    P4_LOW = 4         # Response within 24 hours
    P5_INFO = 5        # Informational, no response needed


class DeliveryChannel(Enum):
    """Alert delivery channels."""
    PAGERDUTY = "pagerduty"
    SLACK = "slack"
    EMAIL = "email"
    SMS = "sms"
    WEBHOOK = "webhook"
    MQTT = "mqtt"
    PUSH_NOTIFICATION = "push"
    IN_APP = "in_app"


@dataclass
class RoutingRule:
    """Rule for routing alerts."""
    name: str
    condition: Callable[[dict], bool]
    channels: List[DeliveryChannel]
    priority_override: Optional[AlertPriority] = None
    enabled: bool = True


@dataclass
class EscalationPolicy:
    """Policy for escalating unacknowledged alerts."""
    name: str
    initial_delay_minutes: int
    escalation_interval_minutes: int
    max_escalations: int
    escalation_channels: List[DeliveryChannel]


@dataclass
class EnhancedAlert:
    """Enhanced alert with routing metadata."""
    id: str
    severity: SeverityLevel
    priority: AlertPriority
    title: str
    message: str
    timestamp: datetime

    # Context
    facility_id: Optional[str] = None
    detection_id: Optional[str] = None
    metric_name: Optional[str] = None
    metric_value: Optional[float] = None
    threshold_value: Optional[float] = None

    # Routing
    channels_delivered: List[str] = field(default_factory=list)
    delivery_attempts: int = 0
    last_delivery_attempt: Optional[datetime] = None

    # State
    acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None

    # Correlation
    correlation_id: Optional[str] = None
    parent_alert_id: Optional[str] = None
    child_alert_count: int = 0

    # Escalation
    escalation_level: int = 0
    next_escalation_at: Optional[datetime] = None


class PriorityRouter:
    """
    Intelligent alert priority routing system.

    Features:
    - Priority-based channel selection
    - Alert aggregation to reduce noise
    - Automatic escalation for unacknowledged alerts
    - Correlation grouping for related alerts
    - Delivery tracking and retry
    """

    # Default priority mappings
    SEVERITY_TO_PRIORITY = {
        SeverityLevel.CRITICAL: AlertPriority.P1_CRITICAL,
        SeverityLevel.HIGH: AlertPriority.P2_HIGH,
        SeverityLevel.MEDIUM: AlertPriority.P3_MEDIUM,
        SeverityLevel.LOW: AlertPriority.P4_LOW,
        SeverityLevel.INFO: AlertPriority.P5_INFO,
    }

    # Default channels by priority
    DEFAULT_CHANNELS = {
        AlertPriority.P1_CRITICAL: [
            DeliveryChannel.PAGERDUTY,
            DeliveryChannel.SMS,
            DeliveryChannel.SLACK,
            DeliveryChannel.IN_APP,
        ],
        AlertPriority.P2_HIGH: [
            DeliveryChannel.SLACK,
            DeliveryChannel.EMAIL,
            DeliveryChannel.IN_APP,
        ],
        AlertPriority.P3_MEDIUM: [
            DeliveryChannel.EMAIL,
            DeliveryChannel.IN_APP,
        ],
        AlertPriority.P4_LOW: [
            DeliveryChannel.IN_APP,
        ],
        AlertPriority.P5_INFO: [
            DeliveryChannel.IN_APP,
        ],
    }

    def __init__(
        self,
        aggregation_window_seconds: int = 60,
        deduplication_window_seconds: int = 300,
        max_alerts_per_minute: int = 100,
    ):
        """
        Initialize priority router.

        Args:
            aggregation_window_seconds: Window for aggregating similar alerts
            deduplication_window_seconds: Window for deduplicating identical alerts
            max_alerts_per_minute: Rate limit for alert processing
        """
        self.aggregation_window = timedelta(seconds=aggregation_window_seconds)
        self.dedup_window = timedelta(seconds=deduplication_window_seconds)
        self.rate_limit = max_alerts_per_minute

        # State
        self._alerts: Dict[str, EnhancedAlert] = {}
        self._routing_rules: List[RoutingRule] = []
        self._escalation_policies: Dict[str, EscalationPolicy] = {}
        self._channel_handlers: Dict[DeliveryChannel, Callable] = {}

        # Aggregation
        self._aggregation_buffer: Dict[str, List[EnhancedAlert]] = {}
        self._last_aggregation_flush = datetime.now()

        # Rate limiting
        self._alerts_this_minute: List[datetime] = []

        # Statistics
        self._total_alerts_processed = 0
        self._total_alerts_delivered = 0
        self._alerts_aggregated = 0
        self._alerts_deduplicated = 0

        # Default escalation policy
        self.add_escalation_policy(EscalationPolicy(
            name="default",
            initial_delay_minutes=15,
            escalation_interval_minutes=30,
            max_escalations=3,
            escalation_channels=[DeliveryChannel.PAGERDUTY, DeliveryChannel.SMS],
        ))

        logger.info("PriorityRouter initialized")

    def add_routing_rule(self, rule: RoutingRule) -> None:
        """Add a custom routing rule."""
        self._routing_rules.append(rule)

    def add_escalation_policy(self, policy: EscalationPolicy) -> None:
        """Add an escalation policy."""
        self._escalation_policies[policy.name] = policy

    def register_channel_handler(
        self,
        channel: DeliveryChannel,
        handler: Callable,
    ) -> None:
        """Register a handler for a delivery channel."""
        self._channel_handlers[channel] = handler

    async def route_alert(
        self,
        severity: SeverityLevel,
        title: str,
        message: str,
        facility_id: Optional[str] = None,
        detection_id: Optional[str] = None,
        metric_name: Optional[str] = None,
        metric_value: Optional[float] = None,
        threshold_value: Optional[float] = None,
        custom_priority: Optional[AlertPriority] = None,
    ) -> EnhancedAlert:
        """
        Route an alert through the priority system.

        Args:
            severity: Alert severity
            title: Alert title
            message: Alert message
            facility_id: Associated facility
            detection_id: Associated detection
            metric_name: Metric that triggered alert
            metric_value: Current metric value
            threshold_value: Threshold that was exceeded
            custom_priority: Override priority

        Returns:
            EnhancedAlert that was created/routed
        """
        # Check rate limit
        if not self._check_rate_limit():
            logger.warning("Alert rate limit exceeded, dropping alert")
            return None

        # Determine priority
        priority = custom_priority or self.SEVERITY_TO_PRIORITY.get(
            severity, AlertPriority.P3_MEDIUM
        )

        # Create alert
        alert = EnhancedAlert(
            id=f"alert_{datetime.now().strftime('%Y%m%d%H%M%S')}_{self._total_alerts_processed:06d}",
            severity=severity,
            priority=priority,
            title=title,
            message=message,
            timestamp=datetime.now(),
            facility_id=facility_id,
            detection_id=detection_id,
            metric_name=metric_name,
            metric_value=metric_value,
            threshold_value=threshold_value,
        )

        # Check for deduplication
        if self._is_duplicate(alert):
            self._alerts_deduplicated += 1
            logger.debug(f"Alert deduplicated: {title}")
            return alert

        # Check for aggregation
        aggregation_key = self._get_aggregation_key(alert)
        if aggregation_key:
            if await self._aggregate_alert(alert, aggregation_key):
                return alert

        # Apply routing rules
        channels = self._determine_channels(alert)

        # Deliver to channels
        await self._deliver_alert(alert, channels)

        # Store alert
        self._alerts[alert.id] = alert
        self._total_alerts_processed += 1

        # Schedule escalation if needed
        if priority.value <= AlertPriority.P2_HIGH.value:
            self._schedule_escalation(alert)

        return alert

    def _check_rate_limit(self) -> bool:
        """Check if within rate limit."""
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)

        self._alerts_this_minute = [
            t for t in self._alerts_this_minute if t > minute_ago
        ]

        if len(self._alerts_this_minute) >= self.rate_limit:
            return False

        self._alerts_this_minute.append(now)
        return True

    def _is_duplicate(self, alert: EnhancedAlert) -> bool:
        """Check if alert is duplicate of recent alert."""
        dedup_cutoff = datetime.now() - self.dedup_window

        for existing in self._alerts.values():
            if existing.timestamp < dedup_cutoff:
                continue

            # Check for duplicate
            if (existing.title == alert.title and
                existing.facility_id == alert.facility_id and
                existing.metric_name == alert.metric_name):
                return True

        return False

    def _get_aggregation_key(self, alert: EnhancedAlert) -> Optional[str]:
        """Get aggregation key for alert."""
        # Aggregate by facility + severity
        if alert.facility_id:
            return f"{alert.facility_id}_{alert.severity.name}"
        return None

    async def _aggregate_alert(
        self,
        alert: EnhancedAlert,
        key: str,
    ) -> bool:
        """Attempt to aggregate alert with similar alerts."""
        if key not in self._aggregation_buffer:
            self._aggregation_buffer[key] = []

        buffer = self._aggregation_buffer[key]

        # Check if buffer has recent alerts
        cutoff = datetime.now() - self.aggregation_window
        buffer = [a for a in buffer if a.timestamp > cutoff]
        self._aggregation_buffer[key] = buffer

        if buffer:
            # Add to existing buffer
            buffer.append(alert)
            self._alerts_aggregated += 1

            # Create correlation
            if len(buffer) == 2:
                # First aggregation - set correlation ID
                correlation_id = f"corr_{alert.id}"
                for a in buffer:
                    a.correlation_id = correlation_id

            return True

        # Start new buffer
        buffer.append(alert)
        return False

    def _determine_channels(self, alert: EnhancedAlert) -> List[DeliveryChannel]:
        """Determine delivery channels for alert."""
        channels = set()

        # Apply custom routing rules first
        for rule in self._routing_rules:
            if rule.enabled and rule.condition(alert.__dict__):
                channels.update(rule.channels)
                if rule.priority_override:
                    alert.priority = rule.priority_override

        # Fall back to default channels
        if not channels:
            channels = set(self.DEFAULT_CHANNELS.get(
                alert.priority, [DeliveryChannel.IN_APP]
            ))

        return list(channels)

    async def _deliver_alert(
        self,
        alert: EnhancedAlert,
        channels: List[DeliveryChannel],
    ) -> None:
        """Deliver alert to specified channels."""
        for channel in channels:
            alert.delivery_attempts += 1
            alert.last_delivery_attempt = datetime.now()

            try:
                handler = self._channel_handlers.get(channel)
                if handler:
                    await handler(alert)
                    alert.channels_delivered.append(channel.value)
                    self._total_alerts_delivered += 1
                    logger.debug(f"Alert {alert.id} delivered to {channel.value}")
                else:
                    logger.warning(f"No handler for channel {channel.value}")
            except Exception as e:
                logger.error(f"Failed to deliver alert to {channel.value}: {e}")

    def _schedule_escalation(self, alert: EnhancedAlert) -> None:
        """Schedule escalation for unacknowledged alert."""
        policy = self._escalation_policies.get("default")
        if policy:
            alert.next_escalation_at = datetime.now() + timedelta(
                minutes=policy.initial_delay_minutes
            )

    async def check_escalations(self) -> int:
        """Check and process pending escalations."""
        escalated = 0
        now = datetime.now()

        for alert in self._alerts.values():
            if alert.acknowledged or alert.resolved:
                continue

            if alert.next_escalation_at and alert.next_escalation_at <= now:
                policy = self._escalation_policies.get("default")
                if policy and alert.escalation_level < policy.max_escalations:
                    # Escalate
                    alert.escalation_level += 1
                    await self._deliver_alert(alert, policy.escalation_channels)

                    # Schedule next escalation
                    alert.next_escalation_at = now + timedelta(
                        minutes=policy.escalation_interval_minutes
                    )

                    escalated += 1
                    logger.info(
                        f"Alert {alert.id} escalated to level {alert.escalation_level}"
                    )

        return escalated

    async def flush_aggregation_buffer(self) -> int:
        """Flush aggregation buffer and send aggregated alerts."""
        flushed = 0

        for key, alerts in list(self._aggregation_buffer.items()):
            if not alerts:
                continue

            # Check if buffer is stale
            oldest = min(a.timestamp for a in alerts)
            if datetime.now() - oldest > self.aggregation_window:
                # Send aggregated alert
                if len(alerts) > 1:
                    # Create summary alert
                    summary = EnhancedAlert(
                        id=f"agg_{alerts[0].id}",
                        severity=max(a.severity for a in alerts),
                        priority=min(a.priority for a in alerts),
                        title=f"[{len(alerts)} alerts] {alerts[0].title}",
                        message=f"Aggregated {len(alerts)} similar alerts. "
                                f"Facilities: {set(a.facility_id for a in alerts if a.facility_id)}",
                        timestamp=datetime.now(),
                        correlation_id=alerts[0].correlation_id,
                        child_alert_count=len(alerts),
                    )

                    channels = self._determine_channels(summary)
                    await self._deliver_alert(summary, channels)
                    self._alerts[summary.id] = summary
                else:
                    # Single alert, deliver normally
                    channels = self._determine_channels(alerts[0])
                    await self._deliver_alert(alerts[0], channels)
                    self._alerts[alerts[0].id] = alerts[0]

                flushed += len(alerts)
                del self._aggregation_buffer[key]

        return flushed

    def acknowledge_alert(
        self,
        alert_id: str,
        acknowledged_by: str,
    ) -> bool:
        """Acknowledge an alert."""
        alert = self._alerts.get(alert_id)
        if not alert:
            return False

        alert.acknowledged = True
        alert.acknowledged_at = datetime.now()
        alert.acknowledged_by = acknowledged_by
        alert.next_escalation_at = None  # Cancel escalation

        logger.info(f"Alert {alert_id} acknowledged by {acknowledged_by}")
        return True

    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert."""
        alert = self._alerts.get(alert_id)
        if not alert:
            return False

        alert.resolved = True
        alert.resolved_at = datetime.now()

        logger.info(f"Alert {alert_id} resolved")
        return True

    def get_active_alerts(
        self,
        priority: Optional[AlertPriority] = None,
        facility_id: Optional[str] = None,
    ) -> List[EnhancedAlert]:
        """Get active (unresolved) alerts."""
        alerts = [a for a in self._alerts.values() if not a.resolved]

        if priority:
            alerts = [a for a in alerts if a.priority == priority]

        if facility_id:
            alerts = [a for a in alerts if a.facility_id == facility_id]

        return sorted(alerts, key=lambda a: (a.priority.value, a.timestamp))

    def get_statistics(self) -> dict:
        """Get routing statistics."""
        active = [a for a in self._alerts.values() if not a.resolved]
        unack = [a for a in active if not a.acknowledged]

        by_priority = {}
        for priority in AlertPriority:
            by_priority[priority.name] = sum(
                1 for a in active if a.priority == priority
            )

        return {
            "total_processed": self._total_alerts_processed,
            "total_delivered": self._total_alerts_delivered,
            "alerts_aggregated": self._alerts_aggregated,
            "alerts_deduplicated": self._alerts_deduplicated,
            "active_alerts": len(active),
            "unacknowledged": len(unack),
            "by_priority": by_priority,
            "escalation_pending": sum(
                1 for a in unack if a.next_escalation_at
            ),
        }
