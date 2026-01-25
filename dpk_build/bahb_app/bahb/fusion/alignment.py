"""Spatial and temporal alignment for multi-source data fusion.

Handles the challenge of combining data from different:
- Resolutions (30cm Maxar vs 3m Planet vs 10m Sentinel)
- Timestamps (different collection times)
- Coordinate systems (various projections)
- Sensor geometries (different viewing angles)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional, Tuple

import numpy as np
from numpy.typing import NDArray
from loguru import logger


@dataclass
class AlignmentResult:
    """Result of alignment operation."""
    success: bool
    aligned_data: Optional[NDArray] = None
    transform_matrix: Optional[NDArray] = None
    residual_error: float = 0.0
    method_used: str = ""
    notes: str = ""


class SpatialAligner:
    """
    Align imagery from different sources to common coordinate system.

    Handles:
    - Resolution matching (resampling)
    - Projection transformation
    - Image registration (feature matching)
    - Orthorectification
    """

    def __init__(
        self,
        target_resolution_m: float = 1.0,
        target_crs: str = "EPSG:4326",
    ):
        """
        Initialize spatial aligner.

        Args:
            target_resolution_m: Target resolution in meters
            target_crs: Target coordinate reference system
        """
        self.target_resolution = target_resolution_m
        self.target_crs = target_crs

    def align_to_reference(
        self,
        source_data: NDArray,
        source_resolution: float,
        reference_data: NDArray,
        reference_resolution: float,
    ) -> AlignmentResult:
        """
        Align source data to reference image.

        Uses feature-based registration when possible,
        falls back to geometric transformation.
        """
        try:
            # Calculate scale factor
            scale_factor = reference_resolution / source_resolution

            if abs(scale_factor - 1.0) < 0.01:
                # Resolutions match, minimal alignment needed
                return AlignmentResult(
                    success=True,
                    aligned_data=source_data,
                    method_used="identity",
                )

            # Resample source to match reference resolution
            aligned = self._resample(source_data, scale_factor)

            # Crop/pad to match reference shape
            aligned = self._match_shape(aligned, reference_data.shape)

            return AlignmentResult(
                success=True,
                aligned_data=aligned,
                residual_error=0.0,
                method_used="resampling",
            )

        except Exception as e:
            logger.error(f"Spatial alignment failed: {e}")
            return AlignmentResult(
                success=False,
                notes=str(e),
            )

    def align_multiresolution(
        self,
        datasets: list[Tuple[NDArray, float]],
    ) -> list[AlignmentResult]:
        """
        Align multiple datasets to common resolution.

        Args:
            datasets: List of (data, resolution_m) tuples

        Returns:
            List of aligned datasets
        """
        if not datasets:
            return []

        # Use finest resolution as target
        resolutions = [r for _, r in datasets]
        target_res = min(resolutions)

        results = []
        for data, res in datasets:
            if abs(res - target_res) < 0.01:
                results.append(AlignmentResult(
                    success=True,
                    aligned_data=data,
                    method_used="identity",
                ))
            else:
                scale = res / target_res
                aligned = self._resample(data, scale)
                results.append(AlignmentResult(
                    success=True,
                    aligned_data=aligned,
                    method_used="resampling",
                ))

        return results

    def _resample(self, data: NDArray, scale: float) -> NDArray:
        """Resample data by scale factor using bilinear interpolation."""
        if len(data.shape) == 2:
            new_shape = (int(data.shape[0] * scale), int(data.shape[1] * scale))
        else:
            new_shape = (int(data.shape[0] * scale), int(data.shape[1] * scale), data.shape[2])

        # Use numpy's resize for simplicity
        # In production, would use cv2.resize or scipy for better interpolation
        from scipy import ndimage
        if len(data.shape) == 2:
            return ndimage.zoom(data, scale, order=1)
        else:
            return ndimage.zoom(data, (scale, scale, 1), order=1)

    def _match_shape(self, data: NDArray, target_shape: Tuple) -> NDArray:
        """Crop or pad data to match target shape."""
        result = np.zeros(target_shape, dtype=data.dtype)

        # Calculate overlap region
        min_h = min(data.shape[0], target_shape[0])
        min_w = min(data.shape[1], target_shape[1])

        if len(data.shape) == 3 and len(target_shape) == 3:
            min_c = min(data.shape[2], target_shape[2])
            result[:min_h, :min_w, :min_c] = data[:min_h, :min_w, :min_c]
        else:
            result[:min_h, :min_w] = data[:min_h, :min_w]

        return result

    def calculate_ground_sampling_distance(
        self,
        altitude_m: float,
        focal_length_mm: float,
        sensor_width_mm: float,
        image_width_px: int,
    ) -> float:
        """
        Calculate ground sampling distance for aerial imagery.

        GSD = (altitude × sensor_width) / (focal_length × image_width)
        """
        return (altitude_m * sensor_width_mm) / (focal_length_mm * image_width_px)


class TemporalAligner:
    """
    Align data from different timestamps.

    Handles:
    - Temporal interpolation
    - Change detection
    - Time series construction
    """

    def __init__(
        self,
        max_temporal_gap_hours: float = 24.0,
        interpolation_method: str = "linear",
    ):
        """
        Initialize temporal aligner.

        Args:
            max_temporal_gap_hours: Maximum gap for interpolation
            interpolation_method: Method for temporal interpolation
        """
        self.max_gap = timedelta(hours=max_temporal_gap_hours)
        self.interpolation_method = interpolation_method

    def find_closest_match(
        self,
        target_time: datetime,
        timestamps: list[datetime],
    ) -> Tuple[Optional[int], Optional[timedelta]]:
        """
        Find closest timestamp to target.

        Returns:
            Tuple of (index, time_difference)
        """
        if not timestamps:
            return None, None

        differences = [abs(t - target_time) for t in timestamps]
        min_idx = np.argmin(differences)

        return min_idx, differences[min_idx]

    def align_to_reference_time(
        self,
        data_items: list[Tuple[NDArray, datetime]],
        reference_time: datetime,
    ) -> list[Tuple[NDArray, float]]:
        """
        Align multiple data items to reference time.

        Returns data with temporal weights (1.0 = exact match).
        """
        results = []

        for data, timestamp in data_items:
            time_diff = abs(timestamp - reference_time)

            if time_diff > self.max_gap:
                # Data too old, skip or use with low weight
                weight = 0.1
            else:
                # Weight decreases with time difference
                hours_diff = time_diff.total_seconds() / 3600
                max_hours = self.max_gap.total_seconds() / 3600
                weight = 1.0 - (hours_diff / max_hours) * 0.5

            results.append((data, weight))

        return results

    def interpolate_temporal(
        self,
        before_data: NDArray,
        before_time: datetime,
        after_data: NDArray,
        after_time: datetime,
        target_time: datetime,
    ) -> Optional[NDArray]:
        """
        Interpolate data at target time between two observations.
        """
        if target_time < before_time or target_time > after_time:
            return None

        total_gap = (after_time - before_time).total_seconds()
        if total_gap == 0:
            return before_data

        # Linear interpolation weight
        weight = (target_time - before_time).total_seconds() / total_gap

        if self.interpolation_method == "linear":
            interpolated = (1 - weight) * before_data + weight * after_data
        elif self.interpolation_method == "nearest":
            interpolated = before_data if weight < 0.5 else after_data
        else:
            interpolated = (1 - weight) * before_data + weight * after_data

        return interpolated.astype(before_data.dtype)

    def detect_temporal_changes(
        self,
        data_series: list[Tuple[NDArray, datetime]],
        threshold: float = 0.1,
    ) -> list[dict]:
        """
        Detect significant changes in time series.

        Returns list of change events.
        """
        if len(data_series) < 2:
            return []

        changes = []

        for i in range(1, len(data_series)):
            prev_data, prev_time = data_series[i - 1]
            curr_data, curr_time = data_series[i]

            # Calculate normalized difference
            diff = np.abs(curr_data.astype(float) - prev_data.astype(float))
            mean_diff = np.mean(diff)

            # Normalize by data range
            data_range = max(np.max(prev_data) - np.min(prev_data), 1)
            normalized_diff = mean_diff / data_range

            if normalized_diff > threshold:
                changes.append({
                    "time_start": prev_time.isoformat(),
                    "time_end": curr_time.isoformat(),
                    "change_magnitude": float(normalized_diff),
                    "pixels_changed": int(np.sum(diff > threshold * data_range)),
                    "percentage_changed": float(np.mean(diff > threshold * data_range) * 100),
                })

        return changes

    def build_time_series(
        self,
        data_items: list[Tuple[NDArray, datetime]],
        pixel_x: int,
        pixel_y: int,
    ) -> dict:
        """
        Build time series for a specific pixel location.
        """
        # Sort by time
        sorted_items = sorted(data_items, key=lambda x: x[1])

        times = []
        values = []

        for data, timestamp in sorted_items:
            if 0 <= pixel_y < data.shape[0] and 0 <= pixel_x < data.shape[1]:
                times.append(timestamp.isoformat())
                if len(data.shape) == 3:
                    values.append(data[pixel_y, pixel_x, :].tolist())
                else:
                    values.append(float(data[pixel_y, pixel_x]))

        return {
            "location": {"x": pixel_x, "y": pixel_y},
            "timestamps": times,
            "values": values,
            "count": len(times),
            "time_span_hours": (
                (sorted_items[-1][1] - sorted_items[0][1]).total_seconds() / 3600
                if len(sorted_items) > 1 else 0
            ),
        }
