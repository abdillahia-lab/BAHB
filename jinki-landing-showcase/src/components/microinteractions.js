/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  MICRO-INTERACTION UTILITIES                                              ║
 * ║  JavaScript helpers for advanced micro-interactions                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3D CARD TILT EFFECT
 * Card tilts toward cursor position with 3D transform
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function init3DCardTilt(cardElement, options = {}) {
  const {
    maxTilt = 15,        // Maximum tilt angle in degrees
    perspective = 1000,  // Perspective value
    scale = 1.05,        // Scale on hover
    speed = 400,         // Transition speed in ms
    glare = true,        // Enable glare effect
  } = options;

  if (!cardElement) return;

  const content = cardElement.querySelector('.card-3d-content') || cardElement;
  const glareElement = cardElement.querySelector('.card-3d-shine');

  cardElement.style.perspective = `${perspective}px`;

  const handleMouseMove = (e) => {
    const rect = cardElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation angles
    const rotateX = ((y - centerY) / centerY) * maxTilt;
    const rotateY = ((centerX - x) / centerX) * maxTilt;

    // Apply transform
    content.style.transform = `
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(${scale})
    `;

    // Update glare position
    if (glare && glareElement) {
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      glareElement.style.background = `
        radial-gradient(
          circle at ${percentX}% ${percentY}%,
          rgba(255, 255, 255, 0.2) 0%,
          rgba(255, 255, 255, 0.05) 40%,
          transparent 60%
        )
      `;
    }
  };

  const handleMouseLeave = () => {
    content.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    if (glare && glareElement) {
      glareElement.style.background = '';
    }
  };

  cardElement.addEventListener('mousemove', handleMouseMove);
  cardElement.addEventListener('mouseleave', handleMouseLeave);

  // Cleanup function
  return () => {
    cardElement.removeEventListener('mousemove', handleMouseMove);
    cardElement.removeEventListener('mouseleave', handleMouseLeave);
  };
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAGNETIC BUTTON EFFECT
 * Button follows cursor when nearby
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function initMagneticButton(buttonElement, options = {}) {
  const {
    strength = 20,      // Magnetic pull strength in pixels
    distance = 100,     // Activation distance in pixels
  } = options;

  if (!buttonElement) return;

  const handleMouseMove = (e) => {
    const rect = buttonElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const distanceFromCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distanceFromCenter < distance) {
      const pull = 1 - (distanceFromCenter / distance);
      const x = (deltaX / distance) * strength * pull;
      const y = (deltaY / distance) * strength * pull;

      buttonElement.style.transform = `translate(${x}px, ${y}px)`;
    } else {
      buttonElement.style.transform = 'translate(0px, 0px)';
    }
  };

  const handleMouseLeave = () => {
    buttonElement.style.transform = 'translate(0px, 0px)';
  };

  document.addEventListener('mousemove', handleMouseMove);
  buttonElement.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    buttonElement.removeEventListener('mouseleave', handleMouseLeave);
  };
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CURSOR TRAIL EFFECT
 * Creates trailing dots that follow cursor
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function initCursorTrail(options = {}) {
  const {
    color = '#06b6d4',
    size = 8,
    lifetime = 500,
    interval = 50,
  } = options;

  let lastTrailTime = 0;

  const createTrailDot = (x, y) => {
    const dot = document.createElement('div');
    dot.className = 'cursor-trail cursor-trail--active';
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.background = color;

    document.body.appendChild(dot);

    setTimeout(() => {
      dot.remove();
    }, lifetime);
  };

  const handleMouseMove = (e) => {
    const now = Date.now();
    if (now - lastTrailTime > interval) {
      createTrailDot(e.clientX, e.clientY);
      lastTrailTime = now;
    }
  };

  document.addEventListener('mousemove', handleMouseMove);

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
  };
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PARALLAX MOUSE MOVEMENT
 * Elements move at different speeds based on cursor position
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function initParallaxMouse(containerElement, options = {}) {
  const {
    selector = '[data-parallax-speed]',
    defaultSpeed = 5,
  } = options;

  if (!containerElement) return;

  const elements = containerElement.querySelectorAll(selector);

  const handleMouseMove = (e) => {
    const rect = containerElement.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

    elements.forEach(el => {
      const speed = parseFloat(el.dataset.parallaxSpeed) || defaultSpeed;
      const moveX = x * speed;
      const moveY = y * speed;
      el.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  };

  const handleMouseLeave = () => {
    elements.forEach(el => {
      el.style.transform = 'translate(0px, 0px)';
    });
  };

  containerElement.addEventListener('mousemove', handleMouseMove);
  containerElement.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    containerElement.removeEventListener('mousemove', handleMouseMove);
    containerElement.removeEventListener('mouseleave', handleMouseLeave);
  };
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCROLL PROGRESS INDICATOR
 * Updates progress bar based on scroll position
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function initScrollProgress(progressElement) {
  if (!progressElement) return;

  const updateProgress = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;

    progressElement.style.transform = `scaleX(${progress / 100})`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress(); // Initial update

  return () => {
    window.removeEventListener('scroll', updateProgress);
  };
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
 * Triggers animations when elements enter viewport
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function initScrollAnimations(options = {}) {
  const {
    selector = '.animate-on-scroll',
    threshold = 0.1,
    rootMargin = '0px',
    once = true,
  } = options;

  const elements = document.querySelectorAll(selector);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          entry.target.classList.remove('is-visible');
        }
      });
    },
    { threshold, rootMargin }
  );

  elements.forEach(el => observer.observe(el));

  return () => {
    elements.forEach(el => observer.unobserve(el));
  };
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMOOTH SCROLL TO ANCHOR
 * Smooth scrolling with easing
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function initSmoothScroll(options = {}) {
  const {
    selector = 'a[href^="#"]',
    offset = 0,
    duration = 800,
  } = options;

  const links = document.querySelectorAll(selector);

  const easeInOutCubic = (t) => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const scrollToTarget = (targetY) => {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    const scroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        requestAnimationFrame(scroll);
      }
    };

    requestAnimationFrame(scroll);
  };

  const handleClick = (e) => {
    const href = e.currentTarget.getAttribute('href');
    if (!href || href === '#') return;

    const targetElement = document.querySelector(href);
    if (!targetElement) return;

    e.preventDefault();

    const targetY = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
    scrollToTarget(targetY);
  };

  links.forEach(link => {
    link.addEventListener('click', handleClick);
  });

  return () => {
    links.forEach(link => {
      link.removeEventListener('click', handleClick);
    });
  };
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INITIALIZE ALL MICRO-INTERACTIONS
 * Convenience function to initialize all effects
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function initAllMicroInteractions(options = {}) {
  const cleanups = [];

  // 3D Cards
  document.querySelectorAll('.card-3d').forEach(card => {
    cleanups.push(init3DCardTilt(card, options.card3D));
  });

  // Magnetic Buttons
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    cleanups.push(initMagneticButton(btn, options.magnetic));
  });

  // Scroll Progress
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    cleanups.push(initScrollProgress(progressBar));
  }

  // Scroll Animations
  cleanups.push(initScrollAnimations(options.scrollAnimations));

  // Smooth Scroll
  cleanups.push(initSmoothScroll(options.smoothScroll));

  // Parallax Mouse (on hero section)
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    cleanups.push(initParallaxMouse(heroSection, options.parallax));
  }

  // Cleanup function
  return () => {
    cleanups.forEach(cleanup => {
      if (typeof cleanup === 'function') cleanup();
    });
  };
}
