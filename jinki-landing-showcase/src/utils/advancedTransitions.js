/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MORPHEUS: ADVANCED PAGE TRANSITIONS & STATE MORPHING ENGINE
 * Reality-Bending Transitions for Jinki Intelligence
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * CUSTOM EASING FUNCTIONS FOR MORPHING EFFECTS
 * Each easing function creates different morphing behaviors
 */
export const MorphingEasings = {
  // Smooth liquid morphing - like flowing water between states
  liquidMorph: (t) => {
    const a = 0.25;
    return t < a
      ? Math.pow(t / a, 2.5) * a
      : 1 - Math.pow((1 - t) / (1 - a), 2.5) * (1 - a);
  },

  // Elastic bounce effect - reality distortion on impact
  elasticMorph: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  // Portal effect - smooth acceleration through wormhole
  portalWarp: (t) => {
    const a = 0.1;
    const b = 0.2;
    if (t < a) return Math.pow(t / a, 1.5) * a;
    if (t > 1 - b) return 1 - Math.pow((1 - t) / b, 1.5) * b;
    return (t - a) / (1 - a - b);
  },

  // Glass shattering/reforming effect - sharp transitions with smoothing
  glassMorph: (t) => {
    const fragments = 5;
    const cycle = Math.floor(t * fragments) / fragments;
    const progress = (t * fragments) % 1;
    return cycle + Math.pow(progress, 0.3) / fragments;
  },

  // Quantum superposition - oscillating between states
  quantumPhase: (t) => {
    return 0.5 + 0.5 * Math.sin((t - 0.5) * Math.PI * 2);
  },

  // Dimensional fold - 3D rotation effect
  dimensionalFold: (t) => {
    return Math.sin(t * Math.PI);
  },

  // Chrono distortion - time acceleration/deceleration
  chronoDistort: (t) => {
    const a = 0.2;
    const b = 0.8;
    if (t < a) return Math.pow(t / a, 0.5) * a;
    if (t > b) return b + Math.pow((t - b) / (1 - b), 2) * (1 - b);
    return (t - a) / (b - a);
  },
};

/**
 * KEYFRAME DEFINITIONS
 * Pre-configured keyframe sets for various morph effects
 */
