import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminCategoryStore = create((set, get) => ({
  categories: [],
  loading: false,

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const res = await adminApi.get("/categories");
      if (res.success && res.data) {
        const catList = Array.isArray(res.data) ? res.data : [];
        set({ categories: catList, loading: false });
        return catList;
      }
      set({ loading: false });
      return [];
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch categories");
      return [];
    }
  },

  createCategory: async (categoryData) => {
    set({ loading: true });
    try {
      const res = await adminApi.post("/categories", categoryData);
      set({ loading: false });
      if (res.success && res.data) {
        toast.success("Category created successfully! 🎉");
        get().fetchCategories();
        return res.data;
      }
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to create category");
      throw err;
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ loading: true });
    try {
      const res = await adminApi.put(`/categories/${id}`, categoryData);
      set({ loading: false });
      if (res.success && res.data) {
        toast.success("Category updated successfully! ✨");
        get().fetchCategories();
        return res.data;
      }
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to update category");
      throw err;
    }
  },

  deleteCategory: async (id) => {
    try {
      const res = await adminApi.delete(`/categories/${id}`);
      if (res.success) {
        set((state) => ({
          categories: state.categories.filter((c) => c._id !== id),
        }));
        toast.success("Category deleted successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || "Failed to delete category");
      return false;
    }
  },
}));
