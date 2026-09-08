import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import AdminTable from "../../components/common/AdminTable";
import Modal from "../../components/common/Modal";
import adminApi from "../../services/adminApi";
import { useAdminTheme } from "../../context/AdminThemeContext";
import toast from "react-hot-toast";
import { confirmDelete } from "../../utils/swal";

export default function Couponlist() {
  const { settings } = useAdminTheme();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    usageLimit: 1000,
    isActive: true,
  });

  const symbol = settings?.currency?.symbol || "₹";

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/coupons");
      if (res.success) setCoupons(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenModal = (c = null) => {
    if (c) {
      setEditingCoupon(c);
      setFormData({
        code: c.code,
        description: c.description || "",
        discountType: c.discountType || "percentage",
        discountValue: c.discountValue || 10,
        minOrderAmount: c.minOrderAmount || 0,
        expiryDate: new Date(c.expiryDate).toISOString().split("T")[0],
        usageLimit: c.usageLimit || 1000,
        isActive: c.isActive !== undefined ? c.isActive : true,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 10,
        minOrderAmount: 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        usageLimit: 1000,
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await adminApi.put("/coupons/" + editingCoupon._id, formData);
        toast.success("Coupon updated");
      } else {
        await adminApi.post("/coupons", formData);
        toast.success("Coupon created");
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || "Failed to save coupon");
    }
  };

  const handleDelete = async (id, code) => {
    const ok = await confirmDelete(`Delete coupon "${code}"?`, "This action cannot be undone.");
    if (!ok) return;
    try {
      await adminApi.delete("/coupons/" + id);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || "Failed to delete coupon");
    }
  };

  const columns = [
    {
      header: "Code",
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-white px-2 py-0.5 rounded-md bg-white/6 text-xs">{row.code}</span>
          <p className="text-[11px] text-slate-400 mt-1">{row.description}</p>
        </div>
      ),
    },
    {
      header: "Discount",
      render: (row) => (
        <span className="font-bold text-emerald-400">
          {row.discountType === "percentage" ? row.discountValue + "% OFF" : symbol + row.discountValue + " OFF"}
        </span>
      ),
    },
    {
      header: "Expiry",
      render: (row) => <span className="text-slate-400 text-xs">{new Date(row.expiryDate).toLocaleDateString()}</span>,
    },
    {
      header: "Status",
      render: (row) => (
        <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold " + (row.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => handleOpenModal(row)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDelete(row._id, row.code)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Coupons & Promotions</h2>
          <p className="text-xs text-slate-400">Manage promo codes and discounts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus size={15} />
          <span>Add Coupon</span>
        </button>
      </div>

      <AdminTable columns={columns} data={coupons} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCoupon ? "Edit Coupon" : "Add Coupon"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. WELCOME15"
              className="w-full px-4 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white uppercase font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3 py-2 bg-[#1a2336] border border-white/10 rounded-xl text-xs text-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Discount Value</label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-white/8">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg" style={{ backgroundColor: "var(--color-primary)" }}>
              Save Coupon
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
