"""
Real-Time Monitoring Dashboard

Provides live monitoring of:
- Tournament progress and agent performance
- Strategy metrics and P&L
- System health and cluster status
- Alerts and notifications
"""

import asyncio
import json
from dataclasses import dataclass, field, asdict
from typing import Any, Callable, Dict, List, Optional, Set
from enum import Enum
from datetime import datetime, timedelta
from collections import deque
import threading
import time


class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class MetricType(Enum):
    """Types of metrics."""
    COUNTER = "counter"     # Monotonically increasing
    GAUGE = "gauge"         # Can go up or down
    HISTOGRAM = "histogram" # Distribution
    RATE = "rate"           # Events per second


@dataclass
class Alert:
    """An alert notification."""
    alert_id: str
    severity: AlertSeverity
    title: str
    message: str
    source: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Metric:
    """A metric data point."""
    name: str
    value: float
    metric_type: MetricType
    labels: Dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'value': self.value,
            'type': self.metric_type.value,
            'labels': self.labels,
            'timestamp': self.timestamp.isoformat(),
        }


@dataclass
class AgentPerformance:
    """Real-time agent performance data."""
    agent_id: str
    team_id: str
    current_pnl: float = 0.0
    daily_pnl: float = 0.0
    total_return_pct: float = 0.0
    sharpe_ratio: float = 0.0
    win_rate: float = 0.0
    num_trades: int = 0
    active_positions: int = 0
    drawdown_pct: float = 0.0
    last_updated: datetime = field(default_factory=datetime.utcnow)


@dataclass
class TournamentStatus:
    """Tournament progress status."""
    current_round: int
    total_rounds: int
    phase: str
    teams_remaining: int
    total_teams: int
    round_start_time: datetime = field(default_factory=datetime.utcnow)
    estimated_completion: Optional[datetime] = None
    leader_team_id: Optional[str] = None
    leader_score: float = 0.0


@dataclass
class SystemHealth:
    """System health metrics."""
    cpu_usage_pct: float = 0.0
    memory_usage_pct: float = 0.0
    disk_usage_pct: float = 0.0
    active_workers: int = 0
    total_workers: int = 0
    queue_depth: int = 0
    avg_latency_ms: float = 0.0
    error_rate_pct: float = 0.0
    uptime_seconds: float = 0.0


