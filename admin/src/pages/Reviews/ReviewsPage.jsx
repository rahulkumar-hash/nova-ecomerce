import React, { useState, useEffect } from "react";
import { Star, Trash2 } from "lucide-react";
import AdminTable from "../../components/common/AdminTable";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";
import { confirmDelete } from "../../utils/swal";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/reviews/admin/all");
      if (res.success) setReviews(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    const ok = await confirmDelete("Delete this review?", "Customer review will be permanently removed.");
    if (!ok) return;
    try {
      await adminApi.delete("/reviews/admin/" + id);
      toast.success("Review deleted");
      fetchReviews();
    } catch (err) {
      toast.error(err.message || "Failed to delete review");
    }
  };

  const columns = [
    {
      header: "Product",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <img
            src={row.product?.thumbnail || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64"}
            alt=""
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-bold text-white text-xs">{row.product?.name || "Product"}</span>
        </div>
      ),
    },
    {
      header: "Rating",
      render: (row) => (
        <div className="flex items-center gap-1 text-amber-400">
          <Star size={13} fill="currentColor" />
          <span className="font-bold text-xs">{row.rating} / 5</span>
        </div>
      ),
    },
    {
      header: "Customer & Review",
      render: (row) => (
        <div>
          <p className="font-semibold text-white text-xs">{row.userName}</p>
          <p className="text-[11px] text-slate-300 italic">"{row.comment}"</p>
        </div>
      ),
    },
    {
      header: "Date",
      render: (row) => <span className="text-slate-400 text-xs">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: "Action",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => handleDelete(row._id)}
          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Customer Product Reviews</h2>
        <p className="text-xs text-slate-400">Moderate product ratings and feedback</p>
      </div>

      <AdminTable columns={columns} data={reviews} loading={loading} />
    </div>
  );
}
