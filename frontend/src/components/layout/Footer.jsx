import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, Truck, RotateCcw, Headphones, Heart } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function Footer() {
  const { settings } = useTheme();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 sm:pt-16 pb-12 border-t border-slate-800 content-auto-footer w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Value Proposition Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pb-10 sm:pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/5 text-indigo-400">
              <Truck size={22} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Free Fast Shipping</h3>
              <p className="text-xs text-slate-400">On orders above ₹{settings?.shipping?.freeShippingThreshold || 999}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/5 text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">100% Genuine</h3>
              <p className="text-xs text-slate-400">Direct authentic source</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/5 text-amber-400">
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">7-Day Easy Returns</h3>
              <p className="text-xs text-slate-400">Hassle-free refunds</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/5 text-purple-400">
              <Headphones size={22} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">24/7 Support</h3>
              <p className="text-xs text-slate-400">{settings?.contact?.phone || "+91 98765 43210"}</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Sparkles size={16} />
              </div>
              <span className="text-lg font-black text-white">{settings?.storeName || "NovaStore"}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {settings?.tagline || "Your premium single vendor destination for cutting-edge electronics, fashion, and lifestyle essentials."}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Shop Categories</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/shop?category=electronics" className="hover:text-white">Electronics & Gadgets</Link></li>
              <li><Link to="/shop?category=fashion" className="hover:text-white">Clothing & Apparel</Link></li>
              <li><Link to="/shop?category=footwear" className="hover:text-white">Footwear & Shoes</Link></li>
              <li><Link to="/shop?category=accessories" className="hover:text-white">Accessories & Watches</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Help & Support</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/contact-us" className="hover:text-white">Contact Support Desk</Link></li>
              <li><Link to="/faq" className="hover:text-white">Frequently Asked Questions</Link></li>
              <li><Link to="/profile" className="hover:text-white">Track Order & Account</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-white">Shipping & Delivery Rates</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Policies & Legal</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-white">Refund & Return Policy</Link></li>
              <li><Link to="/about-us" className="hover:text-white">About Our Company</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {settings?.storeName || "NovaStore"}. All rights reserved. Built with React & Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  );
}
