import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Trash2, Eye, Package, Layers, Sparkles } from "lucide-react";
import AdminTable from "../../components/common/AdminTable";
import { useAdminProductStore } from "../../store/useAdminProductStore";
import { useAdminTheme } from "../../context/AdminThemeContext";
import { confirmDelete } from "../../utils/swal";
import toast from "react-hot-toast";

export default function ProductPage() {
  const { settings } = useAdminTheme();
  const { products, total, page: storePage, pages, loading, fetchProducts, deleteProduct } = useAdminProductStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const symbol = settings?.currency?.symbol || "₹";

  useEffect(() => {
    fetchProducts({ page, limit: 10, search, publishedOnly: false });
  }, [page, search, fetchProducts]);

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirmDelete(
      `Delete "${name}"?`,
      "This product and its variant inventory will be permanently removed from the catalog.",
      "Yes, Delete Product"
    );

    if (isConfirmed) {
      await deleteProduct(id);
    }
  };

  const columns = [
    {
      header: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.thumbnail || (row.images && row.images[0]) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64"}
            alt=""
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64";
            }}
            className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/10"
          />
          <div>
            <p className="font-bold text-white leading-tight">{row.name}</p>
            <p className="text-[11px] text-slate-400">{row.brand || "Generic"}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-white/6 text-slate-300 font-medium text-[11px]">
          {row.category?.name || "Uncategorized"}
        </span>
      ),
    },
    {
      header: "Type",
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
            row.hasVariants
              ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
              : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
          }`}
        >
          {row.hasVariants ? `${row.variants?.length || 0} Variants` : "Simple Product"}
        </span>
      ),
    },
    {
      header: "Price",
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-emerald-400">
            {symbol}{row.price?.toLocaleString()}
          </span>
          {row.mrp > row.price && (
            <span className="text-[10px] text-slate-500 line-through ml-1.5 font-mono">
              {symbol}{row.mrp?.toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Stock",
      render: (row) => (
        <span
          className={`font-mono font-bold ${
            row.stock <= 5 ? "text-rose-400" : "text-slate-300"
          }`}
        >
          {row.stock} units
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            row.isPublished
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-slate-500/10 text-slate-400"
          }`}
        >
          {row.isPublished ? "Published" : "Draft"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <a
            href={`http://localhost:5173/product/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            title="View Live PDP"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <Eye size={14} />
          </a>
          <Link
            to={`/products/edit/${row._id}`}
            title="Edit Product"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 transition-colors"
          >
            <Edit2 size={14} />
          </Link>
          <button
            onClick={() => handleDelete(row._id, row.name)}
            title="Delete Product"
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Products Catalog</h2>
          <p className="text-xs text-slate-400">
            Manage multi-category inventory, variant matrices, pricing, and specifications
          </p>
        </div>
        <Link
          to="/products/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:scale-105"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus size={15} />
          <span>Add New Product</span>
        </Link>
      </div>

      <AdminTable
        columns={columns}
        data={products}
        loading={loading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search products by name, brand, SKU..."
        pagination={{
          page: storePage || page,
          pages: pages || 1,
          total: total || 0,
          onPageChange: (p) => setPage(p),
        }}
      />
    </div>
  );
}
