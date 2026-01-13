"""Data source configuration and management for multi-spectral fusion.

Supports integration with satellite imagery providers:
- Planet Labs: Daily optical coverage
- Maxar: High-resolution optical (30cm)
- SatVu: Thermal imaging (3.5m resolution)
- Capella Space: SAR radar
- ICEYE: SAR constellation
- BlackSky: Real-time intelligence
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Callable, Any

from loguru import logger


class SourceType(Enum):
    """Data source types."""
    OPTICAL = "optical"
    THERMAL = "thermal"
    SAR = "sar"
    MULTISPECTRAL = "multispectral"
    HYPERSPECTRAL = "hyperspectral"
    LIDAR = "lidar"
    IOT = "iot"


class SourceProvider(Enum):
    """Commercial satellite/data providers."""
    PLANET = "planet"           # Planet Labs - daily optical
    MAXAR = "maxar"             # Maxar - high-res optical
    SATVU = "satvu"             # SatVu - thermal imaging
    CAPELLA = "capella"         # Capella Space - SAR
    ICEYE = "iceye"             # ICEYE - SAR constellation
    BLACKSKY = "blacksky"       # BlackSky - real-time
    SENTINEL = "sentinel"       # ESA Sentinel - free
    LANDSAT = "landsat"         # NASA/USGS Landsat - free
    DJI = "dji"                 # DJI drone sensors
    CUSTOM = "custom"           # Custom/local sensors


@dataclass
class SourceConfig:
    """Configuration for a data source."""
    name: str
    source_type: SourceType
    provider: SourceProvider
    enabled: bool = True

    # Access configuration
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    auth_type: str = "bearer"

    # Data specifications
    resolution_m: float = 1.0
    revisit_hours: float = 24.0
    coverage_km2: float = 1000.0

    # Quality parameters
    min_confidence: float = 0.5
    max_cloud_cover: float = 0.3

    # Timing
    max_age_hours: float = 24.0
    processing_delay_minutes: float = 30.0

    # Cost
    cost_per_km2: float = 0.0
    monthly_budget: float = float("inf")


@dataclass
class DataSource:
    """Active data source with connection and caching."""
    config: SourceConfig
    is_connected: bool = False
    last_fetch: Optional[datetime] = None
    last_error: Optional[str] = None
    fetch_count: int = 0
    error_count: int = 0

    # Callbacks
    on_data_received: Optional[Callable] = None
    on_error: Optional[Callable] = None

    # Cache
    _cache: dict = field(default_factory=dict)
    _cache_ttl_hours: float = 1.0

    async def connect(self) -> bool:
        """Establish connection to data source."""
        if not self.config.enabled:
            logger.warning(f"Source {self.config.name} is disabled")
            return False

        try:
            # Provider-specific connection logic would go here
            # For now, simulate successful connection
            self.is_connected = True
            logger.info(f"Connected to {self.config.name} ({self.config.provider.value})")
            return True
        except Exception as e:
            self.last_error = str(e)
            self.error_count += 1
            logger.error(f"Failed to connect to {self.config.name}: {e}")
            return False

    async def disconnect(self) -> None:
        """Disconnect from data source."""
        self.is_connected = False
        logger.info(f"Disconnected from {self.config.name}")

    async def fetch_data(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 1.0,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Optional[dict]:
        """
        Fetch data for a geographic area.

        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_km: Search radius in km
            start_time: Start of time window
            end_time: End of time window

        Returns:
            Data dictionary or None if failed
        """
        if not self.is_connected:
            logger.warning(f"Source {self.config.name} not connected")
            return None

        # Check cache first
        cache_key = f"{latitude:.4f}_{longitude:.4f}_{radius_km}"
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            age = (datetime.now() - cached["timestamp"]).total_seconds() / 3600
            if age < self._cache_ttl_hours:
                logger.debug(f"Cache hit for {self.config.name}")
                return cached["data"]

        try:
            # Provider-specific fetch logic would be implemented here
            # This is a placeholder structure
            data = await self._provider_fetch(latitude, longitude, radius_km, start_time, end_time)

            # Update cache
            self._cache[cache_key] = {
                "data": data,
                "timestamp": datetime.now(),
            }

            self.last_fetch = datetime.now()
            self.fetch_count += 1

            if self.on_data_received:
                self.on_data_received(data)

            return data

        except Exception as e:
            self.last_error = str(e)
            self.error_count += 1
            logger.error(f"Fetch error from {self.config.name}: {e}")

            if self.on_error:
                self.on_error(e)

            return None

    async def _provider_fetch(
        self,
        lat: float,
        lon: float,
        radius: float,
        start: Optional[datetime],
        end: Optional[datetime],
    ) -> dict:
        """Provider-specific fetch implementation."""
        # This would contain actual API calls to each provider
        # For now, return a structure indicating what would be fetched

        return {
            "provider": self.config.provider.value,
            "source_type": self.config.source_type.value,
            "location": {"latitude": lat, "longitude": lon},
            "radius_km": radius,
            "resolution_m": self.config.resolution_m,
            "timestamp": datetime.now().isoformat(),
            "status": "simulated",
        }

    def get_status(self) -> dict:
        """Get source status."""
        return {
            "name": self.config.name,
            "provider": self.config.provider.value,
            "type": self.config.source_type.value,
            "enabled": self.config.enabled,
            "connected": self.is_connected,
            "last_fetch": self.last_fetch.isoformat() if self.last_fetch else None,
            "fetch_count": self.fetch_count,
            "error_count": self.error_count,
            "last_error": self.last_error,
            "resolution_m": self.config.resolution_m,
            "revisit_hours": self.config.revisit_hours,
        }


class SourceManager:
    """Manage multiple data sources."""

    # Pre-configured source templates
    SOURCE_TEMPLATES = {
        "planet_daily": SourceConfig(
            name="Planet Daily",
            source_type=SourceType.OPTICAL,
            provider=SourceProvider.PLANET,
            resolution_m=3.0,
            revisit_hours=24,
            coverage_km2=350_000_000,
            cost_per_km2=0.1,
        ),
        "maxar_hires": SourceConfig(
            name="Maxar High-Res",
            source_type=SourceType.OPTICAL,
            provider=SourceProvider.MAXAR,
            resolution_m=0.3,
            revisit_hours=72,
            coverage_km2=1000,
            cost_per_km2=15.0,
        ),
        "satvu_thermal": SourceConfig(
            name="SatVu Thermal",
            source_type=SourceType.THERMAL,
            provider=SourceProvider.SATVU,
            resolution_m=3.5,
            revisit_hours=12,  # With full constellation
            cost_per_km2=20.0,
        ),
        "capella_sar": SourceConfig(
            name="Capella SAR",
            source_type=SourceType.SAR,
            provider=SourceProvider.CAPELLA,
            resolution_m=0.25,  # Spotlight mode
            revisit_hours=6,
            cost_per_km2=25.0,
        ),
        "iceye_sar": SourceConfig(
            name="ICEYE SAR",
            source_type=SourceType.SAR,
            provider=SourceProvider.ICEYE,
            resolution_m=0.5,
            revisit_hours=24,
            coverage_km2=120000,
            cost_per_km2=18.0,
        ),
        "blacksky_realtime": SourceConfig(
            name="BlackSky Real-time",
            source_type=SourceType.OPTICAL,
            provider=SourceProvider.BLACKSKY,
            resolution_m=1.0,
            revisit_hours=1,  # Rapid revisit
            processing_delay_minutes=90,
            cost_per_km2=12.0,
        ),
        "sentinel2_free": SourceConfig(
            name="Sentinel-2",
            source_type=SourceType.MULTISPECTRAL,
            provider=SourceProvider.SENTINEL,
            resolution_m=10.0,
            revisit_hours=120,  # 5-day revisit
            cost_per_km2=0.0,
        ),
        "dji_drone": SourceConfig(
            name="DJI Drone",
            source_type=SourceType.OPTICAL,
            provider=SourceProvider.DJI,
            resolution_m=0.01,  # cm-level from drone
            revisit_hours=0.5,  # On-demand
            cost_per_km2=100.0,  # Operational cost
        ),
    }

    def __init__(self):
        self._sources: dict[str, DataSource] = {}

    def add_source(self, config: SourceConfig) -> DataSource:
        """Add a new data source."""
        source = DataSource(config=config)
        self._sources[config.name] = source
        logger.info(f"Added source: {config.name}")
        return source

    def add_from_template(self, template_name: str, **overrides) -> Optional[DataSource]:
        """Add source from pre-defined template."""
        if template_name not in self.SOURCE_TEMPLATES:
            logger.error(f"Unknown template: {template_name}")
            return None

        config = self.SOURCE_TEMPLATES[template_name]

        # Apply overrides
        for key, value in overrides.items():
            if hasattr(config, key):
                setattr(config, key, value)

        return self.add_source(config)

    def get_source(self, name: str) -> Optional[DataSource]:
        """Get source by name."""
        return self._sources.get(name)

    def get_sources_by_type(self, source_type: SourceType) -> list[DataSource]:
        """Get all sources of a specific type."""
        return [s for s in self._sources.values() if s.config.source_type == source_type]

    async def connect_all(self) -> dict[str, bool]:
        """Connect all enabled sources."""
        results = {}
        for name, source in self._sources.items():
            if source.config.enabled:
                results[name] = await source.connect()
        return results

    async def disconnect_all(self) -> None:
        """Disconnect all sources."""
        for source in self._sources.values():
            await source.disconnect()

    def get_all_status(self) -> dict:
        """Get status of all sources."""
        return {
            "sources": {name: source.get_status() for name, source in self._sources.items()},
            "summary": {
                "total": len(self._sources),
                "enabled": sum(1 for s in self._sources.values() if s.config.enabled),
                "connected": sum(1 for s in self._sources.values() if s.is_connected),
                "by_type": {
                    st.value: len(self.get_sources_by_type(st))
                    for st in SourceType
                },
            },
        }

    def get_optimal_source(
        self,
        source_type: SourceType,
        max_age_hours: float = 24.0,
        max_cost: float = float("inf"),
    ) -> Optional[DataSource]:
        """Get best available source for a type based on freshness and cost."""
        candidates = self.get_sources_by_type(source_type)
        candidates = [
            s for s in candidates
            if s.is_connected and s.config.cost_per_km2 <= max_cost
        ]

        if not candidates:
            return None

        # Sort by resolution (best first), then by cost
        candidates.sort(key=lambda s: (s.config.resolution_m, s.config.cost_per_km2))

        return candidates[0]
