import React, { useState } from "react";
import { ChevronDown, HelpCircle, Search, Sparkles, ShoppingBag, Truck, RotateCcw, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";

const FAQ_DATA = [
  {
    category: "Orders & Catalog",
    icon: ShoppingBag,
    items: [
      {
        q: "How do I place an order with specific variants (Size, Color)?",
        a: "Navigate to the product page, select your preferred options (such as Size or Color) from the interactive variant matrix, click 'Add to Cart', and proceed to Checkout.",
      },
      {
        q: "Can I modify or cancel my order after placing it?",
        a: "Yes! You can cancel your order directly from your User Profile under the 'My Orders' tab before it has been dispatched from our fulfillment center.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    icon: Truck,
    items: [
      {
        q: "How much does shipping cost and how fast is delivery?",
        a: "Standard Shipping is completely FREE on all orders above ₹999 (Nominal ₹49 fee below ₹999) with delivery in 3 to 5 business days. Express Priority Delivery arrives in 1 to 2 business days for a flat fee of ₹119.",
      },
      {
        q: "How can I track my package?",
        a: "Once your order is dispatched, a real-time tracking number is assigned. You can track parcel milestones directly from your Order Details or Invoice page.",
      },
    ],
  },
  {
    category: "Payments & Invoices",
    icon: CreditCard,
    items: [
      {
        q: "Which payment options are supported?",
        a: "We support Cash on Delivery (COD), Instant UPI QR (GPay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), and Net Banking across all Indian banks.",
      },
      {
        q: "How do I download my GST tax invoice?",
        a: "You can view and print/download your official tax invoice with itemized pricing, GST breakdown, and digital verification QR code anytime from your Order History.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    icon: RotateCcw,
    items: [
      {
        q: "What is your return policy?",
        a: "We offer a 7-Day Easy Doorstep Return policy on all eligible items. Our courier partner will pick up the parcel from your home within 24-48 hours.",
      },
      {
        q: "When will I receive my refund?",
        a: "Prepaid refunds are credited back to your original source (UPI / Card / NetBanking) within 3-5 business days. COD refunds are transferred to your bank account or UPI ID.",
      },
    ],
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState("0-0");
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <SEO
        title="Frequently Asked Questions & Help Center"
        description="Find answers to common questions regarding orders, shipping timescales, return policies, payment options, and invoice downloads."
        url="/faq"
      />

      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          Knowledge Base & Help Center
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
          Find fast answers to common questions about orders, payments, shipping, and returns.
        </p>

        {/* Search */}
        <div className="mt-6 relative max-w-md mx-auto">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs (e.g., refund, shipping, UPI)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-8">
        {FAQ_DATA.map((cat, cIdx) => {
          const Icon = cat.icon;
          const filteredItems = cat.items.filter(
            (item) =>
              !search ||
              item.q.toLowerCase().includes(search.toLowerCase()) ||
              item.a.toLowerCase().includes(search.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={cIdx} className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Icon size={16} />
                </div>
                <span>{cat.category}</span>
              </div>

              <div className="space-y-2">
                {filteredItems.map((item, iIdx) => {
                  const key = `${cIdx}-${iIdx}`;
                  const isOpen = openIdx === key;

                  return (
                    <div
                      key={iIdx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => setOpenIdx(isOpen ? null : key)}
                        className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          size={15}
                          className={`text-slate-400 shrink-0 transition-transform ${
                            isOpen ? "rotate-180 text-primary" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Still need help */}
      <div className="mt-12 p-8 rounded-3xl bg-slate-900 text-white text-center space-y-3 shadow-xl">
        <h3 className="text-lg font-bold">Still have questions?</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Can't find the answer you're looking for? Reach out to our dedicated support team directly.
        </p>
        <Link
          to="/contact-us"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover text-xs shadow-md transition-all hover:scale-105"
        >
          Contact Customer Support →
        </Link>
      </div>
    </div>
  );
}
