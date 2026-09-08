import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2, 
  Mail, 
  Phone,
  Sparkles
} from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function DynamicPage({ defaultSlug }) {
  const { slug: routeSlug } = useParams();
  const slug = routeSlug || defaultSlug;
  const { settings } = useTheme();

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await api.get("/pages/" + slug);
        if (res.success && res.data) {
          setPage(res.data);
        }
      } catch (err) {
        console.error("Failed to load page:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 mt-3">Loading page content...</span>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page Under Construction</h2>
        <p className="text-sm text-slate-500 mb-6">
          This policy content is currently being updated by the store administrator.
        </p>
        <Link to="/" className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary text-xs">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-semibold">{page.title}</span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} /> Official Policy & Guidelines
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {page.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> Last updated: {new Date(page.updatedAt || page.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Formatted Content */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
        <div
          className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4
            [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-slate-900 dark:[&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:border-b [&>h2]:border-slate-100 dark:[&>h2]:border-slate-800 [&>h2]:pb-2
            [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5
            [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1.5
            [&>p]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        {/* Need Help Box */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Have any questions about this policy?</h4>
            <p className="text-xs text-slate-500 mt-0.5">Our dedicated support desk is available 24/7 to assist you.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/contact-us"
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover text-xs shadow-md transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