export const MorphKeyframes = {
  // Liquid morphing effect
  liquidMorph: {
    '0%': {
      opacity: 1,
      transform: 'scale(1) translate(0, 0)',
      filter: 'blur(0px)',
    },
    '50%': {
      opacity: 0.95,
      filter: 'blur(4px)',
    },
    '100%': {
      opacity: 1,
      transform: 'scale(1.02) translate(0, 0)',
      filter: 'blur(0px)',
    },
  },

  // Portal distortion effect
  portalDistort: {
    '0%': {
      opacity: 1,
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
    },
    '40%': {
      opacity: 0.8,
      transform: 'perspective(1000px) rotateX(25deg) rotateY(45deg) scale(0.98)',
      clipPath: 'polygon(5% 5%, 95% 0%, 100% 95%, 5% 100%)',
    },
    '100%': {
      opacity: 1,
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
    },
  },

  // Glass shattering effect
  glassMorph: {
    '0%': {
      opacity: 1,
      transform: 'scale(1)',
      filter: 'brightness(1)',
    },
    '30%': {
      opacity: 0.7,
      filter: 'brightness(1.2) blur(2px)',
    },
    '70%': {
      opacity: 0.7,
      filter: 'brightness(0.9) blur(1px)',
    },
    '100%': {
      opacity: 1,
      transform: 'scale(1)',
      filter: 'brightness(1)',
    },
  },

  // ASCII to rendered morphing
  asciiToRendered: {
    '0%': {
      opacity: 1,
      transform: 'scale(1) rotateX(0deg)',
      filter: 'contrast(1.2) saturate(0%)',
      textShadow: '0 0 20px rgba(0, 180, 216, 0.8)',
    },
    '50%': {
      opacity: 1,
      filter: 'contrast(1) saturate(50%)',
      textShadow: '0 0 40px rgba(0, 229, 255, 1)',
    },
    '100%': {
      opacity: 1,
      transform: 'scale(1) rotateX(0deg)',
      filter: 'contrast(1) saturate(100%)',
      textShadow: 'none',
    },
  },

  // Quantum superposition morphing
  quantumMorph: {
    '0%': {
      opacity: 0.5,
      transform: 'scaleX(0.8) scaleY(1.1)',
      filter: 'hue-rotate(0deg)',
    },
    '25%': {
      opacity: 0.7,
      transform: 'scaleX(1.1) scaleY(0.9)',
      filter: 'hue-rotate(90deg)',
    },
    '50%': {
      opacity: 0.5,
      transform: 'scaleX(0.9) scaleY(1.05)',
      filter: 'hue-rotate(180deg)',
    },
    '75%': {
      opacity: 0.7,
      transform: 'scaleX(1.05) scaleY(0.95)',
      filter: 'hue-rotate(270deg)',
    },
    '100%': {
      opacity: 1,
      transform: 'scale(1)',
      filter: 'hue-rotate(360deg)',
    },
  },

  // Reality distortion effect
  realityDistort: {
    '0%': {
      opacity: 1,
      transform: 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
      filter: 'brightness(1)',
    },
    '25%': {
      opacity: 0.9,
      transform: 'matrix3d(0.99, 0.05, 0, 0, -0.05, 0.99, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
      filter: 'brightness(1.1)',
    },
    '50%': {
      opacity: 0.8,
      transform: 'matrix3d(0.95, 0.1, 0, 0, -0.1, 0.95, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
      filter: 'brightness(0.9)',
    },
    '75%': {
      opacity: 0.9,
      transform: 'matrix3d(0.99, 0.05, 0, 0, -0.05, 0.99, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
      filter: 'brightness(1.05)',
    },
    '100%': {
      opacity: 1,
      transform: 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
      filter: 'brightness(1)',
    },
  },
};

/**
 * VIEW TRANSITIONS API HANDLER
 * Primary implementation with browser compatibility fallbacks
 */
export const ViewTransition = {
  /**
   * Execute transition with View Transitions API if available
   * Falls back to Framer Motion if necessary
   */
  async execute(callback, options = {}) {
    const {
      duration = 600,
      easing = MorphingEasings.liquidMorph,
      name = 'default-transition',
    } = options;

    // Check if View Transitions API is supported
    if ('startViewTransition' in document) {
      return new Promise((resolve) => {
        document.startViewTransition(() => {
          callback();
          setTimeout(resolve, duration);
        });
      });
    }

    // Fallback: Standard DOM update
    callback();
    return Promise.resolve();
  },

  /**
   * Cross-fade transition between elements
   */
  async crossfade(fromElement, toElement, options = {}) {
    const { duration = 400 } = options;

    if ('startViewTransition' in document) {
      return new Promise((resolve) => {
        document.startViewTransition(() => {
          fromElement.style.display = 'none';
          toElement.style.display = 'block';
          setTimeout(resolve, duration);
        });
      });
    }

    fromElement.style.opacity = '0';
    await new Promise((r) => setTimeout(r, duration / 2));
    fromElement.style.display = 'none';
    toElement.style.display = 'block';
    toElement.style.opacity = '0';
    toElement.offsetHeight; // Trigger reflow
    toElement.style.opacity = '1';

    return new Promise((r) => setTimeout(r, duration / 2));
  },

  /**
   * Morphing transition between two elements
   */
  async morph(fromElement, toElement, options = {}) {
    const {
      duration = 600,
      easing = MorphingEasings.liquidMorph,
      keyframes = MorphKeyframes.liquidMorph,
    } = options;

    if (!document.startViewTransition) {
      // Fallback implementation
      return this._morphFallback(
        fromElement,
        toElement,
        duration,
        easing,
        keyframes
      );
    }

    return new Promise((resolve) => {
      document.startViewTransition(() => {
        fromElement.style.opacity = '0';
        toElement.style.opacity = '1';

        if ('getAnimations' in Element.prototype) {
          toElement.getAnimations?.().forEach((animation) => {
            animation.cancel();
          });
        }

        setTimeout(resolve, duration);
      });
    });
  },

  /**
   * Fallback morph implementation using CSS animations
   */
  _morphFallback(fromElement, toElement, duration, easing, keyframes) {
    return new Promise((resolve) => {
      const animationName = `morph-${Date.now()}`;
      const style = document.createElement('style');
      const keyframesStr = Object.entries(keyframes)
        .map(([key, value]) => {
          const props = Object.entries(value)
            .map(([prop, val]) => `${prop}: ${val};`)
            .join(' ');
          return `${key} { ${props} }`;
        })
        .join('\n');

      style.textContent = `
        @keyframes ${animationName} {
          ${keyframesStr}
        }
      `;
      document.head.appendChild(style);

      toElement.style.animation = `${animationName} ${duration}ms ${easing.name || 'ease'} forwards`;

      setTimeout(() => {
        style.remove();
        resolve();
      }, duration);
    });
  },
};

