import { Suspense, lazy } from 'react'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import { SkeletonSection } from './SkeletonLoaders'

/**
 * LAZYMASTER: Lazy-loaded Section with Suspense
 * Only loads component code when section comes into view
 * Combined with route-based code splitting = massive perf gains
 */

export const LazySuspenseSection = ({
  component: Component,
  fallback = <SkeletonSection />,
  className = '',
  ...props
}) => {
  const { ref, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.05,
    rootMargin: '200px'
  })

  return (
    <div ref={ref} className={className}>
      {hasBeenVisible ? (
        <Suspense fallback={fallback}>
          <Component {...props} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}

/**
 * Component wrapper for lazy loading with dynamic import
 * Usage:
 * const LazySection = lazyComponent(() => import('./HeavySection'))
 * <Suspense fallback={<Skeleton />}><LazySection /></Suspense>
 */
export const lazyComponent = (importFunc) => {
  return lazy(importFunc)
}

/**
 * Higher Order Component for lazy-loading specific sections
 */
export const withLazySuspense = (Component, fallback = <SkeletonSection />) => {
  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  )
}
