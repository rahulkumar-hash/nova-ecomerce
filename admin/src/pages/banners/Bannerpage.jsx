import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import AdminTable from "../../components/common/AdminTable";
import Modal from "../../components/common/Modal";
import ImageUpload from "../../components/common/ImageUpload";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";
import { confirmDelete } from "../../utils/swal";

export default function Bannerpage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "/shop",
    buttonText: "Shop Now",
    type: "hero_slider",
    isActive: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/banners?activeOnly=false");
      if (res.success) setBanners(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenModal = (b = null) => {
    if (b) {
      setEditingBanner(b);
      setFormData({
        title: b.title,
        subtitle: b.subtitle || "",
        image: b.image || "",
        link: b.link || "/shop",
        buttonText: b.buttonText || "Shop Now",
        type: b.type || "hero_slider",
        isActive: b.isActive !== undefined ? b.isActive : true,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        subtitle: "",
        image: "",
        link: "/shop",
        buttonText: "Shop Now",
        type: "hero_slider",
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.image) {
      toast.error("Title and image are required");
      return;
    }
    try {
      if (editingBanner) {
        await adminApi.put("/banners/" + editingBanner._id, formData);
        toast.success("Banner updated");
      } else {
        await adminApi.post("/banners", formData);
        toast.success("Banner created");
      }
      setModalOpen(false);
      fetchBanners();
    } catch (err) {
      toast.error(err.message || "Failed to save banner");
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmDelete("Delete this banner?", "This action cannot be undone.");
    if (!ok) return;
    try {
      await adminApi.delete("/banners/" + id);
      toast.success("Banner deleted");
      fetchBanners();
    } catch (err) {
      toast.error(err.message || "Failed to delete banner");
    }
  };

  const columns = [
    {
      header: "Banner",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.image} alt="" className="w-20 h-10 rounded-lg object-cover bg-white/5 border border-white/10" />
          <div>
            <p className="font-bold text-white">{row.title}</p>
            <p className="text-[11px] text-slate-400">{row.subtitle}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      render: (row) => <span className="text-slate-300 capitalize">{row.type.replace("_", " ")}</span>,
    },
    {
      header: "Link",
      render: (row) => <span className="text-indigo-400 font-mono text-[11px]">{row.link}</span>,
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
          <button onClick={() => handleDelete(row._id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400">
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
          <h2 className="text-xl font-black text-white tracking-tight">Hero Banners & Sliders</h2>
          <p className="text-xs text-slate-400">Manage homepage hero slides and promotion banners</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus size={15} />
          <span>Add Banner</span>
        </button>
      </div>

      <AdminTable columns={columns} data={banners} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingBanner ? "Edit Banner" : "Add Banner"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Banner Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Next-Gen Tech Launch"
              className="w-full px-4 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Subtitle</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g. Up to 50% Off on Pro Wireless Accessories"
              className="w-full px-4 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
            />
          </div>
          <ImageUpload value={formData.image} onChange={(url) => setFormData({ ...formData, image: url })} label="Banner Image *" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Link</label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Button Text</label>
              <input
                type="text"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-white/8">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg" style={{ backgroundColor: "var(--color-primary)" }}>
              Save Banner
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