/**
 * SCROLL-TRIGGERED MORPHING
 * Morph elements as they come into view
 */
export const ScrollMorph = {
  observers: new Map(),

  /**
   * Register element for scroll-based morphing
   */
  register(element, morphConfig = {}) {
    const {
      threshold = 0.3,
      fromState = {},
      toState = {},
      easing = MorphingEasings.liquidMorph,
      duration = 600,
    } = morphConfig;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.applyMorphing(
              element,
              toState,
              duration,
              easing
            );
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
    this.observers.set(element, observer);

    // Apply initial state
    Object.assign(element.style, fromState);

    return () => {
      observer.unobserve(element);
      this.observers.delete(element);
    };
  },

  /**
   * Apply morphing animation to element
   */
  applyMorphing(element, toState, duration, easing) {
    if ('startViewTransition' in document) {
      document.startViewTransition(() => {
        Object.assign(element.style, toState);
      });
    } else {
      Object.assign(element.style, toState);
    }
  },

  /**
   * Clean up all registered observers
   */
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  },
};

/**
 * SHARED ELEMENT TRANSITIONS
 * Animate elements between different DOM positions
 */
export const SharedElement = {
  /**
   * Prepare source element for shared element transition
   */
  markSource(element, id) {
    element.setAttribute('data-transition-source', id);
    element.style.viewTransitionName = id;
  },

  /**
   * Mark target element for shared element transition
   */
  markTarget(element, id) {
    element.setAttribute('data-transition-target', id);
    element.style.viewTransitionName = id;
  },

  /**
   * Animate from source to target position
   */
  async animate(sourceId, targetId, callback, options = {}) {
    const { duration = 600 } = options;

    if ('startViewTransition' in document) {
      return new Promise((resolve) => {
        document.startViewTransition(() => {
          callback();
          setTimeout(resolve, duration);
        });
      });
    }

    callback();
    return Promise.resolve();
  },
};

/**
 * PORTAL TRANSITION EFFECT
 * Reality-bending section transitions
 */
export class PortalTransition {
  constructor(options = {}) {
    this.duration = options.duration || 800;
    this.easing = options.easing || MorphingEasings.portalWarp;
    this.blurIntensity = options.blurIntensity || 8;
  }

  /**
   * Apply portal effect to transitioning element
   */
  async applyPortal(element, direction = 'forward') {
    const keyframes =
      direction === 'forward'
        ? this._generatePortalKeyframes('in')
        : this._generatePortalKeyframes('out');

    return new Promise((resolve) => {
      if ('startViewTransition' in document) {
        document.startViewTransition(() => {
          this._animatePortal(element, keyframes);
          setTimeout(resolve, this.duration);
        });
      } else {
        this._animatePortal(element, keyframes);
        setTimeout(resolve, this.duration);
      }
    });
  }

