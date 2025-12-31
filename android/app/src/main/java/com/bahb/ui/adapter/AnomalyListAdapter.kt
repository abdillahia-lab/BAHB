package com.bahb.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bahb.R
import com.bahb.model.Anomaly
import com.bahb.model.SeverityLevel
import java.text.SimpleDateFormat
import java.util.*

/**
 * RecyclerView adapter for displaying anomaly alerts
 *
 * Optimized for quick scanning in field conditions with
 * high-contrast severity indicators
 */
class AnomalyListAdapter(
    private val onItemClick: (Anomaly) -> Unit
) : ListAdapter<Anomaly, AnomalyListAdapter.AnomalyViewHolder>(AnomalyDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AnomalyViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_anomaly, parent, false)
        return AnomalyViewHolder(view)
    }

    override fun onBindViewHolder(holder: AnomalyViewHolder, position: Int) {
        holder.bind(getItem(position), onItemClick)
    }

    class AnomalyViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val severityIndicator: View = itemView.findViewById(R.id.severity_indicator)
        private val typeText: TextView = itemView.findViewById(R.id.anomaly_type)
        private val descriptionText: TextView = itemView.findViewById(R.id.anomaly_description)
        private val timestampText: TextView = itemView.findViewById(R.id.anomaly_timestamp)
        private val confidenceText: TextView = itemView.findViewById(R.id.anomaly_confidence)

        private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

        fun bind(anomaly: Anomaly, onItemClick: (Anomaly) -> Unit) {
            // Severity color coding
            val severityColor = when (anomaly.severity) {
                SeverityLevel.CRITICAL -> R.color.severity_critical
                SeverityLevel.HIGH -> R.color.severity_high
                SeverityLevel.MEDIUM -> R.color.severity_medium
                SeverityLevel.LOW -> R.color.severity_low
            }
            severityIndicator.setBackgroundResource(severityColor)

            // Anomaly info
            typeText.text = anomaly.type.uppercase()
            descriptionText.text = anomaly.description
            timestampText.text = timeFormat.format(Date(anomaly.timestamp))
            confidenceText.text = "${(anomaly.confidence * 100).toInt()}%"

            itemView.setOnClickListener { onItemClick(anomaly) }
        }
    }

    class AnomalyDiffCallback : DiffUtil.ItemCallback<Anomaly>() {
        override fun areItemsTheSame(oldItem: Anomaly, newItem: Anomaly): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Anomaly, newItem: Anomaly): Boolean {
            return oldItem == newItem
        }
    }
}
