package com.bahb.ui

import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.bahb.R
import com.bahb.databinding.ActivityMainBinding
import com.bahb.model.InspectionState
import com.bahb.model.SeverityLevel
import com.bahb.service.ManifoldConnection
import com.bahb.ui.overlay.DetectionOverlayView
import dji.v5.manager.KeyManager
import dji.v5.manager.aircraft.perception.PerceptionManager
import dji.v5.manager.datacenter.MediaDataCenter
import dji.v5.manager.datacenter.livestream.LiveStreamManager
import dji.v5.manager.interfaces.IKeyManager
import dji.v5.ux.core.base.DJISDKModel
import dji.v5.ux.core.communication.ObservableInMemoryKeyedStore
import dji.v5.ux.cameracore.widget.fpvinteraction.FPVInteractionWidget
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import timber.log.Timber

/**
 * Main inspection activity integrating DJI FPV with BAHB AI overlay
 *
 * Optimized for DJI RC Plus 2 Enterprise (7" 1920x1200, 1400 nits)
 * Handles physical button mappings and touch gestures
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var manifoldConnection: ManifoldConnection
    private lateinit var detectionOverlay: DetectionOverlayView

    private var inspectionState = InspectionState.IDLE
    private var isThermalEnabled = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen immersive mode
        setupImmersiveMode()

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize Manifold connection
        manifoldConnection = ManifoldConnection()

        // Get overlay reference
        detectionOverlay = binding.detectionOverlay

        setupDJIWidgets()
        setupControls()
        observeManifoldData()

        // Connect to Manifold 3
        manifoldConnection.connect()
    }

    private fun setupImmersiveMode() {
        window.apply {
            addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
        }
    }

    private fun setupDJIWidgets() {
        // FPV widget is configured in XML layout
        // Configure camera source for enterprise drone
        binding.fpvWidget.apply {
            // Set to main camera by default
            // Will switch based on thermal toggle
        }

        // System status bar updates
        updateConnectionStatus()
    }

    private fun setupControls() {
        // Start/Stop Inspection Button
        binding.btnInspection.setOnClickListener {
            toggleInspection()
        }

        // Capture Snapshot Button
        binding.btnCapture.setOnClickListener {
            captureSnapshot()
        }

        // Thermal Toggle Button
        binding.btnThermal.setOnClickListener {
            toggleThermal()
        }

        // Anomaly panel toggle
        binding.btnAnomalies.setOnClickListener {
            toggleAnomalyPanel()
        }
    }

    private fun observeManifoldData() {
        // Observe detection results
        lifecycleScope.launch {
            manifoldConnection.latestDetections.collectLatest { detections ->
                detectionOverlay.updateDetections(detections)
                updateDetectionCount(detections.size)
            }
        }

        // Observe thermal data
        lifecycleScope.launch {
            manifoldConnection.latestThermal.collectLatest { thermal ->
                detectionOverlay.updateThermal(thermal)
            }
        }

        // Observe anomalies
        lifecycleScope.launch {
            manifoldConnection.anomalies.collectLatest { anomaly ->
                handleNewAnomaly(anomaly)
            }
        }

        // Observe connection state
        lifecycleScope.launch {
            manifoldConnection.connectionState.collectLatest { state ->
                updateManifoldStatus(state)
            }
        }

        // Observe system status
        lifecycleScope.launch {
            manifoldConnection.systemStatus.collectLatest { status ->
                status?.let { updateSystemStats(it) }
            }
        }
    }

    private fun toggleInspection() {
        when (inspectionState) {
            InspectionState.IDLE -> {
                manifoldConnection.startInspection("infrastructure", "Field Site")
                inspectionState = InspectionState.ACTIVE
                binding.btnInspection.text = getString(R.string.btn_stop_inspection)
                binding.btnInspection.setBackgroundColor(getColor(R.color.severity_high))
                binding.statusInspection.text = getString(R.string.status_inspecting)
            }
            InspectionState.ACTIVE -> {
                manifoldConnection.stopInspection()
                inspectionState = InspectionState.IDLE
                binding.btnInspection.text = getString(R.string.btn_start_inspection)
                binding.btnInspection.setBackgroundColor(getColor(R.color.bahb_primary))
                binding.statusInspection.text = getString(R.string.status_idle)
            }
            else -> { /* Processing state - ignore */ }
        }
    }

    private fun captureSnapshot() {
        manifoldConnection.captureSnapshot()
        // Visual feedback
        binding.root.postDelayed({
            Toast.makeText(this, "Snapshot captured", Toast.LENGTH_SHORT).show()
        }, 100)
    }

    private fun toggleThermal() {
        isThermalEnabled = !isThermalEnabled
        manifoldConnection.toggleThermalOverlay(isThermalEnabled)
        detectionOverlay.setShowThermalInfo(isThermalEnabled)

        binding.btnThermal.alpha = if (isThermalEnabled) 1.0f else 0.5f
    }

    private fun toggleAnomalyPanel() {
        val panel = binding.anomalyPanel
        panel.visibility = if (panel.visibility == View.VISIBLE) View.GONE else View.VISIBLE
    }

    private fun handleNewAnomaly(anomaly: com.bahb.model.Anomaly) {
        // Add to list adapter
        runOnUiThread {
            // Haptic feedback for critical anomalies
            if (anomaly.severity == SeverityLevel.CRITICAL) {
                binding.root.performHapticFeedback(android.view.HapticFeedbackConstants.LONG_PRESS)
            }

            // Update badge count
            val currentCount = binding.anomalyBadge.text.toString().toIntOrNull() ?: 0
            binding.anomalyBadge.text = (currentCount + 1).toString()
            binding.anomalyBadge.visibility = View.VISIBLE
        }
    }

    private fun updateDetectionCount(count: Int) {
        binding.detectionCount.text = count.toString()
    }

    private fun updateConnectionStatus() {
        // DJI connection status handled by DJI widgets
    }

    private fun updateManifoldStatus(state: ManifoldConnection.ConnectionState) {
        runOnUiThread {
            when (state) {
                ManifoldConnection.ConnectionState.CONNECTED -> {
                    binding.statusManifold.text = getString(R.string.manifold_connected)
                    binding.statusManifold.setTextColor(getColor(R.color.status_connected))
                    binding.statusIndicator.setBackgroundColor(getColor(R.color.status_connected))
                }
                ManifoldConnection.ConnectionState.DISCONNECTED -> {
                    binding.statusManifold.text = getString(R.string.manifold_disconnected)
                    binding.statusManifold.setTextColor(getColor(R.color.status_disconnected))
                    binding.statusIndicator.setBackgroundColor(getColor(R.color.status_disconnected))
                }
                ManifoldConnection.ConnectionState.ERROR -> {
                    binding.statusManifold.text = "AI System Error"
                    binding.statusManifold.setTextColor(getColor(R.color.status_warning))
                    binding.statusIndicator.setBackgroundColor(getColor(R.color.status_warning))
                }
                else -> {}
            }
        }
    }

    private fun updateSystemStats(status: ManifoldConnection.SystemStatus) {
        runOnUiThread {
            binding.statsFps.text = "${status.fps.toInt()} FPS"
            binding.statsGpu.text = "${status.gpuMemory.toInt()}% GPU"
        }
    }

    /**
     * Handle DJI RC Plus 2 physical button events
     * C1/C2 buttons can be mapped to custom functions
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        return when (keyCode) {
            // C1 Button - Toggle inspection
            KeyEvent.KEYCODE_BUTTON_L1 -> {
                toggleInspection()
                true
            }
            // C2 Button - Capture snapshot
            KeyEvent.KEYCODE_BUTTON_R1 -> {
                captureSnapshot()
                true
            }
            // 5D Button press - Toggle thermal
            KeyEvent.KEYCODE_BUTTON_SELECT -> {
                toggleThermal()
                true
            }
            // Volume buttons for panel navigation
            KeyEvent.KEYCODE_VOLUME_UP -> {
                toggleAnomalyPanel()
                true
            }
            else -> super.onKeyDown(keyCode, event)
        }
    }

    override fun onResume() {
        super.onResume()
        setupImmersiveMode()
    }

    override fun onDestroy() {
        super.onDestroy()
        manifoldConnection.destroy()
    }
}
