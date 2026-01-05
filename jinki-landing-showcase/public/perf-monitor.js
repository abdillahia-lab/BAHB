/**
 * NETWORKPRO PERFORMANCE MONITORING
 * Real-time metrics tracking for competitive advantage
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    // Collect traditional timing metrics
    this.collectNavigationTiming();

    // Observe paint timing
    this.observePaintTiming();

    // Observe largest contentful paint (LCP)
    this.observeLCP();

    // Observe interaction to paint (INP)
    this.observeINP();

    // Observe cumulative layout shift (CLS)
    this.observeCLS();

    // Track resource timings
    this.observeResources();

    // Log results when page is done
    window.addEventListener('load', () => {
      setTimeout(() => this.logMetrics(), 3000);
    });

    // Send metrics to server
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendMetrics();
      }
    });

    // Also send before unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
  }

  collectNavigationTiming() {
    const nav = performance.getEntriesByType('navigation')[0] || {};

    this.metrics.ttfb = nav.responseStart - nav.requestStart;
    this.metrics.domInteractive = nav.domInteractive - nav.fetchStart;
    this.metrics.domComplete = nav.domComplete - nav.fetchStart;
    this.metrics.loadComplete = nav.loadEventEnd - nav.fetchStart;
    this.metrics.redirectTime = nav.redirectEnd - nav.redirectStart;
    this.metrics.appCacheTime = nav.domainLookupStart - nav.fetchStart;
    this.metrics.dnsTime = nav.domainLookupEnd - nav.domainLookupStart;
    this.metrics.tcpTime = nav.connectEnd - nav.connectStart;
    this.metrics.tlsTime = nav.secureConnectionStart > 0
      ? nav.connectEnd - nav.secureConnectionStart
      : 0;
  }

  observePaintTiming() {
    const paintEntries = performance.getEntriesByType('paint');

    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        this.metrics.fp = entry.startTime;
      }
      if (entry.name === 'first-contentful-paint') {
        this.metrics.fcp = entry.startTime;
      }
    });
  }

  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  observeINP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      // Calculate average INP
      const inpValues = entries.map(e => e.duration);
      this.metrics.inp = Math.max(...inpValues);
    });

    observer.observe({ entryTypes: ['event'] });
  }

  observeCLS() {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.cls = clsValue;
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  }

  observeResources() {
    const observer = new PerformanceObserver((list) => {
      this.metrics.resourceTimings = [];

      for (const entry of list.getEntries()) {
        this.metrics.resourceTimings.push({
          name: entry.name,
          type: entry.initiatorType,
          duration: entry.duration,
          size: entry.transferSize,
          cached: entry.transferSize === 0,
          dns: entry.domainLookupEnd - entry.domainLookupStart,
          tcp: entry.connectEnd - entry.connectStart,
          tls: entry.secureConnectionStart > 0
            ? entry.connectEnd - entry.secureConnectionStart
            : 0,
          request: entry.responseStart - entry.requestStart,
          response: entry.responseEnd - entry.responseStart,
        });
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  logMetrics() {
    console.group('NETWORKPRO PERFORMANCE METRICS');

    // Navigation Timing
    console.group('Navigation Timing');
    console.log(`TTFB: ${this.metrics.ttfb?.toFixed(2)}ms`);
    console.log(`DNS: ${this.metrics.dnsTime?.toFixed(2)}ms`);
    console.log(`TCP: ${this.metrics.tcpTime?.toFixed(2)}ms`);
    console.log(`TLS: ${this.metrics.tlsTime?.toFixed(2)}ms`);
    console.log(`DOM Interactive: ${this.metrics.domInteractive?.toFixed(2)}ms`);
    console.log(`DOM Complete: ${this.metrics.domComplete?.toFixed(2)}ms`);
    console.log(`Load Complete: ${this.metrics.loadComplete?.toFixed(2)}ms`);
    console.groupEnd();

    // Core Web Vitals
    console.group('Core Web Vitals');
    console.log(`FP: ${this.metrics.fp?.toFixed(2)}ms`);
    console.log(`FCP: ${this.metrics.fcp?.toFixed(2)}ms`);
    console.log(`LCP: ${this.metrics.lcp?.toFixed(2)}ms ${this.getVitalsStatus(this.metrics.lcp)}`);
    console.log(`INP: ${this.metrics.inp?.toFixed(2)}ms ${this.getVitalsStatus(this.metrics.inp, 'inp')}`);
    console.log(`CLS: ${this.metrics.cls?.toFixed(3)} ${this.getVitalsStatus(this.metrics.cls, 'cls')}`);
    console.groupEnd();

    // Resource Analysis
    if (this.metrics.resourceTimings) {
      console.group('Resource Timings');
      const cached = this.metrics.resourceTimings.filter(r => r.cached).length;
      const total = this.metrics.resourceTimings.length;
      console.log(`Cache Hit Ratio: ${(cached / total * 100).toFixed(0)}% (${cached}/${total})`);

      console.table(this.metrics.resourceTimings.slice(0, 10).map(r => ({
        'Resource': r.name.split('/').pop().substring(0, 20),
        'Type': r.type,
        'Duration': `${r.duration.toFixed(0)}ms`,
        'Size': r.size > 0 ? `${(r.size / 1024).toFixed(0)}KB` : 'cached',
        'DNS': `${r.dns.toFixed(0)}ms`,
        'TCP': `${r.tcp.toFixed(0)}ms`,
      })));
      console.groupEnd();
    }

    console.groupEnd();
  }

  getVitalsStatus(value, metric = 'lcp') {
    if (!value) return '⏳';

    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      inp: { good: 200, poor: 500 },
      cls: { good: 0.1, poor: 0.25 },
    };

    const threshold = thresholds[metric];
    if (value <= threshold.good) return '✓ GOOD';
    if (value <= threshold.poor) return '⚠ NEEDS WORK';
    return '✗ POOR';
  }

  sendMetrics() {
    // Send metrics to analytics endpoint
    const payload = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        saveData: navigator.connection.saveData,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
      } : null,
    };

    // Send via beacon (fires even if page unloads)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/perf', JSON.stringify(payload));
    } else {
      // Fallback to fetch
      fetch('/api/perf', {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(err => console.error('Failed to send metrics:', err));
    }
  }

  // Get all metrics as JSON
  getMetrics() {
    return { ...this.metrics };
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.perfMonitor = new PerformanceMonitor();
  });
} else {
  window.perfMonitor = new PerformanceMonitor();
}
