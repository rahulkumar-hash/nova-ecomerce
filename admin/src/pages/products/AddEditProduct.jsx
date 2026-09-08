import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import adminApi from "../../services/adminApi";
import ImageUpload from "../../components/common/ImageUpload";
import { useAdminTheme } from "../../context/AdminThemeContext";
import toast from "react-hot-toast";

export default function AddEditProduct() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { settings } = useAdminTheme();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    category: "",
    brand: "",
    tags: "",
    images: [""],
    thumbnail: "",
    hasVariants: false,
    price: 0,
    mrp: 0,
    discountType: "percentage",
    discountValue: 0,
    stock: 10,
    sku: "",
    attributeOptions: [
      { name: "Color", values: "" },
      { name: "Size", values: "" },
    ],
    variants: [],
    specifications: [
      { key: "Brand", value: "" },
      { key: "Warranty", value: "1 Year" },
    ],
    isFeatured: false,
    isTrending: false,
    isBestSeller: false,
    isNewArrival: true,
    isPublished: true,
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await adminApi.get("/categories?includeInactive=true");
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();

    if (isEdit) {
      const loadProduct = async () => {
        try {
          const res = await adminApi.get("/products/" + id);
          if (res.success && res.data.product) {
            const p = res.data.product;
            setFormData({
              name: p.name || "",
              shortDescription: p.shortDescription || "",
              description: p.description || "",
              category: p.category?._id || p.category || "",
              brand: p.brand || "",
              tags: p.tags ? p.tags.join(", ") : "",
              images: p.images?.length > 0 ? p.images : [""],
              thumbnail: p.thumbnail || "",
              hasVariants: !!p.hasVariants,
              price: p.price || 0,
              mrp: p.mrp || 0,
              discountType: p.discountType || "percentage",
              discountValue: p.discountValue || 0,
              stock: p.stock || 0,
              sku: p.sku || "",
              attributeOptions: p.attributeOptions?.map((o) => ({
                name: o.name,
                values: o.values.join(", "),
              })) || [
                { name: "Color", values: "" },
                { name: "Size", values: "" },
              ],
              variants: p.variants || [],
              specifications: p.specifications?.length > 0 ? p.specifications : [{ key: "", value: "" }],
              isFeatured: !!p.isFeatured,
              isTrending: !!p.isTrending,
              isBestSeller: !!p.isBestSeller,
              isNewArrival: !!p.isNewArrival,
              isPublished: p.isPublished !== undefined ? p.isPublished : true,
            });
          }
        } catch (err) {
          toast.error(err.message || "Failed to load product");
        } finally {
          setFetching(false);
        }
      };
      loadProduct();
    }
  }, [id, isEdit]);

  const generateVariantsFromAttributes = () => {
    const activeAttrs = formData.attributeOptions
      .map((opt) => ({
        name: opt.name.trim(),
        values: opt.values.split(",").map((v) => v.trim()).filter(Boolean),
      }))
      .filter((opt) => opt.name && opt.values.length > 0);

    if (activeAttrs.length === 0) {
      toast.error("Please provide attribute names and comma-separated values (e.g. S, M, L)");
      return;
    }

    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])), [[]]);
    };

    const valueCombinations = cartesian(activeAttrs.map((a) => a.values));

    const generated = valueCombinations.map((combo) => {
      const title = combo.join(" / ");
      const attributes = combo.map((val, i) => ({
        name: activeAttrs[i].name,
        value: val,
      }));
      const cleanSku = (formData.brand ? formData.brand.slice(0, 3).toUpperCase() : "PROD") + "-" + title.replace(/[^a-zA-Z0-9]/g, "-").toUpperCase();

      return {
        sku: cleanSku,
        title,
        attributes,
        price: Number(formData.price) || 999,
        mrp: Number(formData.mrp) || 1499,
        stock: 20,
        image: formData.images[0] || "",
        isActive: true,
      };
    });

    setFormData((prev) => ({ ...prev, variants: generated }));
    toast.success("Generated " + generated.length + " variant combinations!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error("Please fill in Product Name and Category");
      return;
    }

    setLoading(true);
    try {
      const cleanImages = formData.images.filter(Boolean);
      const mainThumbnail = formData.thumbnail.trim() || cleanImages[0] || "";

      // Ensure mainThumbnail is also part of images array if not already
      const finalImages = [...cleanImages];
      if (mainThumbnail && !finalImages.includes(mainThumbnail)) {
        finalImages.unshift(mainThumbnail);
      }

      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        images: finalImages,
        thumbnail: mainThumbnail,
        attributeOptions: formData.attributeOptions
          .map((opt) => ({
            name: opt.name.trim(),
            values: opt.values.split(",").map((v) => v.trim()).filter(Boolean),
          }))
          .filter((opt) => opt.name && opt.values.length > 0),
        specifications: formData.specifications.filter((s) => s.key && s.value),
      };

      if (isEdit) {
        await adminApi.put("/products/" + id, payload);
        toast.success("Product updated successfully!");
      } else {
        await adminApi.post("/products", payload);
        toast.success("Product created successfully!");
      }
      navigate("/products");
    } catch (err) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading product details...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/products" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">{isEdit ? "Edit Product" : "Create New Product"}</h2>
            <p className="text-xs text-slate-400">Configure product details, pricing or dynamic multi-attribute variant matrix</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg hover:scale-105"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Save size={15} />
          <span>{loading ? "Saving..." : isEdit ? "Update Product" : "Save Product"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
            <h3 className="text-sm font-bold text-white">Basic Information</h3>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Product Title *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Phone 16 Pro Max / Heavyweight Cotton Hoodie"
                className="w-full px-4 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Short Summary</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief one-line highlight for catalog cards"
                className="w-full px-4 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Description</label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed product descriptions, features, and specs breakdown..."
                className="w-full p-4 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Product Variants Architecture</h3>
                <p className="text-xs text-slate-400">Choose if this item has multiple options or a single SKU</p>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/8">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasVariants: false })}
                  className={"px-3 py-1.5 rounded-lg text-xs font-semibold transition-all " + (!formData.hasVariants ? "bg-white/20 text-white shadow" : "text-slate-400")}
                >
                  Simple Product
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasVariants: true })}
                  className={"px-3 py-1.5 rounded-lg text-xs font-semibold transition-all " + (formData.hasVariants ? "bg-white/20 text-white shadow" : "text-slate-400")}
                >
                  Has Variants
                </button>
              </div>
            </div>

            {!formData.hasVariants ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Base Sale Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">MRP / Original Price (₹)</label>
                  <input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Available Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-3 border-t border-white/6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Step 1: Define Attributes & Values</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, attributeOptions: [...formData.attributeOptions, { name: "", values: "" }] })}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Attribute
                    </button>
                  </div>

                  {formData.attributeOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const updated = [...formData.attributeOptions];
                          updated[idx].name = e.target.value;
                          setFormData({ ...formData, attributeOptions: updated });
                        }}
                        placeholder="Name (e.g. Color, Size, RAM)"
                        className="w-1/3 px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
                      />
                      <input
                        type="text"
                        value={opt.values}
                        onChange={(e) => {
                          const updated = [...formData.attributeOptions];
                          updated[idx].values = e.target.value;
                          setFormData({ ...formData, attributeOptions: updated });
                        }}
                        placeholder="Comma-separated values (e.g. Black, Blue, Silver)"
                        className="flex-1 px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.attributeOptions.filter((_, i) => i !== idx);
                          setFormData({ ...formData, attributeOptions: updated });
                        }}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={generateVariantsFromAttributes}
                    className="w-full py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} />
                    <span>Generate Variant Matrix Combinations</span>
                  </button>
                </div>

                {formData.variants.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-white/6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Step 2: Manage Variant Details ({formData.variants.length} combinations)</span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {formData.variants.map((v, vIdx) => (
                        <div key={vIdx} className="p-3 rounded-xl bg-white/3 border border-white/6 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{v.title}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.variants.filter((_, i) => i !== vIdx);
                                setFormData({ ...formData, variants: updated });
                              }}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">SKU</label>
                              <input
                                type="text"
                                value={v.sku || ""}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[vIdx].sku = e.target.value;
                                  setFormData({ ...formData, variants: updated });
                                }}
                                className="w-full px-2 py-1.5 bg-white/4 border border-white/8 rounded-lg text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Sale Price (₹)</label>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[vIdx].price = Number(e.target.value);
                                  setFormData({ ...formData, variants: updated });
                                }}
                                className="w-full px-2 py-1.5 bg-white/4 border border-white/8 rounded-lg text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">MRP (₹)</label>
                              <input
                                type="number"
                                value={v.mrp}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[vIdx].mrp = Number(e.target.value);
                                  setFormData({ ...formData, variants: updated });
                                }}
                                className="w-full px-2 py-1.5 bg-white/4 border border-white/8 rounded-lg text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Stock</label>
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[vIdx].stock = Number(e.target.value);
                                  setFormData({ ...formData, variants: updated });
                                }}
                                className="w-full px-2 py-1.5 bg-white/4 border border-white/8 rounded-lg text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Technical Specifications</h3>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, specifications: [...formData.specifications, { key: "", value: "" }] })}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus size={13} /> Add Specification
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.specifications.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => {
                      const updated = [...formData.specifications];
                      updated[idx].key = e.target.value;
                      setFormData({ ...formData, specifications: updated });
                    }}
                    placeholder="Key (e.g. Battery, Material)"
                    className="w-1/3 px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => {
                      const updated = [...formData.specifications];
                      updated[idx].value = e.target.value;
                      setFormData({ ...formData, specifications: updated });
                    }}
                    placeholder="Value (e.g. 5000 mAh)"
                    className="flex-1 px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.specifications.filter((_, i) => i !== idx);
                      setFormData({ ...formData, specifications: updated });
                    }}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
            <h3 className="text-sm font-bold text-white">Organization</h3>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Primary Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#1a2336] border border-white/10 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.filter((c) => !c.parentCategory).map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Brand Name</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. ApexTech / UrbanAura"
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Tags (Comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="electronics, wireless, pro"
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* Main Product Thumbnail */}
          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Main Product Thumbnail</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Primary
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Displayed on Home cards, Catalog, Shop search, and Cart
                </p>
              </div>
            </div>

            <ImageUpload
              value={formData.thumbnail}
              onChange={(url) => {
                setFormData((prev) => {
                  const updated = { ...prev, thumbnail: url };
                  // If images array is empty or only empty strings, initialize with thumbnail
                  if (url && (prev.images.length === 0 || (prev.images.length === 1 && !prev.images[0]))) {
                    updated.images = [url];
                  }
                  return updated;
                });
              }}
              label="Thumbnail Image (File or URL)"
            />
          </div>

          {/* Product Gallery Images */}
          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Product Gallery</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Additional photos shown on the Product Details Page
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, images: [...formData.images, ""] })}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
              >
                <Plus size={13} /> Add Image
              </button>
            </div>

            <div className="space-y-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Gallery Photo #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {img && img !== formData.thumbnail && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, thumbnail: img });
                            toast.success("Set as main thumbnail!");
                          }}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20"
                        >
                          ⭐ Set as Main
                        </button>
                      )}
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.images.filter((_, i) => i !== idx);
                            setFormData({ ...formData, images: updated });
                          }}
                          className="text-rose-400 hover:text-rose-300 p-1"
                          title="Remove image"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <ImageUpload
                    value={img}
                    onChange={(url) => {
                      const updated = [...formData.images];
                      updated[idx] = url;
                      setFormData((prev) => {
                        const next = { ...prev, images: updated };
                        // If no thumbnail yet, set thumbnail as this image
                        if (!prev.thumbnail && url) {
                          next.thumbnail = url;
                        }
                        return next;
                      });
                    }}
                    label="Image Source"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-3">
            <h3 className="text-sm font-bold text-white">Status & Badges</h3>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white/10 border-white/20"
              />
              <span className="text-xs text-slate-300 font-medium">Published & Visible in Store</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white/10 border-white/20"
              />
              <span className="text-xs text-slate-300 font-medium">Featured on Homepage</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={formData.isTrending}
                onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white/10 border-white/20"
              />
              <span className="text-xs text-slate-300 font-medium">Trending Hot Deal</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={formData.isBestSeller}
                onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white/10 border-white/20"
              />
              <span className="text-xs text-slate-300 font-medium">Best Seller Badge</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
