import '../styles/skeleton-loaders.css'

/**
 * LAZYMASTER: Skeleton UI Components
 * Provide meaningful loading states that reduce perceived latency
 * Psychology: Content skeleton looks like real content, feels faster
 */

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`skeleton-card ${className}`}>
      <div className="skeleton-card__image skeleton skeleton--pulse" />
      <div className="skeleton-card__content">
        <div className="skeleton-card__title skeleton skeleton--pulse" />
        <div className="skeleton-card__text skeleton skeleton--pulse" />
        <div className="skeleton-card__text skeleton skeleton--pulse" style={{ width: '80%' }} />
        <div className="skeleton-card__stats">
          <div className="skeleton-card__stat">
            <div className="skeleton-card__stat-value skeleton skeleton--pulse" />
            <div className="skeleton-card__stat-label skeleton skeleton--pulse" />
          </div>
          <div className="skeleton-card__stat">
            <div className="skeleton-card__stat-value skeleton skeleton--pulse" />
            <div className="skeleton-card__stat-label skeleton skeleton--pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton--pulse"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            height: '12px',
            marginBottom: i < lines - 1 ? '8px' : 0
          }}
        />
      ))}
    </div>
  )
}

export const SkeletonImage = ({ width = '100%', height = '300px', className = '' }) => {
  return (
    <div
      className={`skeleton skeleton--pulse ${className}`}
      style={{
        width,
        height,
        borderRadius: '8px'
      }}
    />
  )
}

export const SkeletonSection = ({ className = '' }) => {
  return (
    <div className={`skeleton-section ${className}`}>
      <div className="skeleton-section__header">
        <div className="skeleton skeleton--pulse" style={{ width: '150px', height: '20px' }} />
        <div className="skeleton skeleton--pulse" style={{ width: '400px', height: '32px', marginTop: '12px' }} />
      </div>
      <div className="skeleton-section__content">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

export const SkeletonFeature = ({ className = '' }) => {
  return (
    <div className={`skeleton-feature ${className}`}>
      <div className="skeleton skeleton--pulse" style={{ width: '24px', height: '24px' }} />
      <div className="skeleton skeleton--pulse" style={{ width: '200px', height: '16px' }} />
    </div>
  )
}

export const SkeletonCounter = ({ className = '' }) => {
  return (
    <div className={`skeleton-counter ${className}`}>
      <div className="skeleton skeleton--pulse" style={{ width: '80px', height: '28px', marginBottom: '8px' }} />
      <div className="skeleton skeleton--pulse" style={{ width: '100px', height: '14px' }} />
    </div>
  )
}

/**
 * Shimmer effect for more sophisticated loading states
 */
export const SkeletonShimmer = ({ width = '100%', height = '100px', className = '' }) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite'
      }}
    />
  )
}
