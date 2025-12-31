package com.bahb.ui.overlay

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import com.bahb.model.Anomaly
import com.bahb.model.Detection
import com.bahb.model.SeverityLevel
import com.bahb.model.ThermalReading

/**
 * Custom overlay view for rendering AI detection results on top of DJI FPV
 *
 * Draws bounding boxes, labels, and anomaly indicators synchronized with
 * real-time inference from Manifold 3
 */
class DetectionOverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var detections: List<Detection> = emptyList()
    private var anomalies: List<Anomaly> = emptyList()
    private var thermalReading: ThermalReading? = null
    private var showThermalInfo = true

    // Video frame dimensions (for coordinate scaling)
    private var frameWidth = 1920f
    private var frameHeight = 1080f

    // Paint objects (pre-allocated for performance)
    private val boxPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 4f
    }

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 32f
        typeface = Typeface.DEFAULT_BOLD
    }

    private val textBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(180, 0, 0, 0)
        style = Paint.Style.FILL
    }

    private val thermalPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 28f
        typeface = Typeface.MONOSPACE
    }

    private val tempRect = RectF()
    private val textBounds = Rect()

    // Color mappings
    private val defectClasses = setOf("damage", "corrosion", "hotspot", "leak", "crack", "contamination")
    private val equipmentClasses = setOf("transformer", "insulator", "switchgear", "conductor")

    fun updateDetections(detections: List<Detection>) {
        this.detections = detections
        invalidate()
    }

    fun updateAnomalies(anomalies: List<Anomaly>) {
        this.anomalies = anomalies
        invalidate()
    }

    fun updateThermal(thermal: ThermalReading?) {
        this.thermalReading = thermal
        invalidate()
    }

    fun setFrameDimensions(width: Int, height: Int) {
        frameWidth = width.toFloat()
        frameHeight = height.toFloat()
        invalidate()
    }

    fun setShowThermalInfo(show: Boolean) {
        showThermalInfo = show
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        // Scale factors for coordinate mapping
        val scaleX = width / frameWidth
        val scaleY = height / frameHeight

        // Draw detection boxes
        detections.forEach { detection ->
            drawDetection(canvas, detection, scaleX, scaleY)
        }

        // Draw thermal info overlay
        if (showThermalInfo && thermalReading != null) {
            drawThermalInfo(canvas)
        }

        // Draw anomaly count badge
        if (anomalies.isNotEmpty()) {
            drawAnomalyBadge(canvas)
        }
    }

    private fun drawDetection(canvas: Canvas, detection: Detection, scaleX: Float, scaleY: Float) {
        val bbox = detection.bbox

        // Scale coordinates to view size
        tempRect.set(
            bbox.x1 * scaleX,
            bbox.y1 * scaleY,
            bbox.x2 * scaleX,
            bbox.y2 * scaleY
        )

        // Determine color based on class type
        val color = getColorForDetection(detection)
        boxPaint.color = color

        // Draw bounding box
        canvas.drawRect(tempRect, boxPaint)

        // Draw corner accents for emphasis
        drawCornerAccents(canvas, tempRect, color)

        // Draw label
        val label = "${detection.className} ${(detection.confidence * 100).toInt()}%"
        textPaint.getTextBounds(label, 0, label.length, textBounds)

        val labelX = tempRect.left
        val labelY = tempRect.top - 8

        // Label background
        canvas.drawRect(
            labelX - 4,
            labelY - textBounds.height() - 4,
            labelX + textBounds.width() + 8,
            labelY + 4,
            textBgPaint
        )

        // Label text
        textPaint.color = color
        canvas.drawText(label, labelX, labelY, textPaint)
        textPaint.color = Color.WHITE
    }

    private fun drawCornerAccents(canvas: Canvas, rect: RectF, color: Int) {
        val cornerLength = 20f
        boxPaint.color = color
        boxPaint.strokeWidth = 6f

        // Top-left
        canvas.drawLine(rect.left, rect.top, rect.left + cornerLength, rect.top, boxPaint)
        canvas.drawLine(rect.left, rect.top, rect.left, rect.top + cornerLength, boxPaint)

        // Top-right
        canvas.drawLine(rect.right - cornerLength, rect.top, rect.right, rect.top, boxPaint)
        canvas.drawLine(rect.right, rect.top, rect.right, rect.top + cornerLength, boxPaint)

        // Bottom-left
        canvas.drawLine(rect.left, rect.bottom, rect.left + cornerLength, rect.bottom, boxPaint)
        canvas.drawLine(rect.left, rect.bottom - cornerLength, rect.left, rect.bottom, boxPaint)

        // Bottom-right
        canvas.drawLine(rect.right - cornerLength, rect.bottom, rect.right, rect.bottom, boxPaint)
        canvas.drawLine(rect.right, rect.bottom - cornerLength, rect.right, rect.bottom, boxPaint)

        boxPaint.strokeWidth = 4f
    }

    private fun getColorForDetection(detection: Detection): Int {
        return when {
            detection.className in defectClasses -> {
                // Red/Orange for defects
                when (detection.className) {
                    "damage", "crack" -> Color.rgb(255, 50, 50)
                    "hotspot" -> Color.rgb(255, 100, 0)
                    "corrosion", "leak" -> Color.rgb(255, 165, 0)
                    else -> Color.rgb(255, 200, 0)
                }
            }
            detection.className in equipmentClasses -> {
                // Green/Cyan for equipment
                Color.rgb(0, 200, 150)
            }
            else -> {
                // Blue for other
                Color.rgb(100, 150, 255)
            }
        }
    }

    private fun drawThermalInfo(canvas: Canvas) {
        val thermal = thermalReading ?: return

        val padding = 16f
        val lineHeight = 36f
        val startX = width - 220f
        val startY = padding + lineHeight

        // Background panel
        fillPaint.color = Color.argb(200, 0, 0, 0)
        canvas.drawRoundRect(
            startX - padding,
            startY - lineHeight,
            width - padding,
            startY + lineHeight * 4,
            12f, 12f,
            fillPaint
        )

        // Thermal data
        thermalPaint.color = Color.WHITE
        canvas.drawText("THERMAL", startX, startY, thermalPaint)

        thermalPaint.color = getTempColor(thermal.maxTemp)
        canvas.drawText("Max: ${thermal.maxTemp.toInt()}°C", startX, startY + lineHeight, thermalPaint)

        thermalPaint.color = Color.CYAN
        canvas.drawText("Min: ${thermal.minTemp.toInt()}°C", startX, startY + lineHeight * 2, thermalPaint)

        thermalPaint.color = if (thermal.deltaT > 30) Color.RED else Color.YELLOW
        canvas.drawText("ΔT: ${thermal.deltaT.toInt()}°C", startX, startY + lineHeight * 3, thermalPaint)
    }

    private fun getTempColor(temp: Float): Int {
        return when {
            temp > 100 -> Color.rgb(255, 0, 0)
            temp > 80 -> Color.rgb(255, 100, 0)
            temp > 60 -> Color.rgb(255, 200, 0)
            else -> Color.rgb(100, 255, 100)
        }
    }

    private fun drawAnomalyBadge(canvas: Canvas) {
        val criticalCount = anomalies.count { it.severity == SeverityLevel.CRITICAL }
        val highCount = anomalies.count { it.severity == SeverityLevel.HIGH }
        val total = anomalies.size

        val badgeX = 20f
        val badgeY = 20f
        val badgeSize = 80f

        // Badge background
        fillPaint.color = when {
            criticalCount > 0 -> Color.rgb(200, 0, 0)
            highCount > 0 -> Color.rgb(255, 100, 0)
            else -> Color.rgb(255, 200, 0)
        }
        canvas.drawRoundRect(
            badgeX, badgeY,
            badgeX + badgeSize, badgeY + badgeSize,
            12f, 12f, fillPaint
        )

        // Count text
        textPaint.textSize = 40f
        textPaint.color = Color.WHITE
        val countText = total.toString()
        textPaint.getTextBounds(countText, 0, countText.length, textBounds)
        canvas.drawText(
            countText,
            badgeX + (badgeSize - textBounds.width()) / 2,
            badgeY + (badgeSize + textBounds.height()) / 2,
            textPaint
        )
        textPaint.textSize = 32f

        // Label
        textPaint.textSize = 18f
        canvas.drawText("ALERTS", badgeX + 12, badgeY + badgeSize + 24, textPaint)
        textPaint.textSize = 32f
    }
}