class MetricsCollector:
    """
    Collects and stores metrics for monitoring.

    Thread-safe with configurable retention.
    """

    def __init__(
        self,
        max_points: int = 10000,
        aggregation_interval_seconds: int = 60
    ):
        self.max_points = max_points
        self.aggregation_interval = aggregation_interval_seconds

        # Metric storage: name -> deque of (timestamp, value)
        self._metrics: Dict[str, deque] = {}
        self._lock = threading.Lock()

        # Aggregated metrics (minute buckets)
        self._aggregated: Dict[str, Dict[str, List[float]]] = {}

    def record(self, metric: Metric) -> None:
        """Record a metric data point."""
        with self._lock:
            key = self._metric_key(metric.name, metric.labels)

            if key not in self._metrics:
                self._metrics[key] = deque(maxlen=self.max_points)

            self._metrics[key].append((metric.timestamp, metric.value))

    def record_value(
        self,
        name: str,
        value: float,
        metric_type: MetricType = MetricType.GAUGE,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Convenience method to record a value."""
        metric = Metric(
            name=name,
            value=value,
            metric_type=metric_type,
            labels=labels or {}
        )
        self.record(metric)

    def get_latest(
        self,
        name: str,
        labels: Optional[Dict[str, str]] = None
    ) -> Optional[float]:
        """Get latest value for a metric."""
        with self._lock:
            key = self._metric_key(name, labels or {})
            if key in self._metrics and self._metrics[key]:
                return self._metrics[key][-1][1]
        return None

    def get_history(
        self,
        name: str,
        labels: Optional[Dict[str, str]] = None,
        duration_seconds: int = 3600
    ) -> List[Tuple[datetime, float]]:
        """Get metric history."""
        with self._lock:
            key = self._metric_key(name, labels or {})
            if key not in self._metrics:
                return []

            cutoff = datetime.utcnow() - timedelta(seconds=duration_seconds)
            return [
                (ts, val) for ts, val in self._metrics[key]
                if ts > cutoff
            ]

    def get_statistics(
        self,
        name: str,
        labels: Optional[Dict[str, str]] = None,
        duration_seconds: int = 3600
    ) -> Dict[str, float]:
        """Get statistics for a metric."""
        history = self.get_history(name, labels, duration_seconds)

        if not history:
            return {}

        values = [v for _, v in history]

        import numpy as np
        return {
            'count': len(values),
            'min': float(np.min(values)),
            'max': float(np.max(values)),
            'mean': float(np.mean(values)),
            'std': float(np.std(values)),
            'p50': float(np.percentile(values, 50)),
            'p95': float(np.percentile(values, 95)),
            'p99': float(np.percentile(values, 99)),
        }

    def _metric_key(self, name: str, labels: Dict[str, str]) -> str:
        """Generate unique key for metric + labels."""
        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}{{{label_str}}}"


class AlertManager:
    """
    Manages alerts and notifications.

    Supports deduplication, escalation, and notification routing.
    """

    def __init__(
        self,
        dedup_window_seconds: int = 300,
        max_alerts: int = 1000
    ):
        self.dedup_window = dedup_window_seconds
        self.max_alerts = max_alerts

        self.alerts: Dict[str, Alert] = {}
        self.alert_history: deque = deque(maxlen=max_alerts)
        self.subscribers: List[Callable[[Alert], None]] = []

        self._lock = threading.Lock()

    def fire(
        self,
        severity: AlertSeverity,
        title: str,
        message: str,
        source: str,
        metadata: Optional[Dict] = None
    ) -> Optional[Alert]:
        """Fire an alert."""
        with self._lock:
            # Check for duplicate
            dedup_key = f"{source}:{title}"
            if dedup_key in self.alerts:
                existing = self.alerts[dedup_key]
                if (datetime.utcnow() - existing.timestamp).seconds < self.dedup_window:
                    return None  # Deduplicated

            # Create alert
            alert = Alert(
                alert_id=f"alert_{len(self.alert_history)}_{datetime.utcnow().timestamp()}",
                severity=severity,
                title=title,
                message=message,
                source=source,
                metadata=metadata or {}
            )

            self.alerts[dedup_key] = alert
            self.alert_history.append(alert)

            # Notify subscribers
            for callback in self.subscribers:
                try:
                    callback(alert)
                except Exception as e:
                    print(f"Alert callback error: {e}")

            return alert

    def acknowledge(self, alert_id: str, user: str) -> bool:
        """Acknowledge an alert."""
        with self._lock:
            for key, alert in self.alerts.items():
                if alert.alert_id == alert_id:
                    alert.acknowledged = True
                    alert.acknowledged_by = user
                    return True
            return False

    def resolve(self, alert_id: str) -> bool:
        """Resolve an alert."""
        with self._lock:
            for key, alert in list(self.alerts.items()):
                if alert.alert_id == alert_id:
                    alert.resolved = True
                    alert.resolved_at = datetime.utcnow()
                    del self.alerts[key]
                    return True
            return False

    def get_active(
        self,
        severity: Optional[AlertSeverity] = None
    ) -> List[Alert]:
        """Get active alerts."""
        with self._lock:
            alerts = list(self.alerts.values())
            if severity:
                alerts = [a for a in alerts if a.severity == severity]
            return sorted(alerts, key=lambda a: a.timestamp, reverse=True)

    def subscribe(self, callback: Callable[[Alert], None]) -> None:
        """Subscribe to alerts."""
        self.subscribers.append(callback)


class DashboardState:
    """
    Aggregates all dashboard state.

    Updated in real-time and pushed to connected clients.
    """

    def __init__(self):
        self.tournament_status: Optional[TournamentStatus] = None
        self.agent_performances: Dict[str, AgentPerformance] = {}
        self.team_rankings: List[Dict[str, Any]] = []
        self.system_health: SystemHealth = SystemHealth()
        self.recent_trades: deque = deque(maxlen=100)
        self.pnl_chart_data: List[Dict] = []
        self.last_updated: datetime = datetime.utcnow()

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            'tournament': asdict(self.tournament_status) if self.tournament_status else None,
            'agents': {k: asdict(v) for k, v in self.agent_performances.items()},
            'rankings': self.team_rankings,
            'health': asdict(self.system_health),
            'recent_trades': list(self.recent_trades),
            'pnl_chart': self.pnl_chart_data,
            'last_updated': self.last_updated.isoformat(),
        }


class WebSocketManager:
    """
    Manages WebSocket connections for real-time updates.

    Handles subscriptions and message broadcasting.
    """

    def __init__(self):
        self.connections: Set[Any] = set()
        self.subscriptions: Dict[str, Set[Any]] = {}
        self._lock = threading.Lock()

    async def connect(self, websocket: Any) -> None:
        """Handle new WebSocket connection."""
        with self._lock:
            self.connections.add(websocket)

    async def disconnect(self, websocket: Any) -> None:
        """Handle WebSocket disconnection."""
        with self._lock:
            self.connections.discard(websocket)
            for topic_subs in self.subscriptions.values():
                topic_subs.discard(websocket)

    def subscribe(self, websocket: Any, topic: str) -> None:
        """Subscribe to a topic."""
        with self._lock:
            if topic not in self.subscriptions:
                self.subscriptions[topic] = set()
            self.subscriptions[topic].add(websocket)

    async def broadcast(self, message: Dict) -> None:
        """Broadcast message to all connections."""
        if not self.connections:
            return

        message_json = json.dumps(message)
        dead_connections = set()

        for ws in self.connections:
            try:
                await ws.send_text(message_json)
            except Exception:
                dead_connections.add(ws)

        # Clean up dead connections
        for ws in dead_connections:
            await self.disconnect(ws)

    async def broadcast_to_topic(self, topic: str, message: Dict) -> None:
        """Broadcast to subscribers of a topic."""
        subscribers = self.subscriptions.get(topic, set())
        if not subscribers:
            return

        message_json = json.dumps(message)

        for ws in list(subscribers):
            try:
                await ws.send_text(message_json)
            except Exception:
                subscribers.discard(ws)


class RealTimeMonitor:
    """
    Main real-time monitoring system.

    Integrates metrics, alerts, and WebSocket updates.
    """

    def __init__(
        self,
        update_interval_seconds: float = 1.0
    ):
        self.update_interval = update_interval_seconds

        self.metrics = MetricsCollector()
        self.alerts = AlertManager()
        self.ws_manager = WebSocketManager()
        self.state = DashboardState()

        self._running = False
        self._update_thread: Optional[threading.Thread] = None

        # Alert thresholds
        self.thresholds = {
            'drawdown_warning': 0.05,   # 5% drawdown warning
            'drawdown_critical': 0.10,  # 10% drawdown critical
            'error_rate_warning': 0.01, # 1% error rate warning
            'latency_warning_ms': 100,  # 100ms latency warning
        }

    def start(self) -> None:
        """Start the monitoring system."""
        self._running = True
        self._update_thread = threading.Thread(target=self._update_loop)
        self._update_thread.daemon = True
        self._update_thread.start()

    def stop(self) -> None:
        """Stop the monitoring system."""
        self._running = False
        if self._update_thread:
            self._update_thread.join(timeout=5)

    def _update_loop(self) -> None:
        """Main update loop."""
        while self._running:
            try:
                self._update_state()
                self._check_alerts()
            except Exception as e:
                print(f"Monitor update error: {e}")

            time.sleep(self.update_interval)

    def _update_state(self) -> None:
        """Update dashboard state."""
        # Update system health
        self.state.system_health = self._collect_system_health()

        # Update rankings
        self._update_rankings()

        # Update chart data
        self._update_charts()

        self.state.last_updated = datetime.utcnow()

    def _collect_system_health(self) -> SystemHealth:
        """Collect system health metrics."""
        import os

        # Get basic system metrics
        try:
            import psutil
            cpu = psutil.cpu_percent()
            memory = psutil.virtual_memory().percent
            disk = psutil.disk_usage('/').percent
        except ImportError:
            cpu = memory = disk = 0.0

        # Get from metrics collector
        active_workers = self.metrics.get_latest('workers.active') or 0
        total_workers = self.metrics.get_latest('workers.total') or 0
        queue_depth = self.metrics.get_latest('queue.depth') or 0
        avg_latency = self.metrics.get_latest('latency.avg') or 0

        return SystemHealth(
            cpu_usage_pct=cpu,
            memory_usage_pct=memory,
            disk_usage_pct=disk,
            active_workers=int(active_workers),
            total_workers=int(total_workers),
            queue_depth=int(queue_depth),
            avg_latency_ms=avg_latency,
        )

    def _update_rankings(self) -> None:
        """Update team rankings."""
        performances = list(self.state.agent_performances.values())

        # Group by team
        team_totals: Dict[str, float] = {}
        for perf in performances:
            if perf.team_id not in team_totals:
                team_totals[perf.team_id] = 0
            team_totals[perf.team_id] += perf.current_pnl

        # Sort by total PnL
        rankings = [
            {'team_id': team_id, 'total_pnl': pnl, 'rank': i + 1}
            for i, (team_id, pnl) in enumerate(
                sorted(team_totals.items(), key=lambda x: x[1], reverse=True)
            )
        ]

        self.state.team_rankings = rankings

    def _update_charts(self) -> None:
        """Update chart data."""
        # Get PnL history
        pnl_history = self.metrics.get_history('portfolio.pnl', duration_seconds=86400)

        self.state.pnl_chart_data = [
            {'timestamp': ts.isoformat(), 'value': val}
            for ts, val in pnl_history
        ]

    def _check_alerts(self) -> None:
        """Check alert conditions."""
        # Check drawdown
        for agent_id, perf in self.state.agent_performances.items():
            if perf.drawdown_pct > self.thresholds['drawdown_critical']:
                self.alerts.fire(
                    severity=AlertSeverity.CRITICAL,
                    title=f"Critical Drawdown: {agent_id}",
                    message=f"Agent {agent_id} drawdown is {perf.drawdown_pct:.1%}",
                    source="drawdown_monitor",
                    metadata={'agent_id': agent_id, 'drawdown': perf.drawdown_pct}
                )
            elif perf.drawdown_pct > self.thresholds['drawdown_warning']:
                self.alerts.fire(
                    severity=AlertSeverity.WARNING,
                    title=f"Drawdown Warning: {agent_id}",
                    message=f"Agent {agent_id} drawdown is {perf.drawdown_pct:.1%}",
                    source="drawdown_monitor",
                    metadata={'agent_id': agent_id, 'drawdown': perf.drawdown_pct}
                )

        # Check latency
        avg_latency = self.state.system_health.avg_latency_ms
        if avg_latency > self.thresholds['latency_warning_ms']:
            self.alerts.fire(
                severity=AlertSeverity.WARNING,
                title="High Latency",
                message=f"Average latency is {avg_latency:.0f}ms",
                source="latency_monitor"
            )

    # Public API for updating state

    def update_agent(self, performance: AgentPerformance) -> None:
        """Update agent performance."""
        self.state.agent_performances[performance.agent_id] = performance
        self.metrics.record_value(
            'agent.pnl',
            performance.current_pnl,
            labels={'agent_id': performance.agent_id}
        )

    def update_tournament(self, status: TournamentStatus) -> None:
        """Update tournament status."""
        self.state.tournament_status = status
        self.metrics.record_value('tournament.round', status.current_round)
        self.metrics.record_value('tournament.teams_remaining', status.teams_remaining)

    def record_trade(self, trade: Dict) -> None:
        """Record a trade."""
        self.state.recent_trades.append(trade)
        self.metrics.record_value('trades.count', 1, MetricType.COUNTER)

    def record_pnl(self, pnl: float) -> None:
        """Record portfolio PnL."""
        self.metrics.record_value('portfolio.pnl', pnl)

    async def get_dashboard_data(self) -> Dict:
        """Get current dashboard data."""
        return self.state.to_dict()

    async def push_update(self) -> None:
        """Push update to all connected clients."""
        await self.ws_manager.broadcast({
            'type': 'state_update',
            'data': self.state.to_dict()
        })


class DashboardAPI:
    """
    API endpoints for the monitoring dashboard.

    Provides REST and WebSocket interfaces.
    """

    def __init__(self, monitor: RealTimeMonitor):
        self.monitor = monitor

    async def get_state(self) -> Dict:
        """GET /api/dashboard/state"""
        return await self.monitor.get_dashboard_data()

    async def get_metrics(
        self,
        name: str,
        duration: int = 3600
    ) -> Dict:
        """GET /api/dashboard/metrics/{name}"""
        return self.monitor.metrics.get_statistics(name, duration_seconds=duration)

    async def get_alerts(
        self,
        severity: Optional[str] = None
    ) -> List[Dict]:
        """GET /api/dashboard/alerts"""
        sev = AlertSeverity(severity) if severity else None
        alerts = self.monitor.alerts.get_active(sev)
        return [asdict(a) for a in alerts]

    async def acknowledge_alert(
        self,
        alert_id: str,
        user: str
    ) -> Dict:
        """POST /api/dashboard/alerts/{alert_id}/acknowledge"""
        success = self.monitor.alerts.acknowledge(alert_id, user)
        return {'success': success}

    async def get_agent_performance(
        self,
        agent_id: str
    ) -> Optional[Dict]:
        """GET /api/dashboard/agents/{agent_id}"""
        perf = self.monitor.state.agent_performances.get(agent_id)
        return asdict(perf) if perf else None

    async def get_rankings(self) -> List[Dict]:
        """GET /api/dashboard/rankings"""
        return self.monitor.state.team_rankings

    async def handle_websocket(self, websocket: Any) -> None:
        """Handle WebSocket connection."""
        await self.monitor.ws_manager.connect(websocket)

        try:
            # Send initial state
            await websocket.send_json({
                'type': 'initial_state',
                'data': await self.monitor.get_dashboard_data()
            })

            # Handle incoming messages
            while True:
                data = await websocket.receive_json()
                message_type = data.get('type')

                if message_type == 'subscribe':
                    topic = data.get('topic')
                    if topic:
                        self.monitor.ws_manager.subscribe(websocket, topic)

                elif message_type == 'ping':
                    await websocket.send_json({'type': 'pong'})

        except Exception:
            pass
        finally:
            await self.monitor.ws_manager.disconnect(websocket)
