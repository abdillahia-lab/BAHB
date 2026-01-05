/**
 * LAZYMASTER: Real User Monitoring (RUM)
 * Track actual user performance metrics in production
 */

export class RUM {
  constructor(options = {}) {
    this.metrics = {}
    this.options = {
      endpoint: options.endpoint || '/api/metrics',
      sampleRate: options.sampleRate || 1.0, // 100% by default
      debug: options.debug || false,
      ...options
    }

    // Only track if within sample rate
    this.shouldTrack = Math.random() < this.options.sampleRate

    if (this.shouldTrack) {
      this.init()
    }
  }

  init() {
    // Web Vitals
    this.observeLCP()
    this.observeFID()
    this.observeCLS()
    this.observeFCP()

    // Custom metrics
    this.observeTimeToInteractive()
    this.observeResourceTiming()

    // Send metrics on page unload
    if ('sendBeacon' in navigator) {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.sendAllMetrics()
        }
      })
    }
  }

  observeLCP() {
    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]

        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime
        this.sendMetric('lcp', this.metrics.lcp)

        if (this.options.debug) {
          console.log('[RUM] LCP:', this.metrics.lcp, 'ms')
        }
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (error) {
      console.error('[RUM] LCP observation failed:', error)
    }
  }

  observeFID() {
    try {
      const observer = new PerformanceObserver(list => {
        const firstInput = list.getEntries()[0]
        this.metrics.fid = firstInput.processingStart - firstInput.startTime
        this.sendMetric('fid', this.metrics.fid)

        if (this.options.debug) {
          console.log('[RUM] FID:', this.metrics.fid, 'ms')
        }
      })

      observer.observe({ entryTypes: ['first-input'] })
    } catch (error) {
      console.error('[RUM] FID observation failed:', error)
    }
  }

  observeCLS() {
    try {
      let clsValue = 0

      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        this.metrics.cls = clsValue

        if (this.options.debug) {
          console.log('[RUM] CLS:', this.metrics.cls)
        }
      })

      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (error) {
      console.error('[RUM] CLS observation failed:', error)
    }
  }

  observeFCP() {
    try {
      const paintEntries = performance.getEntriesByType('paint')
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')

      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime
        this.sendMetric('fcp', this.metrics.fcp)

        if (this.options.debug) {
          console.log('[RUM] FCP:', this.metrics.fcp, 'ms')
        }
      }
    } catch (error) {
      console.error('[RUM] FCP observation failed:', error)
    }
  }

  observeTimeToInteractive() {
    try {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const tti = performance.now()
          this.metrics.tti = tti
          this.sendMetric('tti', tti)

          if (this.options.debug) {
            console.log('[RUM] TTI:', tti, 'ms')
          }
        }, 0)
      })
    } catch (error) {
      console.error('[RUM] TTI observation failed:', error)
    }
  }

  observeResourceTiming() {
    try {
      window.addEventListener('load', () => {
        const resources = performance.getEntriesByType('resource')

        const imageResources = resources.filter(r => r.initiatorType === 'img')
        const scriptResources = resources.filter(r => r.initiatorType === 'script')

        if (imageResources.length > 0) {
          const avgImageLoad = imageResources.reduce((sum, r) => sum + r.duration, 0) / imageResources.length
          this.metrics.avgImageLoad = avgImageLoad
          this.sendMetric('avgImageLoad', avgImageLoad)
        }

        if (scriptResources.length > 0) {
          const avgScriptLoad = scriptResources.reduce((sum, r) => sum + r.duration, 0) / scriptResources.length
          this.metrics.avgScriptLoad = avgScriptLoad
          this.sendMetric('avgScriptLoad', avgScriptLoad)
        }

        const totalTransferSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        this.metrics.totalTransferSize = totalTransferSize
        this.sendMetric('totalTransferSize', totalTransferSize)

        if (this.options.debug) {
          console.log('[RUM] Resource Timing:', {
            avgImageLoad: this.metrics.avgImageLoad,
            avgScriptLoad: this.metrics.avgScriptLoad,
            totalTransferSize: this.metrics.totalTransferSize
          })
        }
      })
    } catch (error) {
      console.error('[RUM] Resource timing observation failed:', error)
    }
  }

  sendMetric(name, value) {
    if (!this.shouldTrack) return

    const data = {
      metric: name,
      value: Math.round(value),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo()
    }

    // Send to analytics (Google Analytics example)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance', {
        metric_name: name,
        value: Math.round(value),
        metric_value: Math.round(value)
      })
    }

    // Send to custom endpoint
    if (this.options.endpoint) {
      this.queueMetric(data)
    }
  }

  queueMetric(data) {
    // Use sendBeacon for reliable delivery
    if ('sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      navigator.sendBeacon(this.options.endpoint, blob)
    } else {
      // Fallback to fetch
      fetch(this.options.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(error => {
        console.error('[RUM] Failed to send metric:', error)
      })
    }
  }

  sendAllMetrics() {
    if (!this.shouldTrack) return

    const allMetrics = {
      metrics: this.metrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo()
    }

    if (this.options.debug) {
      console.log('[RUM] Sending all metrics:', allMetrics)
    }

    if ('sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(allMetrics)], { type: 'application/json' })
      navigator.sendBeacon(this.options.endpoint, blob)
    }
  }

  getConnectionInfo() {
    if (!navigator.connection) return null

    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    }
  }

  getMetrics() {
    return this.metrics
  }

  // Get performance score (0-100)
  getPerformanceScore() {
    const scores = {}

    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
    if (this.metrics.lcp) {
      if (this.metrics.lcp < 2500) scores.lcp = 100
      else if (this.metrics.lcp < 4000) scores.lcp = 50
      else scores.lcp = 0
    }

    // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    if (this.metrics.fid) {
      if (this.metrics.fid < 100) scores.fid = 100
      else if (this.metrics.fid < 300) scores.fid = 50
      else scores.fid = 0
    }

    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (this.metrics.cls !== undefined) {
      if (this.metrics.cls < 0.1) scores.cls = 100
      else if (this.metrics.cls < 0.25) scores.cls = 50
      else scores.cls = 0
    }

    const avgScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length

    return {
      overall: Math.round(avgScore),
      breakdown: scores
    }
  }
}

// Auto-initialize for production
if (typeof window !== 'undefined') {
  window.rum = new RUM({
    sampleRate: 0.1, // Track 10% of users
    debug: process.env.NODE_ENV === 'development'
  })
}

export default RUM
