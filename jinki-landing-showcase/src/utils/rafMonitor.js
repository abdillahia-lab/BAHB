/**
 * TEAM OPT-3: RAF Performance Monitor
 * Tracks RAF loop efficiency and detects performance bottlenecks
 */

class RAFMonitor {
  constructor() {
    this.frames = []
    this.isMonitoring = false
    this.rafCount = 0
    this.idleCount = 0
    this.startTime = 0
  }

  start() {
    this.isMonitoring = true
    this.startTime = performance.now()
    this.frames = []
    this.rafCount = 0
    this.idleCount = 0
  }

  recordFrame(velocity) {
    if (!this.isMonitoring) return

    this.rafCount++

    if (Math.abs(velocity) < 0.01) {
      this.idleCount++
    }

    const now = performance.now()
    this.frames.push({
      time: now,
      velocity,
      isIdle: Math.abs(velocity) < 0.01
    })

    // Keep only last 300 frames (5 seconds at 60fps)
    if (this.frames.length > 300) {
      this.frames.shift()
    }
  }

  getStats() {
    if (this.frames.length === 0) {
      return {
        avgFPS: 0,
        totalFrames: 0,
        idleFrames: 0,
        idlePercentage: 0,
        cpuSavings: 0
      }
    }

    const duration = (performance.now() - this.startTime) / 1000
    const avgFPS = this.rafCount / duration

    const idlePercentage = (this.idleCount / this.rafCount) * 100

    // Calculate CPU savings (idle frames that would have run continuously)
    const cpuSavings = idlePercentage

    return {
      avgFPS: avgFPS.toFixed(1),
      totalFrames: this.rafCount,
      idleFrames: this.idleCount,
      idlePercentage: idlePercentage.toFixed(1),
      cpuSavings: cpuSavings.toFixed(1),
      duration: duration.toFixed(1)
    }
  }

  reset() {
    this.frames = []
    this.rafCount = 0
    this.idleCount = 0
    this.startTime = performance.now()
  }

  stop() {
    this.isMonitoring = false
  }
}

// Singleton instance
export const rafMonitor = new RAFMonitor()

// Auto-start in development
if (import.meta.env.DEV) {
  rafMonitor.start()

  // Log stats every 10 seconds
  setInterval(() => {
    const stats = rafMonitor.getStats()
    console.log('🎯 RAF Monitor Stats:', stats)
  }, 10000)
}
