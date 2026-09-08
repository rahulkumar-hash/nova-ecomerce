import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Save,
  Globe,
  Shield,
  HelpCircle,
  Building2,
  Search,
} from "lucide-react";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { confirmDelete, confirmAction } from "../../utils/swal";

export default function PagesManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [editingPage, setEditingPage] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/pages");
      if (res.success) {
        setPages(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      toast.error("Failed to load pages: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleResetDefaults = async () => {
    const ok = await confirmAction(
      "Restore Default Policies?",
      "Standard e-commerce legal policies (Privacy, Terms, Returns, Shipping, About, FAQ) will be restored.",
      "Yes, Restore"
    );
    if (!ok) return;
    try {
      setLoading(true);
      const res = await adminApi.post("/pages/reset-defaults");
      if (res.success) {
        toast.success("Standard legal policy templates restored!");
        fetchPages();
      }
    } catch (err) {
      toast.error(err.message || "Failed to restore defaults");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page) => {
    setIsNew(false);
    setEditingPage({
      ...page,
      metaTitle: page.metaTitle || page.title,
      metaDescription: page.metaDescription || page.excerpt || "",
    });
    setPreviewMode(false);
  };

  const handleCreateNew = () => {
    setIsNew(true);
    setEditingPage({
      title: "",
      slug: "",
      category: "custom",
      excerpt: "",
      content: "<h2>Overview</h2>\n<p>Enter your page content here...</p>",
      metaTitle: "",
      metaDescription: "",
      isPublished: true,
    });
    setPreviewMode(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingPage.title || !editingPage.content) {
      toast.error("Please fill in Title and Content");
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        const res = await adminApi.post("/pages", editingPage);
        if (res.success) {
          toast.success("New page published successfully!");
          setEditingPage(null);
          fetchPages();
        }
      } else {
        const res = await adminApi.put("/pages/" + editingPage._id, editingPage);
        if (res.success) {
          toast.success("Page updated successfully!");
          setEditingPage(null);
          fetchPages();
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    const ok = await confirmDelete(`Delete "${title}"?`, "This page will be permanently removed from the storefront.");
    if (!ok) return;
    try {
      const res = await adminApi.delete("/pages/" + id);
      if (res.success) {
        toast.success("Page deleted");
        fetchPages();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete page");
    }
  };

  const filteredPages = pages.filter((p) => {
    const matchesTab = activeTab === "all" || p.category === activeTab;
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "legal":
        return <Shield className="w-4 h-4 text-amber-400" />;
      case "company":
        return <Building2 className="w-4 h-4 text-indigo-400" />;
      case "support":
        return <HelpCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText size={22} />
            </div>
            Pages & Policies CMS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage Privacy Policy, Terms, Return policies, About Us, and custom storefront pages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            title="Reset standard templates"
          >
            <RotateCcw size={14} />
            <span>Restore Default Policies</span>
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus size={15} />
            <span>Add New Page</span>
          </button>
        </div>
      </div>

      {/* Main List and Tabs */}
      <div className="bg-[#131926] border border-white/8 rounded-2xl p-5 space-y-5">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: "all", label: "All Pages" },
              { id: "legal", label: "Legal Policies" },
              { id: "company", label: "Company" },
              { id: "support", label: "Support & FAQ" },
              { id: "custom", label: "Custom" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or slug..."
              className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading CMS pages...</span>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-white/8 rounded-2xl">
            <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No pages found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Click "Restore Default Policies" to populate standard legal and company templates.
            </p>
            <button
              onClick={handleResetDefaults}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
            >
              Restore Standard Legal Templates
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/8 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Page Title</th>
                  <th className="pb-3 px-3">Slug / Storefront URL</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Last Updated</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6 text-slate-300">
                {filteredPages.map((page) => (
                  <tr key={page._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {getCategoryIcon(page.category)}
                        <div>
                          <p className="font-bold text-white text-[13px]">{page.title}</p>
                          {page.excerpt && <p className="text-[11px] text-slate-500 line-clamp-1">{page.excerpt}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      <span className="text-indigo-400">/{page.slug}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300">
                        {page.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {page.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 size={13} /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <XCircle size={13} /> Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(page.updatedAt || page.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`http://localhost:5173/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                          title="View on Storefront"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => handleEdit(page)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400"
                          title="Edit page"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(page._id, page.title)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Delete page"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create Page Modal */}
      <AnimatePresence>
        {editingPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111726] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between bg-[#131926]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Edit size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isNew ? "Create New Storefront Page" : `Edit "${editingPage.title}"`}
                    </h3>
                    <span className="text-[11px] text-slate-400">/{editingPage.slug || "custom-slug"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                      previewMode
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Eye size={13} />
                    <span>{previewMode ? "Edit Mode" : "Preview"}</span>
                  </button>
                  <button
                    onClick={() => setEditingPage(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                {previewMode ? (
                  <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/8 space-y-4">
                    <h1 className="text-2xl font-black text-white">{editingPage.title || "Untitled Page"}</h1>
                    {editingPage.excerpt && (
                      <p className="text-xs text-indigo-400 italic">{editingPage.excerpt}</p>
                    )}
                    <div
                      className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: editingPage.content }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Page Title *</label>
                        <input
                          type="text"
                          required
                          value={editingPage.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingPage({
                              ...editingPage,
                              title: val,
                              slug: isNew
                                ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
                                : editingPage.slug,
                            });
                          }}
                          placeholder="e.g. Privacy Policy"
                          className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">URL Slug *</label>
                        <input
                          type="text"
                          required
                          value={editingPage.slug}
                          onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                          placeholder="e.g. privacy-policy"
                          className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                        <select
                          value={editingPage.category}
                          onChange={(e) => setEditingPage({ ...editingPage, category: e.target.value })}
                          className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="legal" className="bg-[#111726]">Legal Policy (Privacy, Terms, Returns)</option>
                          <option value="company" className="bg-[#111726]">Company (About Us, Careers)</option>
                          <option value="support" className="bg-[#111726]">Support & Help (FAQ, Shipping)</option>
                          <option value="custom" className="bg-[#111726]">Custom Content Page</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white select-none">
                          <input
                            type="checkbox"
                            checked={editingPage.isPublished}
                            onChange={(e) => setEditingPage({ ...editingPage, isPublished: e.target.checked })}
                            className="rounded bg-white/5 border-white/10 text-indigo-600 focus:ring-0"
                          />
                          <span>Publish on Live Storefront</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Short Excerpt / Subtitle
                      </label>
                      <input
                        type="text"
                        value={editingPage.excerpt || ""}
                        onChange={(e) => setEditingPage({ ...editingPage, excerpt: e.target.value })}
                        placeholder="Brief 1-line summary shown in cards and footer"
                        className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-300">
                          Page Body (HTML / Structured Text) *
                        </label>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span>Supports &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, &lt;ol&gt;</span>
                        </div>
                      </div>
                      <textarea
                        rows={12}
                        required
                        value={editingPage.content}
                        onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="<h2>1. Clause Heading</h2>\n<p>Body paragraph...</p>"
                      />
                    </div>

                    {/* SEO Meta Box */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe size={13} /> Search Engine Optimization (SEO)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Meta Title</label>
                          <input
                            type="text"
                            value={editingPage.metaTitle || ""}
                            onChange={(e) => setEditingPage({ ...editingPage, metaTitle: e.target.value })}
                            placeholder="Title for Google search results"
                            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Meta Description</label>
                          <input
                            type="text"
                            value={editingPage.metaDescription || ""}
                            onChange={(e) => setEditingPage({ ...editingPage, metaDescription: e.target.value })}
                            placeholder="Snippet for search engines"
                            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-white/8 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPage(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{saving ? "Saving Changes..." : "Save & Publish Page"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
