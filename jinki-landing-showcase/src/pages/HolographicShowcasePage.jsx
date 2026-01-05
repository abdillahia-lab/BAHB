import { motion } from 'framer-motion'
import {
  HolographicText,
  HolographicCard,
  HolographicBeacon,
  GlitchText,
  ScanlineOverlay,
  VHSNoise,
  HolographicContainer,
  HolographicShowcase,
} from '../components/HolographicEffects'
import './HolographicShowcasePage.css'

const ease = [0.25, 0.1, 0.25, 1]

export default function HolographicShowcasePage() {
  return (
    <div className="holo-page">
      {/* Optional: Overlay effects */}
      {/* <ScanlineOverlay opacity={0.08} speed={1} /> */}
      {/* <VHSNoise intensity={0.05} chromaShift={false} /> */}

      {/* HERO SECTION */}
      <section className="holo-hero">
        <div className="holo-hero__bg">
          <div className="holo-hero__grid" />
        </div>

        <motion.div
          className="holo-hero__content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          <h1 className="holo-hero__title">
            <HolographicText text="HOLOGRAPHIC EFFECTS" variant="title" />
          </h1>

          <p className="holo-hero__subtitle">
            CSS-only • SVG filters • Canvas optimization • GPU-accelerated
          </p>

          <p className="holo-hero__description">
            Mind-blowing AR/hologram effects for Jinki Intelligence.
            Prismatic color shifts, glitch transitions, projection beams,
            and retro-futuristic scanlines.
          </p>

          <motion.div
            className="holo-hero__cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <a href="#showcase" className="btn btn--primary">
              Explore Effects
            </a>
          </motion.div>
        </motion.div>

        {/* Floating Beacons in Hero */}
        <div className="holo-hero__beacons">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <HolographicBeacon color="#00b4d8" size={80} intensity={1} />
          </motion.div>
        </div>
      </section>

      {/* MAIN SHOWCASE */}
      <section id="showcase" className="holo-showcase-section">
        <HolographicShowcase />
      </section>

      {/* INTEGRATION EXAMPLES */}
      <section className="holo-integration">
        <div className="holo-section-header">
          <h2>Integration Patterns</h2>
          <p>How to use these effects in your design</p>
        </div>

        <div className="holo-examples">
          {/* Example 1: Card Grid */}
          <motion.div
            className="holo-example"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3>Holographic Cards</h3>
            <div className="holo-example__code">
              <pre>{`<HolographicCard
  title="Feature"
  content="Description"
  icon="◉"
  index={0}
  delay={0}
/>`}</pre>
            </div>
            <p>Use for product showcases, feature lists, or interactive cards.</p>
          </motion.div>

          {/* Example 2: Projection Beams */}
          <motion.div
            className="holo-example"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h3>Projection Beams</h3>
            <div className="holo-example__code">
              <pre>{`<HolographicBeacon
  color="#00b4d8"
  size={100}
  intensity={1}
/>`}</pre>
            </div>
            <p>Highlight key features or data points with projection effects.</p>
          </motion.div>

          {/* Example 3: Glitch Effects */}
          <motion.div
            className="holo-example"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3>Glitch Text</h3>
            <div className="holo-example__code">
              <pre>{`<GlitchText
  text="INTERACTIVE"
  intensity={0.5}
/>`}</pre>
            </div>
            <p>Add interactivity with click-triggered glitch corruption.</p>
          </motion.div>

          {/* Example 4: Floating Holograms */}
          <motion.div
            className="holo-example"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h3>Floating Holograms</h3>
            <div className="holo-example__code">
              <pre>{`<HolographicContainer
  size="medium"
  delay={0.1}
>
  <p>Content</p>
</HolographicContainer>`}</pre>
            </div>
            <p>Create floating 3D-looking containers with corner accents.</p>
          </motion.div>

          {/* Example 5: Holographic Text */}
          <motion.div
            className="holo-example"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h3>Chromatic Text</h3>
            <div className="holo-example__code">
              <pre>{`<HolographicText
  text="HOLOGRAPHIC"
  variant="title"
  intensity={1}
/>`}</pre>
            </div>
            <p>Add prismatic color shifts to headings and important text.</p>
          </motion.div>

          {/* Example 6: Scanlines */}
          <motion.div
            className="holo-example"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h3>Scanline Overlay</h3>
            <div className="holo-example__code">
              <pre>{`<ScanlineOverlay
  opacity={0.15}
  speed={1}
  color="rgba(0, 229, 255, 0.5)"
/>`}</pre>
            </div>
            <p>Add CRT scanlines across entire viewport for retro vibes.</p>
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="holo-features">
        <div className="holo-section-header">
          <h2>Technical Features</h2>
          <p>Built for performance and visual impact</p>
        </div>

        <div className="holo-feature-grid">
          <motion.div
            className="holo-feature-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="holo-feature-card__icon">◉</div>
            <h3>CSS-Only Effects</h3>
            <p>No JavaScript required for core animations. Pure CSS for maximum performance.</p>
          </motion.div>

          <motion.div
            className="holo-feature-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="holo-feature-card__icon">◆</div>
            <h3>SVG Filters</h3>
            <p>Chromatic aberration, light refraction, and prismatic splits via SVG filters.</p>
          </motion.div>

          <motion.div
            className="holo-feature-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="holo-feature-card__icon">◇</div>
            <h3>Canvas Optimization</h3>
            <p>Scanlines and VHS noise use canvas for efficiency and GPU acceleration.</p>
          </motion.div>

          <motion.div
            className="holo-feature-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="holo-feature-card__icon">◊</div>
            <h3>GPU Accelerated</h3>
            <p>Transform3d, will-change, and backface-visibility for smooth animations.</p>
          </motion.div>

          <motion.div
            className="holo-feature-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="holo-feature-card__icon">◎</div>
            <h3>Interactive Tracking</h3>
            <p>Mouse-following effects with CSS custom properties for dynamic responses.</p>
          </motion.div>

          <motion.div
            className="holo-feature-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="holo-feature-card__icon">◔</div>
            <h3>Responsive Design</h3>
            <p>Adapts to all screen sizes with mobile-optimized effects.</p>
          </motion.div>
        </div>
      </section>

      {/* PERFORMANCE SECTION */}
      <section className="holo-performance">
        <div className="holo-section-header">
          <h2>Performance Metrics</h2>
          <p>Optimized for 60+ FPS rendering</p>
        </div>

        <div className="holo-metrics">
          <motion.div
            className="holo-metric"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3>60 FPS</h3>
            <p>Smooth animations on 60Hz displays</p>
          </motion.div>

          <motion.div
            className="holo-metric"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3>~3KB</h3>
            <p>CSS file size (minified)</p>
          </motion.div>

          <motion.div
            className="holo-metric"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3>0 Layout Shift</h3>
            <p>No CLS impact from animations</p>
          </motion.div>

          <motion.div
            className="holo-metric"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3>GPU Layer</h3>
            <p>Hardware-accelerated transforms</p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="holo-footer">
        <div className="holo-footer__content">
          <h3>Ready to Create the Future?</h3>
          <p>Integrate holographic effects into your Jinki Intelligence experience.</p>
          <a href="/" className="btn btn--primary">Back to Landing</a>
        </div>
      </footer>
    </div>
  )
}
