/**
 * LAZYMASTER: Performance Testing Utilities
 * Measure real-world performance metrics
 */

class PerformanceTester {
  constructor() {
    this.metrics = {}
    this.observers = {}
  }

  // Measure LCP (Largest Contentful Paint)
  measureLCP() {
    return new Promise(resolve => {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]

        this.metrics.lcp = {
          value: lastEntry.renderTime || lastEntry.loadTime,
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || 'N/A'
        }

        console.log('LCP:', this.metrics.lcp)
        resolve(this.metrics.lcp)
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.lcp = observer
    })
  }

  // Measure FID (First Input Delay)
  measureFID() {
    return new Promise(resolve => {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries()
        const firstInput = entries[0]

        this.metrics.fid = {
          value: firstInput.processingStart - firstInput.startTime,
          eventType: firstInput.name
        }

        console.log('FID:', this.metrics.fid)
        resolve(this.metrics.fid)
        observer.disconnect()
      })

      observer.observe({ entryTypes: ['first-input'] })
      this.observers.fid = observer
    })
  }

  // Measure CLS (Cumulative Layout Shift)
  measureCLS() {
    let clsScore = 0

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value
        }
      }

      this.metrics.cls = { value: clsScore }
      console.log('CLS:', this.metrics.cls)
    })

    observer.observe({ entryTypes: ['layout-shift'] })
    this.observers.cls = observer

    return this.metrics.cls
  }

  // Measure TTFB (Time to First Byte)
  measureTTFB() {
    const navTiming = performance.getEntriesByType('navigation')[0]
    if (navTiming) {
      this.metrics.ttfb = {
        value: navTiming.responseStart - navTiming.requestStart
      }
      console.log('TTFB:', this.metrics.ttfb)
    }
    return this.metrics.ttfb
  }

  // Measure FCP (First Contentful Paint)
  measureFCP() {
    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')

    if (fcpEntry) {
      this.metrics.fcp = {
        value: fcpEntry.startTime
      }
      console.log('FCP:', this.metrics.fcp)
    }

    return this.metrics.fcp
  }

  // Measure custom metrics
  measureCustomMetric(name, startMark, endMark) {
    performance.mark(endMark)
    performance.measure(name, startMark, endMark)

    const measure = performance.getEntriesByName(name)[0]
    this.metrics[name] = { value: measure.duration }

    console.log(`${name}:`, this.metrics[name])
    return this.metrics[name]
  }

  // Mark a custom timing
  mark(name) {
    performance.mark(name)
  }

  // Get resource timing breakdown
  getResourceTiming() {
    const resources = performance.getEntriesByType('resource')

    const breakdown = {
      images: [],
      scripts: [],
      styles: [],
      other: []
    }

    resources.forEach(resource => {
      const data = {
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        cached: resource.transferSize === 0
      }

      if (resource.initiatorType === 'img') {
        breakdown.images.push(data)
      } else if (resource.initiatorType === 'script') {
        breakdown.scripts.push(data)
      } else if (resource.initiatorType === 'css') {
        breakdown.styles.push(data)
      } else {
        breakdown.other.push(data)
      }
    })

    // Calculate averages
    const calculateAverage = (arr) => {
      if (arr.length === 0) return 0
      return arr.reduce((sum, item) => sum + item.duration, 0) / arr.length
    }

    this.metrics.resourceTiming = {
      imageCount: breakdown.images.length,
      scriptCount: breakdown.scripts.length,
      styleCount: breakdown.styles.length,
      avgImageLoadTime: calculateAverage(breakdown.images),
      avgScriptLoadTime: calculateAverage(breakdown.scripts),
      avgStyleLoadTime: calculateAverage(breakdown.styles),
      totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    }

    console.log('Resource Timing:', this.metrics.resourceTiming)
    return this.metrics.resourceTiming
  }

  // Report all metrics
  reportMetrics() {
    console.group('Performance Metrics')
    console.table(this.metrics)
    console.groupEnd()

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      Object.entries(this.metrics).forEach(([name, data]) => {
        window.gtag('event', 'performance', {
          metric_name: name,
          value: Math.round(data.value || 0),
          metric_value: Math.round(data.value || 0)
        })
      })
    }

    return this.metrics
  }

  // Compare before/after
  static compareMetrics(before, after) {
    const comparison = {}

    Object.keys(before).forEach(key => {
      if (after[key]) {
        const beforeValue = before[key].value || 0
        const afterValue = after[key].value || 0
        const improvement = ((beforeValue - afterValue) / beforeValue) * 100

        comparison[key] = {
          before: beforeValue.toFixed(2),
          after: afterValue.toFixed(2),
          improvement: `${improvement.toFixed(2)}%`,
          delta: (beforeValue - afterValue).toFixed(2),
          direction: improvement > 0 ? '↓ Better' : '↑ Worse'
        }
      }
    })

    console.group('Performance Comparison')
    console.table(comparison)
    console.groupEnd()

    return comparison
  }

  // Run all measurements
  async measureAll() {
    this.measureTTFB()
    this.measureFCP()
    this.measureCLS()
    this.getResourceTiming()

    // LCP and FID are async
    await Promise.all([
      this.measureLCP(),
      this.measureFID().catch(() => console.log('FID: Waiting for user interaction...'))
    ])

    return this.reportMetrics()
  }

  // Cleanup
  cleanup() {
    Object.values(this.observers).forEach(observer => {
      observer.disconnect()
    })
  }
}

export default PerformanceTester

// Auto-initialize for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.perfTester = new PerformanceTester()
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.perfTester.measureAll()
    }, 2000)
  })
}
