import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plane, Shield, Leaf, Eye, Cpu, BarChart3, Check, ChevronRight, Play, Star, Zap, Globe, Lock, Users } from 'lucide-react'
import './LandingPage1.css'

function LandingPage1() {
  const services = [
    {
      icon: <Plane size={28} />,
      title: 'Aerial Surveying',
      description: 'High-precision drone mapping and surveying for construction, mining, and infrastructure projects.',
      features: ['3D Terrain Mapping', 'Volumetric Analysis', 'Progress Monitoring']
    },
    {
      icon: <Eye size={28} />,
      title: 'Industrial Inspections',
      description: 'Advanced visual and thermal inspections for energy, utilities, and industrial facilities.',
      features: ['Thermal Imaging', 'Defect Detection', 'Predictive Maintenance']
    },
    {
      icon: <Shield size={28} />,
      title: 'Cyber & AI Security',
      description: 'Enterprise-grade security consulting to protect your digital assets and AI systems.',
      features: ['Threat Assessment', 'AI Model Security', 'Compliance Audits']
    },
    {
      icon: <Leaf size={28} />,
      title: 'Agricultural Intelligence',
      description: 'Precision agriculture solutions for crop monitoring, yield optimization, and farm management.',
      features: ['Crop Health Analysis', 'Irrigation Planning', 'Yield Prediction']
    }
  ]

  const stats = [
    { value: '500+', label: 'Projects Completed' },
    { value: '99.7%', label: 'Accuracy Rate' },
    { value: '50M+', label: 'Acres Surveyed' },
    { value: '24/7', label: 'Support Available' }
  ]

  const testimonials = [
    {
      quote: "Jinki's aerial surveying transformed how we manage our construction sites. The precision and speed are unmatched.",
      author: 'Marcus Chen',
      role: 'VP of Operations, BuildCore Inc.',
      rating: 5
    },
    {
      quote: "Their AI security audit identified vulnerabilities we never knew existed. Essential partner for any tech company.",
      author: 'Sarah Williams',
      role: 'CTO, DataFlow Systems',
      rating: 5
    },
    {
      quote: "The agricultural monitoring has increased our yield by 23%. The ROI speaks for itself.",
      author: 'James Rodriguez',
      role: 'Owner, Verde Farms',
      rating: 5
    }
  ]

  return (
    <div className="lp1">
      <Link to="/" className="back-to-directory">
        <ArrowLeft size={18} />
        <span>Back to Directory</span>
      </Link>

      {/* Navigation */}
      <nav className="lp1-nav">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <div className="logo-icon">
                <span>J</span>
              </div>
              <div className="logo-text">
                <span className="logo-name">Jinki</span>
                <span className="logo-tagline">Intelligence</span>
              </div>
            </div>

            <div className="nav-links">
              <a href="#services">Services</a>
              <a href="#about">About</a>
              <a href="#testimonials">Testimonials</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="nav-cta">
              <button className="btn btn-secondary">Log In</button>
              <button className="btn btn-primary">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp1-hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-grid" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <Zap size={14} />
              <span>Trusted by Industry Leaders</span>
            </div>

            <h1 className="hero-title">
              Intelligent Solutions for
              <span className="gradient-text"> Tomorrow's Challenges</span>
            </h1>

            <p className="hero-subtitle">
              From aerial surveying to AI security, we deliver cutting-edge intelligence
              solutions that transform how businesses operate, analyze, and grow.
            </p>

            <div className="hero-cta">
              <button className="btn btn-primary btn-lg">
                <span>Schedule Consultation</span>
                <ArrowRight size={20} />
              </button>
              <button className="btn btn-ghost btn-lg">
                <Play size={20} />
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="hero-trust">
              <span className="trust-label">Trusted by:</span>
              <div className="trust-logos">
                <div className="trust-logo">TechCorp</div>
                <div className="trust-logo">AgriMax</div>
                <div className="trust-logo">BuildPro</div>
                <div className="trust-logo">SecureNet</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card">
              <div className="hero-card-header">
                <div className="card-status">
                  <span className="status-dot" />
                  <span>Live Analysis</span>
                </div>
                <Cpu size={20} />
              </div>
              <div className="hero-card-content">
                <div className="analysis-visual">
                  <div className="analysis-ring" />
                  <div className="analysis-ring" />
                  <div className="analysis-ring" />
                  <div className="analysis-center">
                    <span>98.5%</span>
                  </div>
                </div>
                <div className="analysis-stats">
                  <div className="stat-item">
                    <span className="stat-label">Accuracy</span>
                    <span className="stat-value">98.5%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Coverage</span>
                    <span className="stat-value">12.4 km²</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Anomalies</span>
                    <span className="stat-value">3 detected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="lp1-stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card">
                <span className="stat-number">{stat.value}</span>
                <span className="stat-text">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="lp1-services" id="services">
        <div className="container">
          <div className="section-header">
            <span className="section-label">What We Do</span>
            <h2 className="section-title">Comprehensive Intelligence Solutions</h2>
            <p className="section-subtitle">
              From the sky to cyberspace, our integrated services provide complete visibility
              and protection for your operations.
            </p>
          </div>

          <div className="services-grid">
            {services.map((service, i) => (
              <div key={i} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, j) => (
                    <li key={j}>
                      <Check size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a href="#" className="service-link">
                  Learn More <ChevronRight size={16} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="lp1-about" id="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <span className="section-label">Why Jinki Intelligence</span>
              <h2 className="section-title">Where Innovation Meets Reliability</h2>
              <p className="about-text">
                We combine cutting-edge AI technology with years of industry expertise to deliver
                solutions that are not just intelligent, but dependable. Our team of engineers,
                data scientists, and industry specialists work together to solve your most
                complex challenges.
              </p>

              <div className="about-features">
                <div className="about-feature">
                  <div className="feature-icon">
                    <Globe size={24} />
                  </div>
                  <div className="feature-content">
                    <h4>Global Reach</h4>
                    <p>Operating across 30+ countries with local expertise</p>
                  </div>
                </div>

                <div className="about-feature">
                  <div className="feature-icon">
                    <Lock size={24} />
                  </div>
                  <div className="feature-content">
                    <h4>Enterprise Security</h4>
                    <p>SOC 2 Type II certified with end-to-end encryption</p>
                  </div>
                </div>

                <div className="about-feature">
                  <div className="feature-icon">
                    <Users size={24} />
                  </div>
                  <div className="feature-content">
                    <h4>Dedicated Support</h4>
                    <p>24/7 expert support with dedicated account managers</p>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary">
                About Our Team <ArrowRight size={18} />
              </button>
            </div>

            <div className="about-visual">
              <div className="about-image">
                <div className="image-overlay" />
                <div className="floating-card floating-card-1">
                  <BarChart3 size={20} />
                  <span>+43% Efficiency</span>
                </div>
                <div className="floating-card floating-card-2">
                  <Shield size={20} />
                  <span>100% Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="lp1-testimonials" id="testimonials">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Client Stories</span>
            <h2 className="section-title">Trusted by Industry Leaders</h2>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={16} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p className="testimonial-quote">"{testimonial.quote}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.author[0]}</div>
                  <div className="author-info">
                    <span className="author-name">{testimonial.author}</span>
                    <span className="author-role">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp1-cta" id="contact">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Ready to Transform Your Operations?</h2>
              <p>
                Get a free consultation and discover how Jinki Intelligence can
                elevate your business with cutting-edge solutions.
              </p>
              <div className="cta-buttons">
                <button className="btn btn-white btn-lg">
                  Schedule Free Consultation
                  <ArrowRight size={20} />
                </button>
                <button className="btn btn-outline-white btn-lg">
                  Contact Sales
                </button>
              </div>
            </div>
            <div className="cta-decoration">
              <div className="deco-circle deco-circle-1" />
              <div className="deco-circle deco-circle-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp1-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <div className="logo-icon">
                  <span>J</span>
                </div>
                <div className="logo-text">
                  <span className="logo-name">Jinki</span>
                  <span className="logo-tagline">Intelligence</span>
                </div>
              </div>
              <p className="footer-description">
                Delivering intelligent solutions for aerial surveying, industrial inspections,
                cybersecurity, and agricultural intelligence.
              </p>
            </div>

            <div className="footer-links">
              <h4>Services</h4>
              <ul>
                <li><a href="#">Aerial Surveying</a></li>
                <li><a href="#">Industrial Inspections</a></li>
                <li><a href="#">Cyber Security</a></li>
                <li><a href="#">Agricultural Intelligence</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Case Studies</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Jinki Intelligence. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage1
