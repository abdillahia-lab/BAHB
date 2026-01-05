/**
 * SOUNDSCAPE Audio Assets Specifications
 * Procedural audio asset definitions for Jinki Intelligence
 *
 * INNOVATION FEATURES:
 * - Procedural synthesis (no external files needed)
 * - Frequency-based design for cybersecurity theme
 * - Optimized for low bandwidth usage
 * - Spatial audio ready
 * - Performance-optimized lazy loading
 */

// ═══════════════════════════════════════════════════════════════
// FREQUENCY SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════
export const SOUND_SPECS = {
  // Ambient Soundscape Frequencies
  AMBIENT: {
    hero: {
      name: 'Cyber Ambience - Hero Section',
      baseFreq: 55, // Subsonic layer for immersion
      harmonics: [110, 165, 220], // Harmonic series
      duration: 8000, // 8 seconds loopable
      type: 'sine',
      attack: 2000,
      decay: 1000,
      sustain: 0.4,
      release: 2000,
      description: 'Deep drone foundation with subtle modulation'
    },
    features: {
      name: 'Processing Ambience - Features Section',
      baseFreq: 82, // E2 note
      harmonics: [164, 246, 328],
      duration: 6000,
      type: 'sine',
      attack: 1500,
      decay: 800,
      sustain: 0.35,
      release: 1500,
      description: 'Mid-range ambient layer for feature showcase'
    },
    showcase: {
      name: 'Data Flow Ambience - Showcase Section',
      baseFreq: 110, // A2 note
      harmonics: [220, 330, 440],
      duration: 5000,
      type: 'sine',
      attack: 1000,
      decay: 600,
      sustain: 0.3,
      release: 1000,
      description: 'Higher frequency for tech-forward feel'
    },
    footer: {
      name: 'Resonance - Footer Section',
      baseFreq: 73, // D#2 note
      harmonics: [146, 219, 292],
      duration: 7000,
      type: 'sine',
      attack: 1800,
      decay: 900,
      sustain: 0.25,
      release: 1800,
      description: 'Closing resonance for conclusion'
    }
  },

  // UI Sound Design
  UI: {
    hover: {
      name: 'Hover Tone',
      frequency: 880, // A5 note
      duration: 100,
      type: 'sine',
      attack: 10,
      decay: 80,
      sustain: 0,
      release: 10,
      description: 'Subtle high-frequency tone for hover feedback'
    },
    click: {
      name: 'Click Confirmation',
      frequency: 1320, // E6 note
      duration: 150,
      type: 'sine',
      attack: 20,
      decay: 100,
      sustain: 0,
      release: 30,
      description: 'Satisfying click confirmation sound'
    },
    transition: {
      name: 'Transition Sweep',
      startFreq: 440, // A4
      endFreq: 880, // A5
      duration: 300,
      type: 'sine',
      attack: 50,
      decay: 150,
      sustain: 0.2,
      release: 100,
      description: 'Frequency sweep for page transitions'
    },
    success: {
      name: 'Success Chime',
      frequencies: [659, 784, 988], // E5, G5, B5 (E Major triad)
      duration: 400,
      type: 'sine',
      attack: 50,
      decay: 200,
      sustain: 0.3,
      release: 150,
      description: 'Harmonic chord for success states'
    },
    error: {
      name: 'Error Alert',
      frequencies: [293.66, 349.23], // D4, F4 (minor interval)
      duration: 300,
      type: 'sine',
      attack: 20,
      decay: 150,
      sustain: 0.2,
      release: 130,
      description: 'Dissonant minor interval for alerts'
    }
  },

  // Spatial Audio Parameters
  SPATIAL: {
    panningRange: 2, // -2 to 2 (stereo width)
    maxDistance: 3000, // pixels
    refDistance: 1000, // reference distance for volume
    rolloffFactor: 1.5, // volume drop-off rate
    coneInnerAngle: 360,
    coneOuterAngle: 360,
    coneOuterGain: 0,
  },

  // Adaptive Volume Parameters
  ADAPTIVE: {
    minVolume: 0.05,
    maxVolume: 0.6,
    scrollSpeedFactor: 0.3, // how much scroll speed affects volume
    interactionSpeedFactor: 0.2, // how much interaction speed affects volume
    fadeTime: 500, // ms for smooth volume transitions
  },

  // Performance Configuration
  PERFORMANCE: {
    lazyLoadThreshold: 0.7, // load sounds when 70% visible
    maxConcurrentSounds: 8, // max simultaneous audio nodes
    cacheSize: 10, // number of pre-rendered buffers to cache
    offlineBufferSize: 44100 * 8, // pre-render 8 seconds at 44.1kHz
  }
}

// ═══════════════════════════════════════════════════════════════
// SOUND CATEGORIES
// ═══════════════════════════════════════════════════════════════
export const SOUND_CATEGORIES = {
  AMBIENT: 'ambient',
  UI: 'ui',
  SPATIAL: 'spatial',
  REACTIVE: 'reactive',
}

// ═══════════════════════════════════════════════════════════════
// SECTION-SPECIFIC AMBIENT MAPS
// ═══════════════════════════════════════════════════════════════
export const SECTION_SOUNDSCAPES = {
  'hero-section': 'AMBIENT.hero',
  'features-section': 'AMBIENT.features',
  'showcase-section': 'AMBIENT.showcase',
  'footer-section': 'AMBIENT.footer',
}

// ═══════════════════════════════════════════════════════════════
// AUDIO REACTIVE VISUALIZATION PARAMETERS
// ═══════════════════════════════════════════════════════════════
export const REACTIVE_CONFIG = {
  frequencyBands: 64, // number of frequency bands for visualization
  smoothing: 0.8, // smoothing factor for frequency analysis
  minDecibels: -100,
  maxDecibels: -10,
  fftSize: 2048, // FFT size for frequency analysis

  // Visualization ranges
  visualizationRange: {
    minFrequency: 20,
    maxFrequency: 20000,
    minAmplitude: 0,
    maxAmplitude: 255,
  },

  // Effect mappings
  effectMappings: {
    scale: { band: [0, 10], range: [1, 1.5] }, // low frequencies scale UI
    opacity: { band: [10, 30], range: [0.5, 1] }, // mid frequencies affect opacity
    rotation: { band: [30, 64], range: [-5, 5] }, // high frequencies cause rotation
    blur: { band: [20, 40], range: [0, 10] }, // blur effect from mid frequencies
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get sound specification by path
 * @param {string} path - Dot-notation path (e.g., 'AMBIENT.hero')
 * @returns {object} Sound specification
 */
export function getSoundSpec(path) {
  const parts = path.split('.')
  let spec = SOUND_SPECS
  for (const part of parts) {
    spec = spec[part]
    if (!spec) return null
  }
  return spec
}

/**
 * Get all ambient soundscapes
 * @returns {object} Map of section IDs to ambient specs
 */
export function getAllAmbientSpecs() {
  const specs = {}
  for (const [section, path] of Object.entries(SECTION_SOUNDSCAPES)) {
    specs[section] = getSoundSpec(path)
  }
  return specs
}

/**
 * Get UI sound specs
 * @returns {object} All UI sound specifications
 */
export function getUISoundSpecs() {
  return SOUND_SPECS.UI
}
