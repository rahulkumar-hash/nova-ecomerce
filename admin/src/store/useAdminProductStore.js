import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminProductStore = create((set, get) => ({
  products: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  currentProduct: null,

  fetchProducts: async (params = {}) => {
    set({ loading: true });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await adminApi.get(`/products${query ? `?${query}` : ""}`);
      if (res.success && res.data) {
        const productsList = Array.isArray(res.data) ? res.data : (res.data.products || []);
        set({
          products: productsList,
          total: res.data.total || productsList.length,
          page: res.data.page || 1,
          pages: res.data.pages || 1,
          loading: false,
        });
        return productsList;
      }
      set({ loading: false });
      return [];
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch products");
      return [];
    }
  },

  getProductById: async (id) => {
    set({ loading: true });
    try {
      const res = await adminApi.get(`/products/${id}`);
      if (res.success && res.data) {
        set({ currentProduct: res.data, loading: false });
        return res.data;
      }
      set({ loading: false });
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch product details");
      return null;
    }
  },

  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const res = await adminApi.post("/products", productData);
      set({ loading: false });
      if (res.success && res.data) {
        toast.success("Product created successfully! 🎉");
        get().fetchProducts();
        return res.data;
      }
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to create product");
      throw err;
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true });
    try {
      const res = await adminApi.put(`/products/${id}`, productData);
      set({ loading: false });
      if (res.success && res.data) {
        toast.success("Product updated successfully! ✨");
        get().fetchProducts();
        return res.data;
      }
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to update product");
      throw err;
    }
  },

  deleteProduct: async (id) => {
    try {
      const res = await adminApi.delete(`/products/${id}`);
      if (res.success) {
        set((state) => ({
          products: state.products.filter((p) => p._id !== id),
          total: state.total - 1,
        }));
        toast.success("Product deleted successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
      return false;
    }
  },

  togglePublish: async (id) => {
    try {
      const res = await adminApi.patch(`/products/${id}/toggle-publish`);
      if (res.success && res.data) {
        set((state) => ({
          products: state.products.map((p) => (p._id === id ? res.data : p)),
        }));
        toast.success(`Product ${res.data.isPublished ? "published" : "hidden"} successfully`);
        return res.data;
      }
    } catch (err) {
      toast.error(err.message || "Failed to toggle publish status");
    }
  },
}));
