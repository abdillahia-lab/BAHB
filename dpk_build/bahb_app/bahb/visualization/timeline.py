"""Timeline visualization for construction and operational history.

Based on Team 15's Timeline Scrubber Interface:
- Video-style playback of construction progress
- Keyframe annotations
- Speed controls (1x to 100x)
- Split-screen before/after
- Animated metric overlays
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any


class EventType(Enum):
    """Types of timeline events."""
    CONSTRUCTION_START = "construction_start"
    PHASE_CHANGE = "phase_change"
    EQUIPMENT_ADDED = "equipment_added"
    OPERATIONAL_START = "operational_start"
    EXPANSION = "expansion"
    ALERT = "alert"
    MAINTENANCE = "maintenance"
    OBSERVATION = "observation"


class PlaybackSpeed(Enum):
    """Playback speed options."""
    REALTIME = 1
    FAST_2X = 2
    FAST_5X = 5
    FAST_10X = 10
    FAST_50X = 50
    FAST_100X = 100


@dataclass
class TimelineEvent:
    """Event on the timeline."""
    id: str
    timestamp: datetime
    event_type: EventType
    title: str
    description: Optional[str] = None

    # Visual
    icon: Optional[str] = None
    color: Optional[str] = None

    # Associated data
    facility_id: Optional[str] = None
    imagery_url: Optional[str] = None
    metrics: Dict[str, float] = field(default_factory=dict)

    # Keyframe
    is_keyframe: bool = False
    keyframe_label: Optional[str] = None


@dataclass
class TimelineFrame:
    """A single frame in the timeline."""
    timestamp: datetime
    imagery_url: Optional[str] = None
    thermal_url: Optional[str] = None
    metrics: Dict[str, float] = field(default_factory=dict)
    events: List[TimelineEvent] = field(default_factory=list)


class TimelineView:
    """
    Interactive timeline visualization.

    Features:
    - Scrubber interface for temporal navigation
    - Keyframe-based navigation
    - Playback with variable speed
    - Before/after comparison
    - Metric overlays
    """

    # Default event colors
    EVENT_COLORS = {
        EventType.CONSTRUCTION_START: "#FFD93D",
        EventType.PHASE_CHANGE: "#4ECDC4",
        EventType.EQUIPMENT_ADDED: "#45B7D1",
        EventType.OPERATIONAL_START: "#50C878",
        EventType.EXPANSION: "#6C5CE7",
        EventType.ALERT: "#FF6B6B",
        EventType.MAINTENANCE: "#FD79A8",
        EventType.OBSERVATION: "#95A5A6",
    }

    def __init__(
        self,
        facility_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ):
        """
        Initialize timeline view.

        Args:
            facility_id: Facility to show timeline for
            start_date: Start of timeline (default: 1 year ago)
            end_date: End of timeline (default: now)
        """
        self.facility_id = facility_id
        self.start_date = start_date or (datetime.now() - timedelta(days=365))
        self.end_date = end_date or datetime.now()

        self._events: List[TimelineEvent] = []
        self._frames: List[TimelineFrame] = []
        self._keyframes: List[int] = []  # Indices of keyframe frames

        # Playback state
        self._current_position = 0.0  # 0-1
        self._playback_speed = PlaybackSpeed.REALTIME
        self._is_playing = False

        # Comparison mode
        self._comparison_enabled = False
        self._comparison_timestamp: Optional[datetime] = None

    def add_event(self, event: TimelineEvent) -> None:
        """Add an event to the timeline."""
        event.color = event.color or self.EVENT_COLORS.get(event.event_type, "#95A5A6")
        self._events.append(event)
        self._events.sort(key=lambda e: e.timestamp)

        if event.is_keyframe:
            self._update_keyframes()

    def add_frame(self, frame: TimelineFrame) -> None:
        """Add a frame to the timeline."""
        self._frames.append(frame)
        self._frames.sort(key=lambda f: f.timestamp)

    def _update_keyframes(self) -> None:
        """Update keyframe indices."""
        self._keyframes = [
            i for i, e in enumerate(self._events) if e.is_keyframe
        ]

    def set_position(self, position: float) -> TimelineFrame:
        """
        Set timeline position (0-1).

        Returns frame at that position.
        """
        self._current_position = max(0, min(1, position))
        return self.get_current_frame()

    def get_current_frame(self) -> Optional[TimelineFrame]:
        """Get frame at current position."""
        if not self._frames:
            return None

        index = int(self._current_position * (len(self._frames) - 1))
        return self._frames[index]

    def get_current_timestamp(self) -> datetime:
        """Get timestamp at current position."""
        span = (self.end_date - self.start_date).total_seconds()
        offset = span * self._current_position
        return self.start_date + timedelta(seconds=offset)

    def next_keyframe(self) -> Optional[TimelineEvent]:
        """Jump to next keyframe."""
        current_ts = self.get_current_timestamp()

        for event in self._events:
            if event.is_keyframe and event.timestamp > current_ts:
                self.seek_to_timestamp(event.timestamp)
                return event

        return None

    def previous_keyframe(self) -> Optional[TimelineEvent]:
        """Jump to previous keyframe."""
        current_ts = self.get_current_timestamp()

        for event in reversed(self._events):
            if event.is_keyframe and event.timestamp < current_ts:
                self.seek_to_timestamp(event.timestamp)
                return event

        return None

    def seek_to_timestamp(self, timestamp: datetime) -> float:
        """Seek to specific timestamp."""
        span = (self.end_date - self.start_date).total_seconds()
        offset = (timestamp - self.start_date).total_seconds()
        self._current_position = max(0, min(1, offset / span))
        return self._current_position

    def set_playback_speed(self, speed: PlaybackSpeed) -> None:
        """Set playback speed."""
        self._playback_speed = speed

    def play(self) -> None:
        """Start playback."""
        self._is_playing = True

    def pause(self) -> None:
        """Pause playback."""
        self._is_playing = False

    def enable_comparison(self, timestamp: datetime) -> None:
        """Enable comparison mode with a specific timestamp."""
        self._comparison_enabled = True
        self._comparison_timestamp = timestamp

    def disable_comparison(self) -> None:
        """Disable comparison mode."""
        self._comparison_enabled = False
        self._comparison_timestamp = None

    def get_events_in_range(
        self,
        start: datetime,
        end: datetime,
        event_type: Optional[EventType] = None,
    ) -> List[TimelineEvent]:
        """Get events within a time range."""
        events = [
            e for e in self._events
            if start <= e.timestamp <= end
        ]

        if event_type:
            events = [e for e in events if e.event_type == event_type]

        return events

    def get_metrics_at_position(self) -> Dict[str, float]:
        """Get metrics at current position."""
        frame = self.get_current_frame()
        return frame.metrics if frame else {}

    def get_render_state(self) -> dict:
        """Get current state for rendering."""
        current_frame = self.get_current_frame()
        current_ts = self.get_current_timestamp()

        # Get nearby events
        nearby_events = [
            e for e in self._events
            if abs((e.timestamp - current_ts).total_seconds()) < 86400  # Within 1 day
        ]

        return {
            "facilityId": self.facility_id,
            "startDate": self.start_date.isoformat(),
            "endDate": self.end_date.isoformat(),
            "currentPosition": self._current_position,
            "currentTimestamp": current_ts.isoformat(),
            "playbackSpeed": self._playback_speed.value,
            "isPlaying": self._is_playing,
            "currentFrame": {
                "timestamp": current_frame.timestamp.isoformat() if current_frame else None,
                "imageryUrl": current_frame.imagery_url if current_frame else None,
                "thermalUrl": current_frame.thermal_url if current_frame else None,
                "metrics": current_frame.metrics if current_frame else {},
            } if current_frame else None,
            "nearbyEvents": [
                {
                    "id": e.id,
                    "timestamp": e.timestamp.isoformat(),
                    "type": e.event_type.value,
                    "title": e.title,
                    "color": e.color,
                    "isKeyframe": e.is_keyframe,
                }
                for e in nearby_events
            ],
            "keyframeCount": len(self._keyframes),
            "totalFrames": len(self._frames),
            "totalEvents": len(self._events),
            "comparison": {
                "enabled": self._comparison_enabled,
                "timestamp": self._comparison_timestamp.isoformat() if self._comparison_timestamp else None,
            },
        }

    def generate_event_markers(self) -> List[dict]:
        """Generate event markers for timeline display."""
        span = (self.end_date - self.start_date).total_seconds()

        markers = []
        for event in self._events:
            offset = (event.timestamp - self.start_date).total_seconds()
            position = offset / span if span > 0 else 0

            markers.append({
                "id": event.id,
                "position": position,
                "timestamp": event.timestamp.isoformat(),
                "type": event.event_type.value,
                "title": event.title,
                "color": event.color,
                "isKeyframe": event.is_keyframe,
                "keyframeLabel": event.keyframe_label,
            })

        return markers

    def get_statistics(self) -> dict:
        """Get timeline statistics."""
        by_type = {}
        for event in self._events:
            t = event.event_type.value
            by_type[t] = by_type.get(t, 0) + 1

        return {
            "facility_id": self.facility_id,
            "time_span_days": (self.end_date - self.start_date).days,
            "total_events": len(self._events),
            "total_frames": len(self._frames),
            "keyframes": len(self._keyframes),
            "events_by_type": by_type,
        }
