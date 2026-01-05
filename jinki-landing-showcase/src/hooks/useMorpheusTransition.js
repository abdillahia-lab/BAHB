/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MORPHEUS TRANSITION HOOKS
 * Reusable React hooks for page transitions
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  ViewTransition,
  ScrollMorph,
  MorphingEasings,
  RealityDistortionScroll,
  PortalTransition,
  GlassShatterEffect,
  AsciiToRenderedTransition,
} from '@/utils/advancedTransitions';

/**
 * useMorphTransition: Execute morphing transitions
 * @param {Object} options - Transition options
 * @returns {Object} - { execute, isTransitioning }
 */
export function useMorphTransition(options = {}) {
  const {
    duration = 600,
    easing = MorphingEasings.liquidMorph,
    name = 'default-transition',
  } = options;

  const [isTransitioning, setIsTransitioning] = useState(false);

  const execute = useCallback(async (callback) => {
    setIsTransitioning(true);
    try {
      await ViewTransition.execute(callback, {
        duration,
        easing,
        name,
      });
    } finally {
      setIsTransitioning(false);
    }
  }, [duration, easing, name]);

  return { execute, isTransitioning };
}

/**
 * useScrollMorphing: Register element for scroll-triggered morphing
 * @param {Object} morphConfig - Morphing configuration
 * @returns {Object} - { ref, unregister }
 */
export function useScrollMorphing(morphConfig = {}) {
  const ref = useRef(null);
  const unregisterRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    unregisterRef.current = ScrollMorph.register(ref.current, {
      threshold: 0.3,
      fromState: { opacity: '0', transform: 'translateY(40px)' },
      toState: { opacity: '1', transform: 'translateY(0px)' },
      duration: 800,
      easing: MorphingEasings.liquidMorph,
      ...morphConfig,
    });

    return () => {
      if (unregisterRef.current) {
        unregisterRef.current();
      }
      ScrollMorph.cleanup();
    };
  }, [morphConfig]);

  return { ref };
}

/**
 * usePortalTransition: Portal-style section transitions
 * @param {Object} options - Portal configuration
 * @returns {Object} - { applyPortal, isAnimating }
 */
export function usePortalTransition(options = {}) {
  const {
    duration = 800,
    easing = MorphingEasings.portalWarp,
    blurIntensity = 8,
  } = options;

  const portalRef = useRef(new PortalTransition({
    duration,
    easing,
    blurIntensity,
  }));

  const [isAnimating, setIsAnimating] = useState(false);

  const applyPortal = useCallback(async (element, direction = 'forward') => {
    setIsAnimating(true);
    try {
      await portalRef.current.applyPortal(element, direction);
    } finally {
      setIsAnimating(false);
    }
  }, []);

  return { applyPortal, isAnimating };
}

/**
 * useGlassShatterEffect: Glass shattering and reformation
 * @param {Object} options - Shatter configuration
 * @returns {Object} - { shatter, isAnimating }
 */
export function useGlassShatterEffect(options = {}) {
  const {
    duration = 800,
    fragmentCount = 12,
  } = options;

  const effectRef = useRef(new GlassShatterEffect({
    duration,
    fragmentCount,
  }));

  const [isAnimating, setIsAnimating] = useState(false);

  const shatter = useCallback(async (element) => {
    setIsAnimating(true);
    try {
      await effectRef.current.shatter(element);
    } finally {
      setIsAnimating(false);
    }
  }, []);

  return { shatter, isAnimating };
}

/**
 * useAsciiToRendered: ASCII art to rendered image transformation
 * @param {Object} options - Transformation configuration
 * @returns {Object} - { transform, isAnimating }
 */
export function useAsciiToRendered(options = {}) {
  const { duration = 1200 } = options;

  const transitionRef = useRef(new AsciiToRenderedTransition({ duration }));
  const [isAnimating, setIsAnimating] = useState(false);

  const transform = useCallback(async (asciiElement, imageElement) => {
    setIsAnimating(true);
    try {
      await transitionRef.current.transform(asciiElement, imageElement, { duration });
    } finally {
      setIsAnimating(false);
    }
  }, [duration]);

  return { transform, isAnimating };
}

/**
 * useRealityDistortionScroll: Scroll-based reality distortion
 * @param {Object} options - Distortion configuration
 * @returns {Object} - { disable, enable, isEnabled }
 */
