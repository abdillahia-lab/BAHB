import { useEffect, useRef } from 'react'
import './ScrollVideo.css'

/**
 * Scroll-Linked Video
 * Video playback scrubs based on scroll position
 */
export default function ScrollVideo({ videoSrc, poster, className = '' }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    const handleScroll = () => {
      const rect = container.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const containerHeight = rect.height

      // Calculate how much of the container has been scrolled through
      // 0 = top of container at bottom of viewport
      // 1 = bottom of container at top of viewport
      const scrollProgress = Math.max(
        0,
        Math.min(
          1,
          (windowHeight - rect.top) / (windowHeight + containerHeight)
        )
      )

      // Update video time based on scroll
      if (video.duration) {
        const targetTime = scrollProgress * video.duration

        // Only update if the difference is significant (avoid jitter)
        if (Math.abs(video.currentTime - targetTime) > 0.1) {
          video.currentTime = targetTime
        }
      }

      // Update CSS variable for other effects
      container.style.setProperty('--scroll-progress', scrollProgress)
    }

    // Ensure video metadata is loaded
    const handleLoadedMetadata = () => {
      handleScroll() // Initial position
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`scroll-video-container ${className}`}
      style={{ '--scroll-progress': 0 }}
    >
      <video
        ref={videoRef}
        className="scroll-video"
        preload="auto"
        muted
        playsInline
        poster={poster}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Optional overlay effects */}
      <div className="scroll-video-overlay" />

      {/* Progress indicator */}
      <div className="scroll-video-progress">
        <div className="scroll-video-progress-bar" />
      </div>
    </div>
  )
}
