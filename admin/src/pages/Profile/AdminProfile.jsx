import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  Mail, 
  Key, 
  ShieldCheck, 
  Save, 
  Lock, 
  CheckCircle2, 
  Camera, 
  Eye, 
  EyeOff, 
  Sparkles,
  RefreshCw,
  BadgeCheck,
  UploadCloud
} from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import ImageUpload from "../../components/common/ImageUpload";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";

export default function AdminProfile() {
  const { admin, updateProfile, changePassword, loading } = useAdminAuthStore();

  const [profileData, setProfileData] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
    avatar: admin?.avatar || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (admin) {
      setProfileData({
        name: admin.name || "",
        email: admin.email || "",
        avatar: admin.avatar || "",
      });
    }
  }, [admin]);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploadingAvatar(true);
    try {
      const res = await adminApi.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.success && res.data?.url) {
        const newAvatar = res.data.url;
        setProfileData((prev) => ({ ...prev, avatar: newAvatar }));
        await updateProfile({ ...profileData, avatar: newAvatar });
        toast.success("Admin profile photo updated successfully! 📸");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim() || !profileData.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }

    setSavingProfile(true);
    await updateProfile(profileData);
    setSavingProfile(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Please fill in both current and new passwords");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setChangingPass(true);
    const success = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    setChangingPass(false);

    if (success) {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-white/5">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <User className="w-6 h-6 text-primary" /> Admin Profile & Security
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your administrator account credentials, personal email, avatar and password security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left Column: Admin Overview Badge Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-5 text-center shadow-sm">
            <div className="relative inline-block mx-auto group">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />
              <img
                src={
                  profileData.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                }
                alt="Admin Profile"
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary/20 shadow-xl mx-auto bg-slate-800"
              />

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all cursor-pointer backdrop-blur-xs"
                title="Click to change photo"
              >
                {uploadingAvatar ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <>
                    <Camera size={20} />
                    <span className="text-[10px] font-bold mt-1">Change</span>
                  </>
                )}
              </button>

              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#131926] flex items-center justify-center text-white" title="Active">
                <CheckCircle2 size={14} />
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                <span>{admin?.name || "Administrator"}</span>
                <BadgeCheck size={16} className="text-primary" />
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{admin?.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 capitalize">
                <ShieldCheck size={13} />
                <span>{admin?.role || "Super Admin"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-left text-xs space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">Active & Verified</span>
              </div>
              <div className="flex justify-between">
                <span>Access Level:</span>
                <span className="text-white font-semibold">Full System Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms (Profile details & Password Change) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Account Information */}
          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">General Account Details</h3>
                  <p className="text-[11px] text-slate-400">Update your administrator display name, email & avatar</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Login Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <ImageUpload
                  label="Profile Avatar (URL or Upload)"
                  value={profileData.avatar}
                  onChange={(url) => setProfileData({ ...profileData, avatar: url })}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Security & Change Password */}
          <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Change Security Password</h3>
                  <p className="text-[11px] text-slate-400">Keep your account secure with a strong password</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    required
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      placeholder="Min 6 characters"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {changingPass ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
