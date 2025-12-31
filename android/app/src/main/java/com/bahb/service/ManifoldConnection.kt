package com.bahb.service

import com.bahb.model.*
import com.google.gson.Gson
import com.google.gson.JsonParser
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.*
import timber.log.Timber
import java.util.concurrent.TimeUnit

/**
 * WebSocket connection to Manifold 3 running BAHB inference
 *
 * Handles real-time AI detection results, thermal data, and anomaly alerts
 */
class ManifoldConnection(
    private val host: String = "192.168.42.3",
    private val wsPort: Int = 8080
) {
    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var webSocket: WebSocket? = null
    private var isConnecting = false

    // Connection state
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState

    // Incoming data streams
    private val _inspectionResults = MutableSharedFlow<InspectionResult>(replay = 1)
    val inspectionResults: SharedFlow<InspectionResult> = _inspectionResults

    private val _anomalies = MutableSharedFlow<Anomaly>(extraBufferCapacity = 50)
    val anomalies: SharedFlow<Anomaly> = _anomalies

    private val _systemStatus = MutableStateFlow<SystemStatus?>(null)
    val systemStatus: StateFlow<SystemStatus?> = _systemStatus

    // Latest frame data for overlay rendering
    private val _latestDetections = MutableStateFlow<List<Detection>>(emptyList())
    val latestDetections: StateFlow<List<Detection>> = _latestDetections

    private val _latestThermal = MutableStateFlow<ThermalReading?>(null)
    val latestThermal: StateFlow<ThermalReading?> = _latestThermal

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)  // No timeout for WebSocket
        .pingInterval(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    fun connect() {
        if (isConnecting || _connectionState.value == ConnectionState.CONNECTED) return
        isConnecting = true

        val url = "ws://$host:$wsPort/ws/inspection"
        Timber.i("Connecting to Manifold 3: $url")

        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Timber.i("Connected to Manifold 3")
                _connectionState.value = ConnectionState.CONNECTED
                isConnecting = false
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Timber.e(t, "WebSocket failure")
                _connectionState.value = ConnectionState.ERROR
                isConnecting = false
                scheduleReconnect()
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Timber.w("WebSocket closing: $code $reason")
                webSocket.close(1000, null)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Timber.i("WebSocket closed: $code $reason")
                _connectionState.value = ConnectionState.DISCONNECTED
                isConnecting = false
            }
        })
    }

    private fun handleMessage(json: String) {
        try {
            val root = JsonParser.parseString(json).asJsonObject
            val type = root.get("type")?.asString ?: return

            when (type) {
                "inspection_result" -> {
                    val result = gson.fromJson(root.get("data"), InspectionResult::class.java)
                    scope.launch {
                        _inspectionResults.emit(result)
                        _latestDetections.value = result.detections
                        _latestThermal.value = result.thermalReading

                        // Emit individual anomalies for alert handling
                        result.anomalies.forEach { _anomalies.emit(it) }
                    }
                }

                "system_status" -> {
                    val status = gson.fromJson(root.get("data"), SystemStatus::class.java)
                    _systemStatus.value = status
                }

                "alert" -> {
                    val level = SeverityLevel.fromValue(root.get("level")?.asInt ?: 0)
                    val message = root.get("message")?.asString ?: ""
                    Timber.w("Manifold alert [$level]: $message")
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to parse message")
        }
    }

    fun sendCommand(command: ManifoldCommand) {
        val json = gson.toJson(command)
        webSocket?.send(json) ?: Timber.w("Cannot send command: not connected")
    }

    fun startInspection(type: String, siteName: String) {
        sendCommand(ManifoldCommand.startInspection(type, siteName))
    }

    fun stopInspection() {
        sendCommand(ManifoldCommand.stopInspection())
    }

    fun captureSnapshot() {
        sendCommand(ManifoldCommand.captureSnapshot())
    }

    fun toggleThermalOverlay(enabled: Boolean) {
        sendCommand(ManifoldCommand.toggleThermal(enabled))
    }

    private fun scheduleReconnect() {
        scope.launch {
            delay(5000)  // Wait 5 seconds before reconnect
            if (_connectionState.value != ConnectionState.CONNECTED) {
                Timber.i("Attempting reconnection...")
                connect()
            }
        }
    }

    fun disconnect() {
        webSocket?.close(1000, "User disconnect")
        webSocket = null
        _connectionState.value = ConnectionState.DISCONNECTED
    }

    fun destroy() {
        disconnect()
        scope.cancel()
    }

    enum class ConnectionState {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        ERROR
    }

    data class SystemStatus(
        val fps: Float,
        @com.google.gson.annotations.SerializedName("gpu_memory") val gpuMemory: Float,
        @com.google.gson.annotations.SerializedName("models_loaded") val modelsLoaded: List<String>
    )
}
