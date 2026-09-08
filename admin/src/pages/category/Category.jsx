import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import AdminTable from "../../components/common/AdminTable";
import Modal from "../../components/common/Modal";
import ImageUpload from "../../components/common/ImageUpload";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";
import { confirmDelete } from "../../utils/swal";

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    icon: "ShoppingBag",
    parentCategory: "",
    isFeatured: false,
    isActive: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/categories?includeInactive=true");
      if (res.success) setCategories(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        description: cat.description || "",
        image: cat.image || "",
        icon: cat.icon || "ShoppingBag",
        parentCategory: cat.parentCategory?._id || "",
        isFeatured: !!cat.isFeatured,
        isActive: cat.isActive !== undefined ? cat.isActive : true,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        image: "",
        icon: "ShoppingBag",
        parentCategory: "",
        isFeatured: false,
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        parentCategory: formData.parentCategory ? formData.parentCategory : null,
      };
      if (editingCategory) {
        await adminApi.put("/categories/" + editingCategory._id, payload);
        toast.success("Category updated");
      } else {
        await adminApi.post("/categories", payload);
        toast.success("Category created");
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Failed to save category");
    }
  };

  const handleToggleFeatured = async (row) => {
    try {
      await adminApi.put("/categories/" + row._id, {
        isFeatured: !row.isFeatured,
        parentCategory: row.parentCategory?._id || null,
      });
      toast.success(row.isFeatured ? "Removed from Homepage" : "Featured on Homepage");
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Failed to update category");
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirmDelete(`Delete category "${name}"?`, "This action cannot be undone.");
    if (!ok) return;
    try {
      await adminApi.delete("/categories/" + id);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  const columns = [
    {
      header: "Category",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.image || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=64"}
            alt=""
            className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/10"
          />
          <div>
            <p className="font-bold text-white">{row.name}</p>
            <p className="text-[11px] text-slate-400">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Parent",
      render: (row) => <span className="text-slate-400">{row.parentCategory?.name || "Top-Level"}</span>,
    },
    {
      header: "Homepage",
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleFeatured(row)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
            row.isFeatured
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
              : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
          }`}
          title="Click to toggle Homepage Featured status"
        >
          {row.isFeatured ? "★ Featured" : "☆ Standard"}
        </button>
      ),
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
          <button onClick={() => handleDelete(row._id, row.name)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400">
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
          <h2 className="text-xl font-black text-white tracking-tight">Categories Management</h2>
          <p className="text-xs text-slate-400">Organize multi-category catalog hierarchies and icons</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:scale-105"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus size={15} />
          <span>Add Category</span>
        </button>
      </div>

      <AdminTable
        columns={columns}
        data={categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories..."
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCategory ? "Edit Category" : "Add New Category"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Electronics & Gadgets"
              className="w-full px-4 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Parent Category</label>
            <select
              value={formData.parentCategory}
              onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
              className="w-full px-3.5 py-2 bg-[#1a2336] border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="">None (Top-Level)</option>
              {categories.filter((c) => !c.parentCategory && (!editingCategory || c._id !== editingCategory._id)).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <ImageUpload value={formData.image} onChange={(url) => setFormData({ ...formData, image: url })} label="Category Banner Image" />
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white/10"
              />
              <span className="text-xs text-slate-300 font-medium">Feature on Homepage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white/10"
              />
              <span className="text-xs text-slate-300 font-medium">Active Status</span>
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-white/8">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg" style={{ backgroundColor: "var(--color-primary)" }}>
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