export function useRealityDistortionScroll(options = {}) {
  const { intensity = 0.5, autoStart = false } = options;

  const distortionRef = useRef(new RealityDistortionScroll({ intensity }));
  const cleanupRef = useRef(null);
  const [isEnabled, setIsEnabled] = useState(autoStart);

  useEffect(() => {
    if (autoStart) {
      cleanupRef.current = distortionRef.current.init();
      setIsEnabled(true);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [autoStart]);

  const enable = useCallback(() => {
    if (!isEnabled) {
      cleanupRef.current = distortionRef.current.init();
      setIsEnabled(true);
    }
  }, [isEnabled]);

  const disable = useCallback(() => {
    if (isEnabled) {
      distortionRef.current.disable();
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      setIsEnabled(false);
    }
  }, [isEnabled]);

  return { enable, disable, isEnabled };
}

/**
 * usePageTransition: Complete page transition with state management
 * @param {string} transitionType - Type of transition
 * @param {Object} options - Configuration options
 * @returns {Object} - { transitionTo, isTransitioning }
 */
export function usePageTransition(transitionType = 'liquid', options = {}) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionTo = useCallback(async (callback) => {
    setIsTransitioning(true);
    try {
      const easing = MorphingEasings[`${transitionType}Morph`] || MorphingEasings.liquidMorph;

      await ViewTransition.execute(callback, {
        duration: options.duration || 600,
        easing,
        name: `${transitionType}-transition`,
      });
    } finally {
      setIsTransitioning(false);
    }
  }, [transitionType, options]);

  return { transitionTo, isTransitioning };
}

/**
 * useElementMorph: Morph between two elements
 * @param {Object} options - Morphing options
 * @returns {Object} - { morphTo, isMorphing }
 */
export function useElementMorph(options = {}) {
  const {
    duration = 600,
    easing = MorphingEasings.liquidMorph,
  } = options;

  const [isMorphing, setIsMorphing] = useState(false);

  const morphTo = useCallback(async (fromElement, toElement) => {
    setIsMorphing(true);
    try {
      await ViewTransition.morph(fromElement, toElement, {
        duration,
        easing,
      });
    } finally {
      setIsMorphing(false);
    }
  }, [duration, easing]);

  return { morphTo, isMorphing };
}

/**
 * useTransitionListener: Listen for transition events
 * @param {Function} callback - Called when transition occurs
 */
export function useTransitionListener(callback) {
  useEffect(() => {
    const handleTransitionStart = () => {
      callback({ type: 'start' });
    };

    const handleTransitionEnd = () => {
      callback({ type: 'end' });
    };

    // Listen to View Transitions API events if available
    if ('startViewTransition' in document) {
      document.addEventListener('transitionstart', handleTransitionStart);
      document.addEventListener('transitionend', handleTransitionEnd);

      return () => {
        document.removeEventListener('transitionstart', handleTransitionStart);
        document.removeEventListener('transitionend', handleTransitionEnd);
      };
    }
  }, [callback]);
}

/**
 * useMorphingNavigation: Smooth navigation with morphing
 * @param {Object} options - Navigation options
 * @returns {Object} - { navigateTo, isNavigating }
 */
export function useMorphingNavigation(options = {}) {
  const {
    transitionType = 'liquid',
    duration = 600,
  } = options;

  const [isNavigating, setIsNavigating] = useState(false);
  const easing = MorphingEasings[`${transitionType}Morph`] || MorphingEasings.liquidMorph;

  const navigateTo = useCallback(async (path) => {
    setIsNavigating(true);
    try {
      await ViewTransition.execute(() => {
        window.location.href = path;
      }, {
        duration,
        easing,
      });
    } catch (error) {
      console.error('Navigation transition failed:', error);
      window.location.href = path;
    }
  }, [easing, duration]);

  return { navigateTo, isNavigating };
}

/**
 * useTransitionGroup: Manage multiple element transitions
 * @param {Array} elements - Array of element refs to transition
 * @returns {Object} - { transitionAll, isTransitioning }
 */
export function useTransitionGroup(elements = []) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionAll = useCallback(async (callback, options = {}) => {
    if (!elements.length) return;

    setIsTransitioning(true);
    try {
      const easing = options.easing || MorphingEasings.liquidMorph;

      await ViewTransition.execute(callback, {
        duration: options.duration || 600,
        easing,
      });
    } finally {
      setIsTransitioning(false);
    }
  }, [elements.length]);

  return { transitionAll, isTransitioning };
}

export default {
  useMorphTransition,
  useScrollMorphing,
  usePortalTransition,
  useGlassShatterEffect,
  useAsciiToRendered,
  useRealityDistortionScroll,
  usePageTransition,
  useElementMorph,
  useTransitionListener,
  useMorphingNavigation,
  useTransitionGroup,
};
