package com.bahb.model

import com.google.gson.annotations.SerializedName

/**
 * BAHB Data Models - Matching Python backend types
 *
 * These models mirror bahb.core.types for seamless JSON serialization
 */

data class BoundingBox(
    val x1: Float,
    val y1: Float,
    val x2: Float,
    val y2: Float
) {
    val width: Float get() = x2 - x1
    val height: Float get() = y2 - y1
    val centerX: Float get() = (x1 + x2) / 2
    val centerY: Float get() = (y1 + y2) / 2
}

data class Detection(
    @SerializedName("class_id") val classId: Int,
    @SerializedName("class_name") val className: String,
    val confidence: Float,
    val bbox: BoundingBox,
    @SerializedName("track_id") val trackId: Int? = null
)

enum class SeverityLevel(val value: Int) {
    INFO(0),
    LOW(1),
    MEDIUM(2),
    HIGH(3),
    CRITICAL(4);

    companion object {
        fun fromValue(value: Int) = entries.find { it.value == value } ?: INFO
    }
}

enum class InspectionState {
    IDLE,
    ACTIVE,
    PROCESSING,
    PAUSED,
    ERROR
}

data class GeoLocation(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double,
    val heading: Float? = null
)

data class ThermalReading(
    @SerializedName("min_temp") val minTemp: Float,
    @SerializedName("max_temp") val maxTemp: Float,
    @SerializedName("mean_temp") val meanTemp: Float,
    @SerializedName("delta_t") val deltaT: Float,
    @SerializedName("hotspot_locations") val hotspotLocations: List<Pair<Int, Int>> = emptyList()
)

data class Anomaly(
    val id: String,
    val type: String,
    val severity: SeverityLevel,
    val confidence: Float,
    val description: String,
    val detection: Detection? = null,
    val thermal: ThermalReading? = null,
    val location: GeoLocation? = null,
    val timestamp: Long,
    val recommendations: List<String> = emptyList()
)

data class InspectionResult(
    @SerializedName("frame_id") val frameId: Int,
    val timestamp: String,
    val location: GeoLocation? = null,
    val detections: List<Detection> = emptyList(),
    val anomalies: List<Anomaly> = emptyList(),
    @SerializedName("thermal_reading") val thermalReading: ThermalReading? = null,
    @SerializedName("vlm_description") val vlmDescription: String? = null,
    @SerializedName("vlm_recommendations") val vlmRecommendations: List<String>? = null,
    @SerializedName("inference_time_ms") val inferenceTimeMs: Float = 0f
)

/**
 * WebSocket message types for Manifold 3 communication
 */
sealed class ManifoldMessage {
    data class InspectionUpdate(val result: InspectionResult) : ManifoldMessage()
    data class SystemStatus(
        val fps: Float,
        val gpuMemory: Float,
        val modelsLoaded: List<String>
    ) : ManifoldMessage()
    data class Alert(
        val level: SeverityLevel,
        val message: String
    ) : ManifoldMessage()
}

/**
 * Commands sent to Manifold 3
 */
data class ManifoldCommand(
    val action: String,
    val params: Map<String, Any> = emptyMap()
) {
    companion object {
        fun startInspection(type: String, siteName: String) = ManifoldCommand(
            action = "start_inspection",
            params = mapOf("type" to type, "site_name" to siteName)
        )
        fun stopInspection() = ManifoldCommand(action = "stop_inspection")
        fun captureSnapshot() = ManifoldCommand(action = "capture_snapshot")
        fun toggleThermal(enabled: Boolean) = ManifoldCommand(
            action = "toggle_thermal",
            params = mapOf("enabled" to enabled)
        )
    }
}
