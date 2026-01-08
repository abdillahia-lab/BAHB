/**
 * MagneticButton Component
 * A reusable button component with magnetic hover effect
 * Can be used as a wrapper or standalone button
 */

import { useMagneticButton } from '../hooks/useMagneticButton'

export function MagneticButton({
  children,
  className = '',
  strength = 0.3,
  radius = 100,
  ease = 0.15,
  disabled = false,
  as = 'button',
  ...props
}) {
  const magneticRef = useMagneticButton({ strength, radius, ease, disabled })
  const Component = as

  return (
    <Component
      ref={magneticRef}
      className={`magnetic-button ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * MagneticLink - Magnetic effect for links
 */
export function MagneticLink({ children, href, className = '', ...magneticProps }) {
  return (
    <MagneticButton
      as="a"
      href={href}
      className={className}
      {...magneticProps}
    >
      {children}
    </MagneticButton>
  )
}

/**
 * MagneticDiv - Magnetic effect for any div/container
 */
export function MagneticDiv({ children, className = '', ...magneticProps }) {
  return (
    <MagneticButton
      as="div"
      className={className}
      {...magneticProps}
    >
      {children}
    </MagneticButton>
  )
}
