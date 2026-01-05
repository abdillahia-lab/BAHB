/**
 * Core Web Vitals Monitoring
 * Real-time performance tracking for LCP, CLS, INP, and FID
 */

export const webVitalsThresholds = {
  LCP: 1200, // < 1.2s
  CLS: 0.1,  // < 0.1
  INP: 50,   // < 50ms
  FID: 50,   // < 50ms
  TTFB: 600, // < 600ms
}

class WebVitalsMonitor {
  constructor() {
    this.metrics = {
      LCP: null,
      CLS: 0,
      INP: null,
      FID: null,
      TTFB: null,
      PageLoadTime: null,
    }
    this.observers = []
    this.startTime = performance.now()
  }

  /**
   * Measure LCP (Largest Contentful Paint)
   */
  measureLCP() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime
          console.log('LCP:', this.metrics.LCP, 'ms', {
            status: this.metrics.LCP <= webVitalsThresholds.LCP ? '✓' : '✗',
            element: lastEntry.element?.tagName,
          })
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(observer)
      } catch (e) {
        console.warn('LCP monitoring unavailable:', e.message)
      }
    }
  }

  /**
   * Measure CLS (Cumulative Layout Shift)
   */
  measureCLS() {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              this.metrics.CLS = clsValue
              console.log('CLS:', this.metrics.CLS.toFixed(3), {
                status: this.metrics.CLS < 0.1 ? '✓' : '✗',
                sources: entry.sources?.length || 0,
              })
            }
          }
        })
        observer.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(observer)
      } catch (e) {
        console.warn('CLS monitoring unavailable:', e.message)
      }
    }
  }

  /**
   * Measure INP (Interaction to Next Paint)
   */
  measureINP() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const longestEntry = entries.reduce((prev, current) =>
            prev.duration > current.duration ? prev : current
          )
          this.metrics.INP = longestEntry.duration
          console.log('INP:', this.metrics.INP.toFixed(2), 'ms', {
            status: this.metrics.INP <= webVitalsThresholds.INP ? '✓' : '✗',
            interactionType: longestEntry.interactionType,
          })
        })
        observer.observe({ entryTypes: ['interaction'] })
        this.observers.push(observer)
      } catch (e) {
        console.warn('INP monitoring unavailable:', e.message)
      }
    }
  }

  /**
   * Measure FID (First Input Delay) - deprecated, using INP instead
   */
  measureFID() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entry = list.entries()[0]
          this.metrics.FID = entry.processingStart - entry.startTime
          console.log('FID:', this.metrics.FID.toFixed(2), 'ms', {
            status: this.metrics.FID <= webVitalsThresholds.FID ? '✓' : '✗',
          })
        })
        observer.observe({ entryTypes: ['first-input'] })
        this.observers.push(observer)
      } catch (e) {
        console.warn('FID monitoring unavailable:', e.message)
      }
    }
  }

  /**
   * Measure TTFB (Time to First Byte)
   */
  measureTTFB() {
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart
      this.metrics.TTFB = ttfb
      console.log('TTFB:', ttfb, 'ms', {
        status: ttfb <= webVitalsThresholds.TTFB ? '✓' : '✗',
      })
    }
  }

  /**
   * Measure page load time
   */
  measurePageLoadTime() {
    window.addEventListener('load', () => {
      const pageLoadTime = performance.now() - this.startTime
      this.metrics.PageLoadTime = pageLoadTime
      console.log('Page Load Time:', pageLoadTime.toFixed(2), 'ms')
    }, { once: true })
  }

  /**
   * Start all monitoring
   */
  start() {
    console.group('Web Vitals Monitoring Started')
    this.measureTTFB()
    this.measureLCP()
    this.measureCLS()
    this.measureINP()
    this.measureFID()
    this.measurePageLoadTime()
    console.groupEnd()
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return { ...this.metrics }
  }

  /**
   * Get performance report
   */
  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      scores: {
        LCP: this.metrics.LCP ? this.metrics.LCP <= webVitalsThresholds.LCP : null,
        CLS: this.metrics.CLS < 0.1,
        INP: this.metrics.INP ? this.metrics.INP <= webVitalsThresholds.INP : null,
        FID: this.metrics.FID ? this.metrics.FID <= webVitalsThresholds.FID : null,
      },
    }
    return report
  }

  /**
   * Send metrics to analytics
   */
  sendMetrics(endpoint) {
    const report = this.getReport()
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(report))
    } else {
      fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(report),
        keepalive: true,
      }).catch(() => {
        console.warn('Failed to send metrics')
      })
    }
  }

  /**
   * Cleanup observers
   */
  stop() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  /**
   * Log performance summary
   */
  logSummary() {
    const report = this.getReport()
    console.group('Core Web Vitals Summary')
    console.log('LCP:', report.metrics.LCP, report.scores.LCP ? '✓ PASS' : '✗ FAIL')
    console.log('CLS:', report.metrics.CLS.toFixed(3), report.scores.CLS ? '✓ PASS' : '✗ FAIL')
    console.log('INP:', report.metrics.INP, report.scores.INP ? '✓ PASS' : '✗ FAIL')
    console.log('FID:', report.metrics.FID, report.scores.FID ? '✓ PASS' : '✗ FAIL')
    console.groupEnd()
  }
}

export const webVitals = new WebVitalsMonitor()

// Auto-start in development
if (import.meta.env.DEV) {
  window.__WEB_VITALS__ = webVitals
  webVitals.start()
}

export default webVitals
