"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";

const contactReasons = [
  { id: "demo", label: "Request a Demo", icon: MessageSquare },
  { id: "sales", label: "Sales Inquiry", icon: Building2 },
  { id: "support", label: "Technical Support", icon: Phone },
  { id: "partnership", label: "Partnership", icon: Mail },
];

const industries = [
  "Power & Utilities",
  "Data Centers",
  "Renewable Energy",
  "Telecommunications",
  "Oil & Gas",
  "Other",
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    reason: "demo",
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    industry: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container-narrow relative z-10 pt-32 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="label mb-4 block">Contact</span>
            <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl mb-6">
              <span className="text-gradient">Let's Start a</span>
              <br />
              <span className="text-gradient-accent">Conversation</span>
            </h1>
            <p className="body-large">
              Ready to transform your infrastructure inspection? Our team is here
              to help you explore how BAHB can meet your needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="section-padding pt-8">
        <div className="container-narrow">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
              <p className="text-zinc-400 mb-8">
                Whether you're looking for a demo, have questions about our technology,
                or want to explore a partnership, we'd love to hear from you.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Email</div>
                    <a
                      href="mailto:contact@bahb.ai"
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      contact@bahb.ai
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Phone</div>
                    <a
                      href="tel:+18882242246"
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      +1 (888) BAHB-AI0
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Headquarters</div>
                    <p className="text-zinc-400">
                      548 Market Street, Suite 35000
                      <br />
                      San Francisco, CA 94104
                    </p>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="mt-8 p-6 rounded-2xl bg-[#12141a] border border-white/5">
                <h3 className="font-medium mb-3">Office Hours</h3>
                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM PST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday - Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3"
            >
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card-premium card text-center py-16"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
                  <p className="text-zinc-400 mb-6">
                    We've received your message and will get back to you within
                    24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        reason: "demo",
                        firstName: "",
                        lastName: "",
                        email: "",
                        company: "",
                        industry: "",
                        message: "",
                      });
                    }}
                    className="btn-secondary"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="card-premium card">
                  {/* Contact Reason */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-4">
                      How can we help?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {contactReasons.map((reason) => (
                        <button
                          key={reason.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, reason: reason.id }))
                          }
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                            formData.reason === reason.id
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <reason.icon
                            className={`w-5 h-5 ${
                              formData.reason === reason.id
                                ? "text-blue-500"
                                : "text-zinc-500"
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              formData.reason === reason.id
                                ? "text-white"
                                : "text-zinc-400"
                            }`}
                          >
                            {reason.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium mb-2"
                      >
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#0a0b0d] border border-white/10 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium mb-2"
                      >
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#0a0b0d] border border-white/10 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0b0d] border border-white/10 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="john@company.com"
                    />
                  </div>

                  {/* Company & Industry */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium mb-2"
                      >
                        Company *
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#0a0b0d] border border-white/10 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="industry"
                        className="block text-sm font-medium mb-2"
                      >
                        Industry *
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#0a0b0d] border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      >
                        <option value="" disabled>
                          Select industry
                        </option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0b0d] border border-white/10 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                      placeholder="Tell us about your infrastructure and inspection needs..."
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-zinc-500 text-center mt-4">
                    By submitting this form, you agree to our{" "}
                    <a href="/privacy" className="text-blue-500 hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-[#0d0e11]">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="label mb-4 block">FAQ</span>
            <h2 className="heading-section text-3xl sm:text-4xl mb-6 text-gradient">
              Common Questions
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: "How quickly can you deploy to our site?",
                a: "We can typically complete site assessment and first flight within 2-4 weeks of contract signing.",
              },
              {
                q: "Do you require special permits or approvals?",
                a: "BAHB handles all FAA waivers and coordination. We're Part 107 certified with COA experience for utility corridors.",
              },
              {
                q: "What's included in the inspection reports?",
                a: "Reports include annotated imagery, thermal analysis, AI findings with severity ratings, and prioritized maintenance recommendations.",
              },
              {
                q: "Can you integrate with our existing systems?",
                a: "Yes, we offer API integrations with common asset management platforms and can export data in multiple formats.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-zinc-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
