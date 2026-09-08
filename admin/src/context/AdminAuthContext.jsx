import React, { createContext, useContext, useState, useEffect } from "react";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem("adminUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await adminApi.get("/admin/me");
        if (res.success) {
          setAdmin(res.data);
          localStorage.setItem("adminUser", JSON.stringify(res.data));
        }
      } catch (err) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await adminApi.post("/admin/login", { email, password });
      if (res.success) {
        localStorage.setItem("adminToken", res.data.token);
        localStorage.setItem("adminUser", JSON.stringify(res.data.admin));
        setAdmin(res.data.admin);
        toast.success(`Welcome back, ${res.data.admin.name}!`);
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setAdmin(null);
    toast.success("Logged out successfully");
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
