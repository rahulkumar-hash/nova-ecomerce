import React, { useState, useEffect } from "react";
import { 
  HelpCircle, 
  MessageSquarePlus, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  User, 
  Clock, 
  Send,
  Sparkles,
  X
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function ProductQA({ productId, productName }) {
  const { isAuthenticated, setAuthModalOpen } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAskModal, setShowAskModal] = useState(false);
  const [questionInput, setQuestionInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [productId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/questions/product/${productId}`);
      if (res.success) {
        setQuestions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error("Failed to load product questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (!questionInput.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post("/questions/ask", {
        productId,
        question: questionInput.trim(),
      });
      if (res.success) {
        toast.success("Your question has been posted! Our support team will answer shortly. 💬");
        setQuestionInput("");
        setShowAskModal(false);
        fetchQuestions();
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit question");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter(
    (q) =>
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      (q.answer && q.answer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Ask Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" /> Questions & Answers
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Have queries about specifications, compatibility or warranty? Ask us directly.
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              setAuthModalOpen(true);
            } else {
              setShowAskModal(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 transition-all shrink-0 cursor-pointer"
        >
          <MessageSquarePlus size={16} />
          <span>Ask a Question</span>
        </button>
      </div>

      {/* Search Q&A */}
      {questions.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search answered questions..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading questions & answers...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-10 text-center space-y-3 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {search ? "No matching questions found" : "No questions asked yet"}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first to ask a question about {productName}!
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q._id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              {/* Question */}
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  Q
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {q.question}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Asked by {q.userName || "Shopper"} • {new Date(q.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Answer */}
              {q.answer ? (
                <div className="flex items-start gap-2.5 pl-3 border-l-2 border-primary/30 mt-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    A
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {q.answer}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <ShieldCheck size={12} /> {q.answeredBy || "NovaStore Official"}
                      </span>
                      {q.answeredAt && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(q.answeredAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 pl-8 flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>Awaiting official answer from store support.</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Ask Question */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span>Ask About This Product</span>
              </div>
              <button
                onClick={() => setShowAskModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Product: <span className="font-semibold text-slate-900 dark:text-white">{productName}</span>
            </p>

            <form onSubmit={handleAskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Question *
                </label>
                <textarea
                  rows={4}
                  required
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="e.g. Does this support wireless charging? Is brand warranty applicable across India?"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !questionInput.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/25 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <span className="animate-spin">⏳</span> : <Send size={14} />}
                  <span>Submit Question</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