  _generatePortalKeyframes(direction) {
    if (direction === 'in') {
      return {
        '0%': {
          opacity: 0,
          transform: 'perspective(1200px) scale(0.3) rotateX(90deg)',
          filter: `blur(${this.blurIntensity}px)`,
        },
        '50%': {
          filter: `blur(${this.blurIntensity / 2}px)`,
        },
        '100%': {
          opacity: 1,
          transform: 'perspective(1200px) scale(1) rotateX(0deg)',
          filter: 'blur(0px)',
        },
      };
    }

    return {
      '0%': {
        opacity: 1,
        transform: 'perspective(1200px) scale(1) rotateX(0deg)',
        filter: 'blur(0px)',
      },
      '50%': {
        filter: `blur(${this.blurIntensity / 2}px)`,
      },
      '100%': {
        opacity: 0,
        transform: 'perspective(1200px) scale(0.3) rotateY(90deg)',
        filter: `blur(${this.blurIntensity}px)`,
      },
    };
  }

  _animatePortal(element, keyframes) {
    const animationName = `portal-${Date.now()}`;
    const style = document.createElement('style');
    const keyframesStr = Object.entries(keyframes)
      .map(([key, value]) => {
        const props = Object.entries(value)
          .map(([prop, val]) => `${prop}: ${val};`)
          .join(' ');
        return `${key} { ${props} }`;
      })
      .join('\n');

    style.textContent = `@keyframes ${animationName} { ${keyframesStr} }`;
    document.head.appendChild(style);

    element.style.animation = `${animationName} ${this.duration}ms ease-in-out forwards`;

    setTimeout(() => style.remove(), this.duration);
  }
}

/**
 * ASCII TO RENDERED TRANSITION
 * Transform ASCII art into rendered images
 */
export class AsciiToRenderedTransition {
  constructor(options = {}) {
    this.duration = options.duration || 1200;
    this.easing = options.easing || MorphingEasings.asciiToRendered;
  }

  /**
   * Transform ASCII element to rendered image
   */
  async transform(asciiElement, imageElement, options = {}) {
    const { duration = this.duration } = options;

    return new Promise((resolve) => {
      if ('startViewTransition' in document) {
        document.startViewTransition(() => {
          this._applyTransformation(asciiElement, imageElement, duration);
          setTimeout(resolve, duration);
        });
      } else {
        this._applyTransformation(asciiElement, imageElement, duration);
        setTimeout(resolve, duration);
      }
    });
  }

  _applyTransformation(asciiElement, imageElement, duration) {
    const animationName = `ascii-to-rendered-${Date.now()}`;
    const style = document.createElement('style');

    style.textContent = `
      @keyframes ${animationName} {
        0% {
          opacity: 1;
          transform: scale(1) rotateX(0deg);
          filter: contrast(1.2) saturate(0%) brightness(1.1);
          text-shadow: 0 0 20px rgba(0, 180, 216, 0.8);
        }
        40% {
          opacity: 1;
          filter: contrast(1.1) saturate(25%) brightness(1.05);
        }
        70% {
          opacity: 1;
          filter: contrast(1) saturate(75%) brightness(1);
        }
        100% {
          opacity: 0;
          transform: scale(1.05) rotateX(0deg);
          filter: contrast(1) saturate(100%) brightness(1);
          text-shadow: none;
        }
      }
    `;

    document.head.appendChild(style);

    asciiElement.style.animation = `${animationName} ${duration}ms ease-in-out forwards`;
    imageElement.style.animation = `${animationName} ${duration}ms ease-in-out forwards reverse`;
    imageElement.style.opacity = '0';
    imageElement.style.display = 'block';

    setTimeout(() => {
      style.remove();
      asciiElement.style.display = 'none';
      imageElement.style.display = 'block';
      imageElement.style.animation = 'none';
      imageElement.style.opacity = '1';
    }, duration);
  }
}

