import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Phone, Mail, MapPin, Plane, Shield, Leaf, Eye, Award, Users, Clock, TrendingUp, Building, Factory, Wheat, Zap, FileCheck, Headphones, CheckCircle2, Quote } from 'lucide-react'
import './LandingPage3.css'

function LandingPage3() {
  const services = [
    {
      icon: <Plane size={32} />,
      title: 'Aerial Surveying & Mapping',
      description: 'Comprehensive drone-based surveying services for land development, construction monitoring, and topographic mapping with survey-grade accuracy.',
      link: '#'
    },
    {
      icon: <Eye size={32} />,
      title: 'Infrastructure Inspections',
      description: 'Professional visual and thermal inspections for power lines, solar farms, wind turbines, and industrial facilities to prevent costly failures.',
      link: '#'
    },
    {
      icon: <Shield size={32} />,
      title: 'Cybersecurity Consulting',
      description: 'Enterprise security assessments, penetration testing, and AI system protection to safeguard your digital infrastructure and data assets.',
      link: '#'
    },
    {
      icon: <Leaf size={32} />,
      title: 'Agricultural Solutions',
      description: 'Precision agriculture services including crop health monitoring, irrigation analysis, and yield optimization for modern farming operations.',
      link: '#'
    }
  ]

  const benefits = [
    {
      icon: <TrendingUp size={24} />,
      title: 'Reduce Operational Costs',
      description: 'Our clients report an average 40% reduction in inspection and surveying costs compared to traditional methods.'
    },
    {
      icon: <Clock size={24} />,
      title: 'Faster Turnaround',
      description: 'Get results in days, not weeks. Our streamlined processes deliver actionable insights when you need them.'
    },
    {
      icon: <FileCheck size={24} />,
      title: 'Detailed Reporting',
      description: 'Receive comprehensive reports with clear recommendations, supporting documentation, and actionable next steps.'
    },
    {
      icon: <Headphones size={24} />,
      title: 'Dedicated Support',
      description: 'Work directly with experienced project managers who understand your industry and specific requirements.'
    }
  ]

  const industries = [
    { icon: <Building size={24} />, name: 'Construction' },
    { icon: <Zap size={24} />, name: 'Energy & Utilities' },
    { icon: <Factory size={24} />, name: 'Manufacturing' },
    { icon: <Wheat size={24} />, name: 'Agriculture' }
  ]

  const stats = [
    { value: '15+', label: 'Years of Experience' },
    { value: '2,500+', label: 'Projects Completed' },
    { value: '98%', label: 'Client Satisfaction' },
    { value: '45', label: 'Industry Experts' }
  ]

  const testimonials = [
    {
      quote: "Jinki Intelligence has become an essential partner for our infrastructure maintenance program. Their thermal inspections have helped us identify and address issues before they become major problems.",
      author: 'Robert Martinez',
      role: 'Director of Operations',
      company: 'Pacific Energy Solutions'
    },
    {
      quote: "The level of detail and professionalism in their surveying work is outstanding. They've helped us save both time and money on multiple development projects.",
      author: 'Amanda Foster',
      role: 'Project Manager',
      company: 'Horizon Development Group'
    }
  ]

  return (
    <div className="lp3">
      <Link to="/" className="back-to-directory">
        <ArrowLeft size={18} />
        <span>Back to Directory</span>
      </Link>

      {/* Top Bar */}
      <div className="lp3-topbar">
        <div className="container">
          <div className="topbar-content">
            <div className="topbar-contact">
              <a href="tel:+1234567890">
                <Phone size={14} />
                <span>(555) 123-4567</span>
              </a>
              <a href="mailto:contact@jinki.com">
                <Mail size={14} />
                <span>contact@jinki-intel.com</span>
              </a>
            </div>
            <div className="topbar-cta">
              <span>Free Consultation Available</span>
              <a href="#contact">Schedule Now</a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="lp3-nav">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <div className="logo-mark">
                <span>JI</span>
              </div>
              <div className="logo-text">
                <span className="logo-name">Jinki Intelligence</span>
                <span className="logo-tagline">Professional Solutions</span>
              </div>
            </div>

            <div className="nav-menu">
              <a href="#services">Services</a>
              <a href="#about">About</a>
              <a href="#industries">Industries</a>
              <a href="#testimonials">Testimonials</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="nav-actions">
              <button className="btn btn-outline">Client Portal</button>
              <button className="btn btn-primary">Get a Quote</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp3-hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-badge">
                <Award size={16} />
                <span>Industry-Leading Solutions Since 2009</span>
              </div>

              <h1 className="hero-title">
                Professional Intelligence Services for Growing Businesses
              </h1>

              <p className="hero-subtitle">
                From aerial surveying to cybersecurity consulting, we provide comprehensive
                solutions that help organizations make better decisions, reduce costs, and
                protect their assets.
              </p>

              <div className="hero-cta">
                <button className="btn btn-primary btn-lg">
                  <span>Request a Consultation</span>
                  <ArrowRight size={20} />
                </button>
                <button className="btn btn-secondary btn-lg">
                  <span>View Our Services</span>
                </button>
              </div>

              <div className="hero-trust">
                <div className="trust-item">
                  <CheckCircle2 size={20} />
                  <span>Certified & Insured</span>
                </div>
                <div className="trust-item">
                  <CheckCircle2 size={20} />
                  <span>24/7 Support</span>
                </div>
                <div className="trust-item">
                  <CheckCircle2 size={20} />
                  <span>Satisfaction Guaranteed</span>
                </div>
              </div>
            </div>

            <div className="hero-image">
              <div className="image-container">
                <div className="image-overlay" />
                <div className="image-badge">
                  <Users size={20} />
                  <div>
                    <span className="badge-number">2,500+</span>
                    <span className="badge-label">Projects Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="lp3-stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="lp3-services" id="services">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Our Services</span>
            <h2 className="section-title">Comprehensive Solutions for Your Business</h2>
            <p className="section-subtitle">
              We offer a full range of professional services designed to help you operate
              more efficiently, make informed decisions, and protect your investments.
            </p>
          </div>

          <div className="services-grid">
            {services.map((service, i) => (
              <div key={i} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <a href={service.link} className="service-link">
                  Learn More <ChevronRight size={18} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="lp3-benefits" id="about">
        <div className="container">
          <div className="benefits-grid">
            <div className="benefits-content">
              <span className="section-eyebrow">Why Choose Jinki</span>
              <h2 className="section-title">A Partner You Can Trust</h2>
              <p className="benefits-text">
                With over 15 years of experience serving businesses across multiple industries,
                we understand what it takes to deliver results. Our commitment to quality,
                transparency, and client success sets us apart.
              </p>

              <div className="benefits-list">
                {benefits.map((benefit, i) => (
                  <div key={i} className="benefit-item">
                    <div className="benefit-icon">{benefit.icon}</div>
                    <div className="benefit-content">
                      <h4>{benefit.title}</h4>
                      <p>{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="benefits-image">
              <div className="image-wrapper">
                <div className="image-bg" />
                <div className="experience-badge">
                  <span className="exp-number">15+</span>
                  <span className="exp-label">Years of Excellence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="lp3-industries" id="industries">
        <div className="container">
          <div className="section-header centered">
            <span className="section-eyebrow">Industries We Serve</span>
            <h2 className="section-title">Expertise Across Multiple Sectors</h2>
            <p className="section-subtitle">
              Our team has deep experience working with clients in these key industries,
              understanding their unique challenges and requirements.
            </p>
          </div>

          <div className="industries-grid">
            {industries.map((industry, i) => (
              <div key={i} className="industry-card">
                <div className="industry-icon">{industry.icon}</div>
                <span className="industry-name">{industry.name}</span>
              </div>
            ))}
          </div>

          <div className="industries-cta">
            <p>Don't see your industry? We work with businesses of all types.</p>
            <button className="btn btn-outline">
              Contact Us <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="lp3-testimonials" id="testimonials">
        <div className="container">
          <div className="section-header centered">
            <span className="section-eyebrow">Client Testimonials</span>
            <h2 className="section-title">What Our Clients Say</h2>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="testimonial-card">
                <Quote className="quote-icon" size={32} />
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.author[0]}</div>
                  <div className="author-info">
                    <span className="author-name">{testimonial.author}</span>
                    <span className="author-role">{testimonial.role}</span>
                    <span className="author-company">{testimonial.company}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp3-cta" id="contact">
        <div className="container">
          <div className="cta-grid">
            <div className="cta-content">
              <h2>Ready to Get Started?</h2>
              <p>
                Schedule a free consultation with our team to discuss your needs and
                learn how Jinki Intelligence can help your business succeed.
              </p>
              <div className="cta-features">
                <div className="cta-feature">
                  <Check size={18} />
                  <span>Free initial consultation</span>
                </div>
                <div className="cta-feature">
                  <Check size={18} />
                  <span>Custom solutions for your needs</span>
                </div>
                <div className="cta-feature">
                  <Check size={18} />
                  <span>Transparent pricing</span>
                </div>
              </div>
            </div>

            <div className="cta-form">
              <h3>Request a Consultation</h3>
              <form>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" placeholder="John" />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" placeholder="Smith" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="john@company.com" />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input type="text" placeholder="Your Company Name" />
                </div>
                <div className="form-group">
                  <label>Service Interest</label>
                  <select>
                    <option>Select a service...</option>
                    <option>Aerial Surveying</option>
                    <option>Infrastructure Inspections</option>
                    <option>Cybersecurity Consulting</option>
                    <option>Agricultural Solutions</option>
                    <option>Multiple Services</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea placeholder="Tell us about your project..." rows="4"></textarea>
                </div>
                <button type="submit" className="btn btn-primary btn-full">
                  Submit Request <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp3-footer">
        <div className="container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="logo">
                <div className="logo-mark">
                  <span>JI</span>
                </div>
                <div className="logo-text">
                  <span className="logo-name">Jinki Intelligence</span>
                </div>
              </div>
              <p className="footer-description">
                Professional aerial surveying, inspection, cybersecurity, and agricultural
                intelligence services for businesses that demand excellence.
              </p>
              <div className="footer-contact">
                <a href="tel:+1234567890">
                  <Phone size={16} />
                  <span>(555) 123-4567</span>
                </a>
                <a href="mailto:contact@jinki.com">
                  <Mail size={16} />
                  <span>contact@jinki-intel.com</span>
                </a>
                <a href="#">
                  <MapPin size={16} />
                  <span>San Francisco, CA</span>
                </a>
              </div>
            </div>

            <div className="footer-links-wrapper">
              <div className="footer-links">
                <h4>Services</h4>
                <ul>
                  <li><a href="#">Aerial Surveying</a></li>
                  <li><a href="#">Infrastructure Inspections</a></li>
                  <li><a href="#">Cybersecurity Consulting</a></li>
                  <li><a href="#">Agricultural Solutions</a></li>
                </ul>
              </div>

              <div className="footer-links">
                <h4>Company</h4>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Our Team</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">News & Press</a></li>
                </ul>
              </div>

              <div className="footer-links">
                <h4>Resources</h4>
                <ul>
                  <li><a href="#">Case Studies</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">FAQs</a></li>
                  <li><a href="#">Support</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Jinki Intelligence. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage3
