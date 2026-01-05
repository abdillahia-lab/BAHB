/**
 * GPU RENDERING PERFORMANCE MONITOR
 * Real-time FPS, paint, and memory tracking
 * Enables competitive advantage through measurement
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      updateInterval: 1000,  // ms
      logPerformance: true,
      captureMetrics: true,
      ...options,
    };

    this.frames = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.metrics = {
      paints: 0,
      composites: 0,
      memory: 0,
      scriptTime: 0,
      layoutTime: 0,
      paintTime: 0,
    };

    this.history = {
      fps: [],
      memory: [],
      script: [],
      layout: [],
      paint: [],
    };

    this.maxHistorySize = 60;  // 60 second history
    this.active = false;
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.active) return;
    this.active = true;

    // Frame counting
    const countFrames = () => {
      this.frames++;
      const now = performance.now();

      if (now - this.lastTime >= this.options.updateInterval) {
        this.fps = Math.round(this.frames);
        this.history.fps.push(this.fps);

        if (this.history.fps.length > this.maxHistorySize) {
          this.history.fps.shift();
        }

        this.frames = 0;
        this.lastTime = now;

        if (this.options.logPerformance) {
          this.logCurrentMetrics();
        }
      }

      requestAnimationFrame(countFrames);
    };

    requestAnimationFrame(countFrames);

    // Memory tracking
    if (this.options.captureMetrics && performance.memory) {
      this.memoryInterval = setInterval(() => {
        this.metrics.memory = Math.round(
          performance.memory.usedJSHeapSize / 1048576
        );  // MB
        this.history.memory.push(this.metrics.memory);

        if (this.history.memory.length > this.maxHistorySize) {
          this.history.memory.shift();
        }
      }, this.options.updateInterval);
    }

    // PerformanceObserver for paint/layout/script
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              this.metrics.paints++;
            } else if (entry.entryType === 'measure') {
              if (entry.name.includes('script')) {
                this.metrics.scriptTime = entry.duration;
                this.history.script.push(entry.duration);
              } else if (entry.name.includes('layout')) {
                this.metrics.layoutTime = entry.duration;
                this.history.layout.push(entry.duration);
              } else if (entry.name.includes('paint')) {
                this.metrics.paintTime = entry.duration;
                this.history.paint.push(entry.duration);
              }
            }
          }
        });

        observer.observe({ entryTypes: ['paint', 'measure'] });
      } catch (e) {
        console.warn('PerformanceObserver not supported:', e);
      }
    }

    // Expose to window
    window.__PERF__ = this.getReport();
    window.__PERF_MONITOR__ = this;
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    this.active = false;
  }

  /**
   * Log current metrics
   */
  logCurrentMetrics() {
    const style = 'background: #00b4d8; color: #0d1117; padding: 4px 8px; border-radius: 3px; font-weight: bold;';
    console.log(
      `%cFPS: ${this.fps} | Memory: ${this.metrics.memory}MB | Paint: ${this.metrics.paintTime.toFixed(1)}ms | Layout: ${this.metrics.layoutTime.toFixed(1)}ms`,
      style
    );
  }

  /**
   * Get current report
   */
  getReport() {
    return {
      fps: this.fps,
      avgFPS: Math.round(this.history.fps.reduce((a, b) => a + b, 0) / (this.history.fps.length || 1)),
      minFPS: Math.min(...this.history.fps),
      maxFPS: Math.max(...this.history.fps),
      memory: this.metrics.memory,
      avgMemory: Math.round(
        this.history.memory.reduce((a, b) => a + b, 0) / (this.history.memory.length || 1)
      ),
      scriptTime: this.metrics.scriptTime.toFixed(2),
      layoutTime: this.metrics.layoutTime.toFixed(2),
      paintTime: this.metrics.paintTime.toFixed(2),
      metrics: this.metrics,
      history: this.history,
      frameTime: this.fps > 0 ? (1000 / this.fps).toFixed(2) : 'N/A',
    };
  }

  /**
   * Get performance report
   */
  getFullReport() {
    const report = this.getReport();
    const navTiming = performance.getEntriesByType('navigation')[0];

    if (navTiming) {
      report.navigationTiming = {
        dns: navTiming.domainLookupEnd - navTiming.domainLookupStart,
        tcp: navTiming.connectEnd - navTiming.connectStart,
        ttfb: navTiming.responseStart - navTiming.requestStart,
        fcp: performance
          .getEntriesByName('first-contentful-paint')[0]
          ?.startTime || 'N/A',
        lcp: performance
          .getEntriesByType('largest-contentful-paint')
          .slice(-1)[0]?.renderTime || 'N/A',
        cls: performance
          .getEntriesByType('layout-shift')
          .reduce((sum, entry) => sum + (entry.hadRecentInput ? 0 : entry.value), 0),
      };
    }

    return report;
  }

  /**
   * Compare before/after
   */
  compare(baseline = {}) {
    const current = this.getReport();

    return {
      fps: {
        baseline: baseline.fps || 60,
        current: current.fps,
        improvement: `${(((current.fps - (baseline.fps || 60)) / (baseline.fps || 60)) * 100).toFixed(1)}%`,
      },
      memory: {
        baseline: baseline.memory || 145,
        current: current.memory,
        reduction: `${(((baseline.memory || 145) - current.memory) / (baseline.memory || 145) * 100).toFixed(1)}%`,
      },
      paintTime: {
        baseline: baseline.paintTime || 45,
        current: current.paintTime,
        reduction: `${(((baseline.paintTime || 45) - current.paintTime) / (baseline.paintTime || 45) * 100).toFixed(1)}%`,
      },
      layoutTime: {
        baseline: baseline.layoutTime || 35,
        current: current.layoutTime,
        reduction: `${(((baseline.layoutTime || 35) - current.layoutTime) / (baseline.layoutTime || 35) * 100).toFixed(1)}%`,
      },
    };
  }

  /**
   * Export metrics as JSON
   */
  export() {
    return JSON.stringify(this.getFullReport(), null, 2);
  }
}

// Export for use
export default PerformanceMonitor;

// Auto-start if in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const monitor = new PerformanceMonitor({ logPerformance: true });
  monitor.start();
  window.__PERF_MONITOR__ = monitor;
}
