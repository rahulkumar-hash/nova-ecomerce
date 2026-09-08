import React, { useState } from "react";
import { Star, CheckCircle2, MessageSquare, ThumbsUp, ShieldCheck, PenLine, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function ProductReviews({ productId, initialReviews = [], onReviewAdded, avgRating = 4.8, totalReviews = 0 }) {
  const { user, isAuthenticated, setAuthModalOpen } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (Array.isArray(initialReviews)) {
      setReviews(initialReviews);
    }
  }, [initialReviews]);

  const ratingsCount = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : star === 5 ? 75 : star === 4 ? 20 : 5;
    return { star, count, percentage };
  });

  const calculatedAvg = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : avgRating || "4.8";

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (!comment.trim()) {
      toast.error("Please provide your review feedback");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/reviews/add", {
        productId,
        rating,
        title,
        comment,
      });

      if (res.success) {
        toast.success("Thank you! Your verified review has been posted 🎉");
        const addedReview = res.data;
        const updatedList = [addedReview, ...reviews];
        setReviews(updatedList);
        if (onReviewAdded) onReviewAdded(addedReview, updatedList);
        
        setTitle("");
        setComment("");
        setRating(5);
        setShowReviewModal(false);
      }
    } catch (err) {
      toast.error(err.message || "Failed to post your review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Section: Rating Overview & Breakdown */}
      <div className="p-5 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* Overall Score */}
        <div className="md:col-span-4 text-center md:text-left flex flex-col items-center md:items-start justify-center">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {calculatedAvg}
            </span>
            <span className="text-slate-400 font-bold text-base sm:text-lg">/ 5.0</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={18}
                fill={Number(calculatedAvg) >= s ? "currentColor" : Number(calculatedAvg) >= s - 0.5 ? "currentColor" : "none"}
                className={Number(calculatedAvg) >= s ? "text-amber-400" : "text-slate-300 dark:text-slate-700"}
              />
            ))}
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Based on {reviews.length || totalReviews || 48} verified buyer ratings
          </p>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                setAuthModalOpen(true);
              } else {
                setShowReviewModal(true);
              }
            }}
            className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <PenLine size={14} />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Rating Progress Bars */}
        <div className="md:col-span-8 space-y-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-5 md:pt-0 md:pl-8">
          {ratingsCount.map((item) => (
            <div key={item.star} className="flex items-center gap-3 text-xs">
              <span className="w-10 sm:w-12 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                {item.star} <Star size={12} fill="currentColor" className="text-amber-400" />
              </span>
              <div className="flex-1 h-2 sm:h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="w-9 text-right font-mono text-slate-500 text-[11px]">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Submission Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 sm:space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Star size={18} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Write a Review</h3>
                    <p className="text-[11px] text-slate-500">Rate your experience with this item</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Interactive Star Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Overall Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 sm:p-1.5 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          size={26}
                          fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                          className={(hoverRating || rating) >= star ? "text-amber-400" : "text-slate-300 dark:text-slate-700"}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-2">
                      {rating === 5 ? "⭐ Excellent" : rating === 4 ? "👍 Good" : rating === 3 ? "👌 Average" : rating === 2 ? "👎 Fair" : "😡 Poor"}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Review Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Amazing battery life and gorgeous display!"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Detailed Feedback <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like or dislike about this product? How is the quality, battery, performance, or packaging?"
                    className="w-full px-4 py-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Customer Reviews</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {reviews.length}
          </span>
        </h4>

        {reviews.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No customer reviews yet
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Be the first to share your thoughts and help others make an informed decision!
            </p>
            <button
              onClick={() => {
                if (!isAuthenticated) setAuthModalOpen(true);
                else setShowReviewModal(true);
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-primary border border-primary/30 hover:bg-primary/5"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r, idx) => (
              <div
                key={r._id || idx}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white font-bold text-xs flex items-center justify-center uppercase shadow-sm shrink-0">
                      {r.userName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {r.userName || "Verified Buyer"}
                        </span>
                        {r.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={11} /> Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-amber-400 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        fill={i < (r.rating || 5) ? "currentColor" : "none"}
                        className={i < (r.rating || 5) ? "text-amber-400" : "text-slate-200 dark:text-slate-700"}
                      />
                    ))}
                  </div>
                </div>

                {r.title && (
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                    {r.title}
                  </h5>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
