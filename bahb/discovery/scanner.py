"""Global scanning infrastructure for autonomous discovery.

Implements systematic scanning strategies:
- Priority-based region selection
- Adaptive scan scheduling
- Multi-resolution coverage
- Change detection triggers
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List

import numpy as np
from loguru import logger


class ScanPriority(Enum):
    """Priority levels for scanning."""
    CRITICAL = 10    # Known AI clusters, active construction
    HIGH = 8         # Major data center markets
    MEDIUM = 5       # Secondary markets
    LOW = 3          # General coverage
    BACKGROUND = 1   # Low-priority fill-in


@dataclass
class ScanSchedule:
    """Scanning schedule for a region."""
    region_id: str
    priority: ScanPriority
    interval_days: int
    next_scan: datetime
    last_scan: Optional[datetime] = None
    consecutive_no_change: int = 0


class GlobalScanner:
    """
    Global scanning coordinator for systematic coverage.

    Strategies:
    1. Priority-first: Focus on high-value regions
    2. Change-triggered: Re-scan on detected changes
    3. Adaptive: Adjust intervals based on activity
    4. Fill-in: Background coverage of low-priority areas
    """

    # Default scan intervals by priority
    DEFAULT_INTERVALS = {
        ScanPriority.CRITICAL: 1,      # Daily
        ScanPriority.HIGH: 7,          # Weekly
        ScanPriority.MEDIUM: 14,       # Bi-weekly
        ScanPriority.LOW: 30,          # Monthly
        ScanPriority.BACKGROUND: 90,   # Quarterly
    }

    def __init__(
        self,
        daily_scan_budget: int = 100,
        adaptive_scheduling: bool = True,
    ):
        """
        Initialize global scanner.

        Args:
            daily_scan_budget: Max scans per day
            adaptive_scheduling: Adjust intervals based on activity
        """
        self.daily_budget = daily_scan_budget
        self.adaptive = adaptive_scheduling

        self._schedules: dict[str, ScanSchedule] = {}
        self._scans_today = 0
        self._last_reset = datetime.now().date()

    def add_schedule(
        self,
        region_id: str,
        priority: ScanPriority,
        custom_interval: Optional[int] = None,
    ) -> ScanSchedule:
        """Add scanning schedule for a region."""
        interval = custom_interval or self.DEFAULT_INTERVALS[priority]

        schedule = ScanSchedule(
            region_id=region_id,
            priority=priority,
            interval_days=interval,
            next_scan=datetime.now(),  # Scan immediately first time
        )

        self._schedules[region_id] = schedule
        return schedule

    def get_pending_scans(self, limit: int = 10) -> List[ScanSchedule]:
        """Get list of regions due for scanning, ordered by priority."""
        now = datetime.now()

        # Reset daily counter if needed
        if datetime.now().date() != self._last_reset:
            self._scans_today = 0
            self._last_reset = datetime.now().date()

        # Check budget
        remaining_budget = self.daily_budget - self._scans_today

        if remaining_budget <= 0:
            logger.warning("Daily scan budget exhausted")
            return []

        # Find due schedules
        due = [
            s for s in self._schedules.values()
            if s.next_scan <= now
        ]

        # Sort by priority (descending) then by overdue time
        due.sort(
            key=lambda s: (s.priority.value, (now - s.next_scan).total_seconds()),
            reverse=True,
        )

        return due[:min(limit, remaining_budget)]

    def record_scan_complete(
        self,
        region_id: str,
        change_detected: bool = False,
        facilities_found: int = 0,
    ) -> None:
        """Record completion of a scan."""
        schedule = self._schedules.get(region_id)
        if not schedule:
            return

        schedule.last_scan = datetime.now()
        self._scans_today += 1

        # Adaptive scheduling
        if self.adaptive:
            if change_detected or facilities_found > 0:
                # Increase scan frequency
                schedule.consecutive_no_change = 0
                schedule.interval_days = max(1, schedule.interval_days // 2)
            else:
                schedule.consecutive_no_change += 1
                # Decrease frequency after multiple no-change scans
                if schedule.consecutive_no_change >= 3:
                    max_interval = self.DEFAULT_INTERVALS[schedule.priority] * 2
                    schedule.interval_days = min(max_interval, schedule.interval_days + 7)

        # Schedule next scan
        schedule.next_scan = datetime.now() + timedelta(days=schedule.interval_days)

        logger.debug(
            f"Scan complete for {region_id}. "
            f"Next scan in {schedule.interval_days} days"
        )

    def trigger_immediate_scan(self, region_id: str) -> bool:
        """Trigger immediate re-scan of a region."""
        schedule = self._schedules.get(region_id)
        if not schedule:
            return False

        schedule.next_scan = datetime.now()
        return True

    def get_coverage_stats(self) -> dict:
        """Get scanning coverage statistics."""
        now = datetime.now()

        total = len(self._schedules)
        scanned_today = self._scans_today
        overdue = sum(1 for s in self._schedules.values() if s.next_scan < now)

        by_priority = {}
        for priority in ScanPriority:
            schedules = [s for s in self._schedules.values() if s.priority == priority]
            by_priority[priority.name] = {
                "total": len(schedules),
                "overdue": sum(1 for s in schedules if s.next_scan < now),
            }

        return {
            "total_regions": total,
            "scanned_today": scanned_today,
            "daily_budget": self.daily_budget,
            "budget_remaining": self.daily_budget - scanned_today,
            "overdue_scans": overdue,
            "by_priority": by_priority,
        }

    def optimize_schedule(self) -> dict:
        """Optimize scan schedule based on current state."""
        changes_made = []

        for schedule in self._schedules.values():
            # Reduce frequency for inactive regions
            if schedule.consecutive_no_change >= 5:
                old_interval = schedule.interval_days
                max_interval = self.DEFAULT_INTERVALS[schedule.priority] * 3
                schedule.interval_days = min(max_interval, old_interval + 14)

                if schedule.interval_days != old_interval:
                    changes_made.append({
                        "region": schedule.region_id,
                        "change": "reduced_frequency",
                        "old_interval": old_interval,
                        "new_interval": schedule.interval_days,
                    })

        return {
            "optimizations_made": len(changes_made),
            "changes": changes_made,
        }
