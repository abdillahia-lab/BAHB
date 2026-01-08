/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  TEXT ANIMATION HOOKS                                                     ║
 * ║  Premium text effects: scramble, character reveal, typing                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef } from 'react';

/**
 * TEXT SCRAMBLE EFFECT
 * Animates text with random characters before revealing the final text
 *
 * @param {string} text - Final text to display
 * @param {number} duration - Animation duration in ms (default: 2000)
 * @param {number} revealDelay - Delay before starting reveal in ms (default: 0)
 * @returns {string} - Animated text state
 */
export function useTextScramble(text, duration = 2000, revealDelay = 0) {
  const [displayText, setDisplayText] = useState('');
  const frameRef = useRef(0);

  useEffect(() => {
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    const textLength = text.length;
    let frame = 0;
    const totalFrames = duration / 16; // ~60fps

    const timeout = setTimeout(() => {
      const animate = () => {
        frame++;
        const progress = frame / totalFrames;

        const output = text
          .split('')
          .map((char, index) => {
            const revealProgress = (progress * textLength - index) / textLength;

            if (revealProgress >= 1) {
              return char;
            }

            if (revealProgress > 0) {
              // Character is being revealed, show random chars
              if (Math.random() < revealProgress) {
                return char;
              }
            }

            // Show random character
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');

        setDisplayText(output);

        if (frame < totalFrames) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayText(text);
        }
      };

      animate();
    }, revealDelay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
    };
  }, [text, duration, revealDelay]);

  return displayText;
}


/**
 * CHARACTER REVEAL ANIMATION
 * Splits text into individual characters for staggered reveal
 * Returns array of characters with animation delays
 *
 * @param {string} text - Text to animate
 * @param {number} staggerDelay - Delay between each character in ms (default: 50)
 * @param {boolean} trigger - Animation trigger (default: true)
 * @returns {Array} - Array of character objects with delay
 */
export function useCharacterReveal(text, staggerDelay = 50, trigger = true) {
  const [chars, setChars] = useState([]);

  useEffect(() => {
    if (!trigger) {
      setChars([]);
      return;
    }

    const characters = text.split('').map((char, index) => ({
      char: char === ' ' ? '\u00A0' : char, // Non-breaking space
      delay: index * staggerDelay,
      key: `char-${index}`,
    }));

    setChars(characters);
  }, [text, staggerDelay, trigger]);

  return chars;
}


/**
 * TYPING EFFECT
 * Simulates typing animation
 *
 * @param {string} text - Text to type
 * @param {number} speed - Typing speed in ms per character (default: 100)
 * @param {number} startDelay - Delay before typing starts (default: 0)
 * @returns {string} - Current typed text
 */
export function useTypingEffect(text, speed = 100, startDelay = 0) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex === 0 && startDelay > 0) {
      const timeout = setTimeout(() => {
        setCurrentIndex(1);
      }, startDelay);
      return () => clearTimeout(timeout);
    }

    if (currentIndex > 0 && currentIndex <= text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed, startDelay]);

  return displayText;
}


/**
 * WORD REVEAL ANIMATION
 * Reveals text word by word with fade and slide
 *
 * @param {string} text - Text to animate
 * @param {number} wordDelay - Delay between words in ms (default: 200)
 * @param {boolean} trigger - Animation trigger (default: true)
 * @returns {Array} - Array of word objects with animation state
 */
export function useWordReveal(text, wordDelay = 200, trigger = true) {
  const [words, setWords] = useState([]);

  useEffect(() => {
    if (!trigger) {
      setWords([]);
      return;
    }

    const wordArray = text.split(' ').map((word, index) => ({
      word,
      delay: index * wordDelay,
      key: `word-${index}`,
      visible: false,
    }));

    setWords(wordArray);

    // Trigger visibility with delays
    wordArray.forEach((wordObj, index) => {
      setTimeout(() => {
        setWords(prev =>
          prev.map((w, i) =>
            i === index ? { ...w, visible: true } : w
          )
        );
      }, wordObj.delay);
    });
  }, [text, wordDelay, trigger]);

  return words;
}


/**
 * SPLIT TEXT UTILITY
 * Utility hook to split text and wrap each character in a span for CSS animations
 *
 * @param {string} text - Text to split
 * @param {string} className - CSS class for each character (default: 'char-reveal')
 * @returns {JSX.Element[]} - Array of span elements
 */
export function useSplitText(text, className = 'char-reveal') {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    const chars = text.split('').map((char, index) => {
      const displayChar = char === ' ' ? '\u00A0' : char;
      return {
        char: displayChar,
        index,
        className,
      };
    });

    setElements(chars);
  }, [text, className]);

  return elements;
}


/**
 * LETTER SPACING ANIMATION
 * Animates letter spacing on text
 *
 * @param {number} startSpacing - Starting letter spacing in em (default: 0)
 * @param {number} endSpacing - Ending letter spacing in em (default: 0.1)
 * @param {number} duration - Animation duration in ms (default: 1000)
 * @param {boolean} trigger - Animation trigger (default: true)
 * @returns {number} - Current letter spacing value
 */
export function useLetterSpacingAnimation(startSpacing = 0, endSpacing = 0.1, duration = 1000, trigger = true) {
  const [spacing, setSpacing] = useState(startSpacing);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!trigger) {
      setSpacing(startSpacing);
      return;
    }

    const startTime = Date.now();
    const range = endSpacing - startSpacing;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentSpacing = startSpacing + (range * eased);

      setSpacing(currentSpacing);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => cancelAnimationFrame(frameRef.current);
  }, [startSpacing, endSpacing, duration, trigger]);

  return spacing;
}


/**
 * TEXT GRADIENT POSITION ANIMATION
 * Animates gradient background position for gradient text effects
 *
 * @param {number} speed - Animation speed multiplier (default: 1)
 * @returns {number} - Current background position percentage
 */
export function useTextGradientAnimation(speed = 1) {
  const [position, setPosition] = useState(0);
  const frameRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newPosition = (elapsed * speed * 0.05) % 200;
      setPosition(newPosition);
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frameRef.current);
  }, [speed]);

  return position;
}
