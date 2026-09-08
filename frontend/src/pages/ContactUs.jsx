import React, { useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  Sparkles,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import SEO from "../components/common/SEO";
import toast from "react-hot-toast";

export default function ContactUs() {
  const { settings } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Order Inquiry",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Your message has been sent! Our support team will get back to you within 24 hours.");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <SEO
        title="Contact Customer Support"
        description="Get in touch with NovaStore customer support. We are here 24/7 to help you with orders, returns, delivery tracking, and inquiries."
        url="/contact"
      />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          24/7 Customer Assistance
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
          We're Here to Help You
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
          Have an inquiry regarding your order, delivery timeline, or returns? Reach out to our friendly support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Contact Details
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Email Support</span>
                  <a href={`mailto:${settings?.contact?.email || "support@novastore.com"}`} className="text-slate-600 dark:text-slate-400 hover:text-primary">
                    {settings?.contact?.email || "support@novastore.com"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Helpline Phone</span>
                  <a href={`tel:${settings?.contact?.phone || "+91 98765 43210"}`} className="text-slate-600 dark:text-slate-400 hover:text-primary">
                    {settings?.contact?.phone || "+91 98765 43210"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Headquarters / Hub</span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {settings?.contact?.address || "101, Innovation Square, Cyber City, Bangalore, India - 560001"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Operational Hours</span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Monday to Saturday: 9:00 AM – 8:00 PM IST<br />
                    Sunday: 10:00 AM – 4:00 PM (Live Chat & Email)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message Dispatched!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Thank you for writing to us. A dedicated customer support representative has been assigned to your ticket.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-6 py-2.5 rounded-xl font-bold text-white bg-primary text-xs"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Send Us an Inquiry
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. rahul@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 00000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option>Order Inquiry & Tracking</option>
                      <option>Product & Variant Availability</option>
                      <option>Return & Refund Assistance</option>
                      <option>Payment & Invoice Issue</option>
                      <option>Feedback & Suggestions</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details about your query..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-xs transition-all"
                >
                  <Send size={14} />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