/**
 * GLASS SHATTERING EFFECT
 * Shatter and reform glass effect
 */
export class GlassShatterEffect {
  constructor(options = {}) {
    this.duration = options.duration || 800;
    this.fragmentCount = options.fragmentCount || 12;
  }

  /**
   * Apply glass shattering effect
   */
  async shatter(element, options = {}) {
    const { duration = this.duration } = options;

    return new Promise((resolve) => {
      if ('startViewTransition' in document) {
        document.startViewTransition(() => {
          this._applyShatter(element, duration);
          setTimeout(resolve, duration);
        });
      } else {
        this._applyShatter(element, duration);
        setTimeout(resolve, duration);
      }
    });
  }

  _applyShatter(element, duration) {
    const animationName = `glass-shatter-${Date.now()}`;
    const style = document.createElement('style');

    const keyframes = this._generateShatterKeyframes();
    const keyframesStr = Object.entries(keyframes)
      .map(([key, value]) => {
        const props = Object.entries(value)
          .map(([prop, val]) => `${prop}: ${val};`)
          .join(' ');
        return `${key} { ${props} }`;
      })
      .join('\n');

    style.textContent = `@keyframes ${animationName} { ${keyframesStr} }`;
    document.head.appendChild(style);

    element.style.animation = `${animationName} ${duration}ms ease-in-out forwards`;
    element.style.transformStyle = 'preserve-3d';

    setTimeout(() => {
      style.remove();
      element.style.animation = 'none';
    }, duration);
  }

  _generateShatterKeyframes() {
    return {
      '0%': {
        opacity: 1,
        transform: 'scale(1)',
        filter: 'brightness(1)',
      },
      '25%': {
        opacity: 0.8,
        transform: 'scale(1.02) rotateX(5deg)',
        filter: 'brightness(1.1) blur(1px)',
      },
      '50%': {
        opacity: 0.6,
        transform: 'scale(0.98) rotateX(-5deg) rotateY(5deg)',
        filter: 'brightness(0.9) blur(3px)',
      },
      '75%': {
        opacity: 0.8,
        transform: 'scale(1.01) rotateX(3deg) rotateY(-3deg)',
        filter: 'brightness(1.05) blur(2px)',
      },
      '100%': {
        opacity: 1,
        transform: 'scale(1)',
        filter: 'brightness(1)',
      },
    };
  }
}

/**
 * REALITY DISTORTION SCROLL EFFECT
 * Distort page on scroll
 */
export class RealityDistortionScroll {
  constructor(options = {}) {
    this.intensity = options.intensity || 1;
    this.enabled = true;
  }

  /**
   * Initialize scroll distortion listener
   */
  init() {
    let rafId = null;

    window.addEventListener('scroll', () => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const scrollProgress =
          window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight);
        this._applyDistortion(scrollProgress);
      });
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.documentElement.style.filter = '';
    };
  }

  _applyDistortion(progress) {
    if (!this.enabled) return;

    const maxDistort = Math.sin(progress * Math.PI * 2) * 5 * this.intensity;
    const skew = Math.sin(progress * Math.PI) * 2 * this.intensity;

    document.documentElement.style.filter = `
      brightness(${1 - 0.05 * Math.abs(Math.sin(progress * Math.PI))})
      contrast(${1 + 0.1 * Math.abs(Math.sin(progress * Math.PI * 2))})
    `;

    document.documentElement.style.transform = `
      perspective(1200px)
      skewY(${skew}deg)
      rotateX(${maxDistort * 0.1}deg)
    `;
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

export default {
  MorphingEasings,
  MorphKeyframes,
  ViewTransition,
  ScrollMorph,
  SharedElement,
  PortalTransition,
  AsciiToRenderedTransition,
  GlassShatterEffect,
  RealityDistortionScroll,
};
