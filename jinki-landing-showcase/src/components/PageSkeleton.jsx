import { motion } from 'framer-motion'
import './PageSkeleton.css'

export default function PageSkeleton() {
  return (
    <div className="page-skeleton">
      <div className="page-skeleton__container">
        {/* Header skeleton */}
        <motion.div
          className="page-skeleton__header"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Hero skeleton */}
        <motion.div
          className="page-skeleton__hero"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />

        {/* Content skeleton */}
        <div className="page-skeleton__content">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="page-skeleton__card"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 + i * 0.1 }}
            />
          ))}
        </div>

        {/* Loading indicator */}
        <motion.div
          className="page-skeleton__loader"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          ◉
        </motion.div>
      </div>
    </div>
  )
}
