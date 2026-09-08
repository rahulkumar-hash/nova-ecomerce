import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("userData");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        if (res.success) {
          setUser(res.data);
          localStorage.setItem("userData", JSON.stringify(res.data));
        }
      } catch (err) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userData");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.success) {
        localStorage.setItem("userToken", res.data.accessToken);
        localStorage.setItem("userData", JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.success("Welcome back, " + res.data.user.name + "!");
        setAuthModalOpen(false);
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
      return false;
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const res = await api.post("/auth/register", { name, email, password, phone });
      if (res.success) {
        localStorage.setItem("userToken", res.data.accessToken);
        localStorage.setItem("userData", JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.success("Account created successfully!");
        setAuthModalOpen(false);
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    setUser(null);
    toast.success("Logged out successfully");
  };

  const addAddress = async (addressData) => {
    try {
      const res = await api.post("/auth/address", addressData);
      if (res.success) {
        setUser((prev) => ({ ...prev, addresses: res.data }));
        toast.success("Delivery address saved!");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Failed to add address");
      return false;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.success) {
        toast.success(res.message || "OTP sent to your email!");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Failed to send reset OTP");
      return false;
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await api.post("/auth/reset-password", { email, otp, newPassword });
      if (res.success) {
        toast.success(res.message || "Password reset successfully! Please log in.");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
      return false;
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const res = await api.delete("/auth/address/" + addressId);
      if (res.success) {
        setUser((prev) => ({ ...prev, addresses: res.data }));
        toast.success("Address removed");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete address");
      return false;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put("/auth/profile", profileData);
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem("userData", JSON.stringify(res.data));
        toast.success("Profile updated successfully! ✨");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        addAddress,
        deleteAddress,
        forgotPassword,
        resetPassword,
        authModalOpen,
        setAuthModalOpen,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
