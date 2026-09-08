import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  X,
  Send,
  User,
} from "lucide-react";
import adminApi from "../../services/adminApi";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { confirmAction } from "../../utils/swal";

export default function QuestionsManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'pending' | 'answered'
  const [search, setSearch] = useState("");

  // Modal State
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [isApproved, setIsApproved] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/questions/admin/all?status=${filter}`);
      if (res.success) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.questions)
          ? res.data.questions
          : [];
        setQuestions(list);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const handleOpenAnswerModal = (q) => {
    setSelectedQuestion(q);
    setAnswerText(q.answer || "");
    setIsApproved(q.isApproved !== false);
    setAnswerModalOpen(true);
  };

  const handleSaveAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) {
      toast.error("Please enter an answer");
      return;
    }
    try {
      setSubmitting(true);
      const res = await adminApi.put(`/questions/admin/${selectedQuestion._id}/answer`, {
        answer: answerText.trim(),
        isApproved,
      });
      if (res.success) {
        toast.success("Answer published successfully!");
        setAnswerModalOpen(false);
        fetchQuestions();
      }
    } catch (err) {
      toast.error(err.message || "Failed to save answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    const ok = await confirmAction("Delete Question?", "This question and its answers will be permanently deleted.", "Yes, Delete");
    if (!ok) return;
    try {
      const res = await adminApi.delete(`/questions/admin/${id}`);
      if (res.success) {
        toast.success("Question deleted");
        fetchQuestions();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete question");
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      q.question?.toLowerCase().includes(term) ||
      q.product?.name?.toLowerCase().includes(term) ||
      q.userName?.toLowerCase().includes(term) ||
      (typeof q.answer === "string" && q.answer.toLowerCase().includes(term))
    );
  });

  const pendingCount = questions.filter((q) => !q.answer || !q.answer.trim()).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-white tracking-tight">Customer Q&A Moderation</h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Answer customer pre-purchase queries and publish official responses on product pages
          </p>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by question or product..."
              className="pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-56"
            />
          </div>

          <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "answered", label: "Answered" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filter === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading customer questions...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#131926] border border-white/8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <HelpCircle size={24} />
          </div>
          <h3 className="text-sm font-bold text-white">No questions found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter === "pending"
              ? "All customer questions have been answered! Excellent response time."
              : "When customers ask questions on product detail pages, they will appear here for admin responses."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuestions.map((q) => {
            const hasAnswer = Boolean(q.answer && q.answer.trim());
            return (
              <div
                key={q._id}
                className="p-5 rounded-2xl bg-[#131926] border border-white/8 space-y-4 hover:border-white/15 transition-all"
              >
                {/* Question Header & Product Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <img
                      src={q.product?.thumbnail?.url || q.product?.thumbnail || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64"}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover bg-white/5 border border-white/10 shrink-0"
                    />
                    <div>
                      <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                        Product
                      </span>
                      <h4 className="text-xs font-bold text-white leading-tight hover:underline">
                        <Link to={`/products/edit/${q.product?._id}`}>{q.product?.name || "Product"}</Link>
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        hasAnswer
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {hasAnswer ? "Answered" : "Awaiting Answer"}
                    </span>

                    <button
                      onClick={() => handleOpenAnswerModal(q)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Edit3 size={13} />
                      <span>{hasAnswer ? "Edit Answer" : "Answer Question"}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteQuestion(q._id)}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Question Body */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-300">{q.userName || "Customer"}</span>
                    <span>•</span>
                    <span>{new Date(q.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  </div>
                  <p className="text-sm font-semibold text-white flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">Q:</span>
                    <span>{q.question}</span>
                  </p>
                </div>

                {/* Answer Section */}
                {hasAnswer ? (
                  <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={12} />
                        <span>Official Store Answer {q.answeredBy ? `(${q.answeredBy})` : ""}</span>
                      </span>
                      {q.answeredAt && (
                        <span className="text-[10px] text-slate-500">
                          Answered on {new Date(q.answeredAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 leading-relaxed">{q.answer}</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-300/80 flex items-center gap-2">
                    <Clock size={14} className="shrink-0 text-amber-400" />
                    <span>This question has not received an official answer yet. Answering increases customer checkout confidence.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Answer Modal */}
      <Modal
        isOpen={answerModalOpen}
        onClose={() => setAnswerModalOpen(false)}
        title={selectedQuestion?.answer ? "Edit Official Answer" : "Answer Customer Question"}
      >
        <form onSubmit={handleSaveAnswer} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-400">Customer Question</span>
            <p className="text-white font-medium text-sm">{selectedQuestion?.question}</p>
            <p className="text-[10px] text-slate-400">
              Product: <strong className="text-slate-200">{selectedQuestion?.product?.name}</strong>
            </p>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Official Store Answer
            </label>
            <textarea
              rows={4}
              required
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Provide a helpful, accurate and courteous answer..."
              className="w-full p-3 bg-[#1a2336] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isApproved"
              checked={isApproved}
              onChange={(e) => setIsApproved(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="isApproved" className="text-slate-300 font-medium cursor-pointer">
              Publish visible to public on Product Detail Page
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-white/8">
            <button
              type="button"
              onClick={() => setAnswerModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send size={13} />
              <span>{submitting ? "Publishing..." : "Publish Answer"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
