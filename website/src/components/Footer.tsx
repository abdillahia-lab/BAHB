import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

const footerLinks = {
  services: [
    { label: "Substation Inspection", href: "/services#substation" },
    { label: "Data Center Inspection", href: "/services#datacenter" },
    { label: "Transmission Lines", href: "/services#transmission" },
    { label: "Solar Farm Monitoring", href: "/services#solar" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Technology", href: "/technology" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Blog", href: "/blog" },
    { label: "Support", href: "/support" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] to-transparent pointer-events-none" />

      <div className="container-wide relative">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg opacity-20" />
                <div className="absolute inset-0.5 bg-[#0a0b0d] rounded-lg flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-6 h-6"
                    stroke="url(#footer-logo-gradient)"
                    strokeWidth="1.5"
                  >
                    <defs>
                      <linearGradient id="footer-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <path d="M12 3L4 9v12h16V9l-8-6z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 3v6l6 4.5" strokeLinecap="round" />
                    <path d="M12 9L6 13.5" strokeLinecap="round" />
                    <circle cx="12" cy="15" r="2" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-semibold tracking-tight">
                <span className="text-gradient-accent">BAHB</span>
              </span>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-sm">
              Enterprise-grade autonomous drone inspection powered by advanced AI.
              Delivering precision, safety, and actionable insights for critical infrastructure.
            </p>
            <div className="flex flex-col gap-3 text-sm text-zinc-400">
              <a href="mailto:contact@bahb.ai" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-blue-500" />
                contact@bahb.ai
              </a>
              <a href="tel:+1-888-224-2246" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-blue-500" />
                +1 (888) BAHB-AI0
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                San Francisco, CA
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} BAHB Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/security" className="hover:text-white transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
