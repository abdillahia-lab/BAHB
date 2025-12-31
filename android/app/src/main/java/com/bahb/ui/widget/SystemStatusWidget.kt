package com.bahb.ui.widget

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import com.bahb.service.ManifoldConnection

/**
 * Compact widget showing Manifold 3 system status
 *
 * Displays FPS, GPU usage, and model status in a small overlay
 */
class SystemStatusWidget @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var systemStatus: ManifoldConnection.SystemStatus? = null

    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(200, 0, 0, 0)
        style = Paint.Style.FILL
    }

    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 24f
        typeface = android.graphics.Typeface.MONOSPACE
    }

    private val barPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val barRect = RectF()

    fun updateStatus(status: ManifoldConnection.SystemStatus) {
        this.systemStatus = status
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val status = systemStatus ?: return

        val padding = 12f
        val lineHeight = 28f

        // Background
        canvas.drawRoundRect(
            0f, 0f, width.toFloat(), height.toFloat(),
            8f, 8f, bgPaint
        )

        var y = padding + lineHeight

        // FPS
        val fpsColor = when {
            status.fps >= 25 -> Color.rgb(100, 255, 100)
            status.fps >= 15 -> Color.rgb(255, 200, 0)
            else -> Color.rgb(255, 80, 80)
        }
        textPaint.color = fpsColor
        canvas.drawText("FPS: ${status.fps.toInt()}", padding, y, textPaint)
        y += lineHeight

        // GPU Memory bar
        textPaint.color = Color.WHITE
        canvas.drawText("GPU:", padding, y, textPaint)

        val barX = padding + 60
        val barWidth = width - barX - padding
        val barHeight = 16f

        // Background bar
        barPaint.color = Color.DKGRAY
        barRect.set(barX, y - barHeight, barX + barWidth, y)
        canvas.drawRoundRect(barRect, 4f, 4f, barPaint)

        // Usage bar
        val usageWidth = (status.gpuMemory / 100f) * barWidth
        barPaint.color = when {
            status.gpuMemory < 70 -> Color.rgb(100, 200, 100)
            status.gpuMemory < 90 -> Color.rgb(255, 200, 0)
            else -> Color.rgb(255, 80, 80)
        }
        barRect.set(barX, y - barHeight, barX + usageWidth, y)
        canvas.drawRoundRect(barRect, 4f, 4f, barPaint)

        y += lineHeight

        // Models loaded
        textPaint.color = Color.CYAN
        val modelText = "${status.modelsLoaded.size} models"
        canvas.drawText(modelText, padding, y, textPaint)
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val desiredWidth = 180
        val desiredHeight = 100

        val widthMode = MeasureSpec.getMode(widthMeasureSpec)
        val widthSize = MeasureSpec.getSize(widthMeasureSpec)
        val heightMode = MeasureSpec.getMode(heightMeasureSpec)
        val heightSize = MeasureSpec.getSize(heightMeasureSpec)

        val width = when (widthMode) {
            MeasureSpec.EXACTLY -> widthSize
            MeasureSpec.AT_MOST -> minOf(desiredWidth, widthSize)
            else -> desiredWidth
        }

        val height = when (heightMode) {
            MeasureSpec.EXACTLY -> heightSize
            MeasureSpec.AT_MOST -> minOf(desiredHeight, heightSize)
            else -> desiredHeight
        }

        setMeasuredDimension(width, height)
    }
}
