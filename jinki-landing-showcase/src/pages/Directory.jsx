import { Link } from 'react-router-dom'
import { ArrowRight, Plane, Shield, Leaf } from 'lucide-react'
import './Directory.css'

const landingPages = [
  {
    id: 1,
    title: 'Modern Minimal',
    subtitle: 'Clean & Contemporary',
    typography: 'Inter / Poppins',
    description: 'A sleek, modern design with clean lines and generous whitespace. Features smooth animations and a sophisticated color palette.',
    colors: ['#0A0F1C', '#3B82F6', '#10B981', '#F8FAFC'],
    path: '/landing-1',
    tags: ['Modern', 'Clean', 'Minimal']
  },
  {
    id: 2,
    title: 'Tech Forward',
    subtitle: 'Geometric & Bold',
    typography: 'Space Grotesk / Rajdhani',
    description: 'A futuristic, tech-inspired design with geometric patterns and bold typography. Perfect for showcasing innovation and cutting-edge technology.',
    colors: ['#030712', '#06B6D4', '#8B5CF6', '#F0FDF4'],
    path: '/landing-2',
    tags: ['Futuristic', 'Bold', 'Technical']
  },
  {
    id: 3,
    title: 'Professional Trust',
    subtitle: 'Classic & Reliable',
    typography: 'Roboto / Source Sans',
    description: 'A professional, enterprise-grade design that builds trust and credibility. Clean layouts with a focus on readability and conversion.',
    colors: ['#0F172A', '#2563EB', '#059669', '#FFFFFF'],
    path: '/landing-3',
    tags: ['Professional', 'Enterprise', 'Trustworthy']
  }
]

function Directory() {
  return (
    <div className="directory">
      <div className="directory-bg">
        <div className="directory-grid" />
        <div className="directory-glow directory-glow-1" />
        <div className="directory-glow directory-glow-2" />
      </div>

      <header className="directory-header">
        <div className="container">
          <div className="logo">
            <div className="logo-icon">
              <span className="logo-letter">J</span>
            </div>
            <div className="logo-text">
              <span className="logo-name">Jinki</span>
              <span className="logo-tagline">Intelligence</span>
            </div>
          </div>
        </div>
      </header>

      <main className="directory-main">
        <div className="container">
          <div className="directory-intro">
            <h1 className="directory-title">Landing Page Options</h1>
            <p className="directory-subtitle">
              Browse and preview different landing page designs for Jinki Intelligence.
              Click any option to view the full page experience.
            </p>
          </div>

          <div className="directory-services">
            <div className="service-badge">
              <Plane size={16} />
              <span>Aerial Surveying</span>
            </div>
            <div className="service-badge">
              <Shield size={16} />
              <span>Cyber & AI Security</span>
            </div>
            <div className="service-badge">
              <Leaf size={16} />
              <span>Agricultural Inspections</span>
            </div>
          </div>

          <div className="landing-grid">
            {landingPages.map((page) => (
              <Link to={page.path} key={page.id} className="landing-card">
                <div className="card-preview">
                  <div className="card-preview-header">
                    <div className="preview-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                  <div className="card-preview-content">
                    <div className="preview-nav" />
                    <div className="preview-hero">
                      <div className="preview-hero-text" />
                      <div className="preview-hero-subtext" />
                      <div className="preview-hero-btn" />
                    </div>
                    <div className="preview-features">
                      <div className="preview-feature" />
                      <div className="preview-feature" />
                      <div className="preview-feature" />
                    </div>
                  </div>
                </div>

                <div className="card-content">
                  <div className="card-header">
                    <span className="card-number">0{page.id}</span>
                    <div className="card-colors">
                      {page.colors.map((color, i) => (
                        <span
                          key={i}
                          className="color-dot"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <h2 className="card-title">{page.title}</h2>
                  <p className="card-subtitle">{page.subtitle}</p>

                  <div className="card-typography">
                    <span className="typography-label">Typography:</span>
                    <span className="typography-value">{page.typography}</span>
                  </div>

                  <p className="card-description">{page.description}</p>

                  <div className="card-tags">
                    {page.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>

                  <div className="card-cta">
                    <span>Preview Design</span>
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="directory-footer">
        <div className="container">
          <p>&copy; 2024 Jinki Intelligence. Internal Design Directory.</p>
        </div>
      </footer>
    </div>
  )
}

export default Directory
