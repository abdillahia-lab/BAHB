/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NUMBER COUNTER COMPONENT                                                 ║
 * ║  Smooth animated counter with easing and formatting                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Easing function - ease out cubic
 */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Easing function - ease out expo
 */
const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/**
 * Easing function - ease in out quad
 */
const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const easingFunctions = {
  linear: (t) => t,
  easeOutCubic,
  easeOutExpo,
  easeInOutQuad,
};

/**
 * NumberCounter Component
 * Animates counting from start value to end value with customizable formatting
 *
 * @param {number} end - Target number
 * @param {number} start - Starting number (default: 0)
 * @param {number} duration - Animation duration in ms (default: 2000)
 * @param {string} easing - Easing function name (default: 'easeOutExpo')
 * @param {string} suffix - Text to append after number (default: '')
 * @param {string} prefix - Text to prepend before number (default: '')
 * @param {number} decimals - Number of decimal places (default: 0)
 * @param {boolean} useCommas - Add thousand separators (default: true)
 * @param {boolean} trigger - Start animation when true (default: true)
 * @param {function} onComplete - Callback when animation completes
 * @param {string} className - Additional CSS classes
 */
const NumberCounter = ({
  end,
  start = 0,
  duration = 2000,
  easing = 'easeOutExpo',
  suffix = '',
  prefix = '',
  decimals = 0,
  useCommas = true,
  trigger = true,
  onComplete,
  className = '',
  delay = 0,
}) => {
  const [count, setCount] = useState(start);
  const frameRef = useRef();
  const startTimeRef = useRef(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (!trigger) {
      setCount(start);
      hasCompletedRef.current = false;
      return;
    }

    // Reset on retrigger
    hasCompletedRef.current = false;

    const startAnimation = () => {
      const easingFn = easingFunctions[easing] || easingFunctions.easeOutExpo;

      const animate = (currentTime) => {
        if (!startTimeRef.current) {
          startTimeRef.current = currentTime;
        }

        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);

        const currentCount = start + (end - start) * easedProgress;
        setCount(currentCount);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setCount(end);
          if (onComplete && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onComplete();
          }
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    };

    // Start with delay if specified
    const timeout = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
      startTimeRef.current = null;
    };
  }, [end, start, duration, easing, trigger, onComplete, delay]);

  /**
   * Format number with commas and decimals
   */
  const formatNumber = (num) => {
    const fixed = num.toFixed(decimals);

    if (!useCommas) {
      return fixed;
    }

    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return parts.join('.');
  };

  return (
    <span className={`counter ${className}`}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
};

NumberCounter.propTypes = {
  end: PropTypes.number.isRequired,
  start: PropTypes.number,
  duration: PropTypes.number,
  easing: PropTypes.oneOf(['linear', 'easeOutCubic', 'easeOutExpo', 'easeInOutQuad']),
  suffix: PropTypes.string,
  prefix: PropTypes.string,
  decimals: PropTypes.number,
  useCommas: PropTypes.bool,
  trigger: PropTypes.bool,
  onComplete: PropTypes.func,
  className: PropTypes.string,
  delay: PropTypes.number,
};

export default NumberCounter;


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USAGE HOOK - Intersection Observer Trigger
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * useCounterOnView Hook
 * Triggers counter animation when element comes into view
 *
 * @param {number} threshold - Intersection threshold (default: 0.5)
 * @returns {[ref, hasTriggered]} - [Ref to attach to element, animation trigger state]
 */
export function useCounterOnView(threshold = 0.5) {
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, hasTriggered]);

  return [elementRef, hasTriggered];
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRESET COUNTER COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * PercentageCounter - Pre-configured for percentages
 */
export const PercentageCounter = ({ value, ...props }) => (
  <NumberCounter
    end={value}
    suffix="%"
    decimals={0}
    {...props}
  />
);

PercentageCounter.propTypes = {
  value: PropTypes.number.isRequired,
};

/**
 * CurrencyCounter - Pre-configured for currency
 */
export const CurrencyCounter = ({ value, currency = '$', ...props }) => (
  <NumberCounter
    end={value}
    prefix={currency}
    decimals={2}
    useCommas={true}
    {...props}
  />
);

CurrencyCounter.propTypes = {
  value: PropTypes.number.isRequired,
  currency: PropTypes.string,
};

/**
 * LargeNumberCounter - Pre-configured for large numbers with K/M/B suffixes
 */
export const LargeNumberCounter = ({ value, ...props }) => {
  let displayValue = value;
  let suffix = '';

  if (value >= 1000000000) {
    displayValue = value / 1000000000;
    suffix = 'B';
  } else if (value >= 1000000) {
    displayValue = value / 1000000;
    suffix = 'M';
  } else if (value >= 1000) {
    displayValue = value / 1000;
    suffix = 'K';
  }

  return (
    <NumberCounter
      end={displayValue}
      suffix={suffix}
      decimals={displayValue < 10 && suffix ? 1 : 0}
      useCommas={!suffix}
      {...props}
    />
  );
};

LargeNumberCounter.propTypes = {
  value: PropTypes.number.isRequired,
};
