import { create } from "zustand";
import api from "../services/api";

export const useSettingStore = create((set) => ({
  settings: null,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/settings");
      if (res.success) {
        set({ settings: res.data, loading: false });
        return res.data;
      }
    } catch (err) {
      set({ loading: false });
    }
  },
}));
