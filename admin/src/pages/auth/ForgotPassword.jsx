import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminTheme } from "../../context/AdminThemeContext";
import adminApi from "../../services/adminApi";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  Server, 
  Zap, 
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const { settings } = useAdminTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your admin email");
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.post("/admin/forgot-password", { email });
      toast.success(res.message || "OTP sent to your admin email address");
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP. Please check email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error("Please fill all required fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.post("/admin/reset-password", { email, otp, newPassword });
      toast.success(res.message || "Password reset successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await adminApi.post("/admin/forgot-password", { email });
      toast.success(res.message || "OTP resent successfully");
      setResendTimer(60);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const storeName = settings?.storeName || "NovaStore";

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#070a14] text-slate-100 flex flex-col lg:flex-row relative font-sans selection:bg-indigo-500 selection:text-white">
      {/* Ambient Radial Glows */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ backgroundColor: "var(--color-primary, #6366f1)" }}
      />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none bg-cyan-600/15" />

      {/* LEFT SIDE: Visual Brand, Recovery Protocols & Status (Fixed 100vh, No Scroll) */}
      <div className="relative flex-1 lg:w-[54%] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/6 z-10 bg-linear-to-br from-[#0b1022]/85 via-[#070b17]/90 to-[#040711] overflow-hidden">
        {/* Dot Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top Header Row */}
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {settings?.logo ? (
              <img 
                src={settings.logo} 
                alt={storeName} 
                className="h-8 w-auto object-contain max-w-30" 
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/15"
                style={{ backgroundColor: "var(--color-primary, #6366f1)" }}
              >
                <Sparkles size={18} className="text-white" />
              </div>
            )}
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-tight">
                {storeName}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">
                Security & Recovery Vault
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="font-semibold text-indigo-400">Recovery Mode</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono">TLS Guard</span>
          </div>
        </div>

        {/* Center Recovery Pitch */}
        <div className="relative my-auto py-4 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold">
            <ShieldCheck size={13} className="text-indigo-400" />
            <span>Two-Factor Recovery Protocol</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.15]">
            Restore administrator access{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-sky-300 to-teal-300">
              securely & swiftly.
            </span>
          </h1>

          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            Time-sensitive cryptographic OTP verification guarantees zero unauthorized administrative lockouts or credential hijacking.
          </p>

          {/* Compact Security Checklist Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.035] border border-white/10 backdrop-blur-xl shadow-xl relative overflow-hidden space-y-2.5">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/6">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Zap size={13} className="text-amber-400" /> Automated Safety Guards
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Policy 2.4-A</span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={11} />
                </div>
                <span><strong>10-Minute TTL:</strong> OTP token automatically self-destructs after 10 minutes.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={11} />
                </div>
                <span><strong>Cryptographic Hashing:</strong> Password updated via bcrypt salted hashing.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={11} />
                </div>
                <span><strong>Session Invalidation:</strong> All active sessions revoked on password change.</span>
              </div>
            </div>
          </div>

          {/* Feature Badges Row */}
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/3 border border-white/6 font-medium">
              <CheckCircle2 size={12} className="text-emerald-400" /> Encrypted SMTP Mail
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/3 border border-white/6 font-medium">
              <CheckCircle2 size={12} className="text-emerald-400" /> Rate-Limited Verification
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/3 border border-white/6 font-medium">
              <CheckCircle2 size={12} className="text-emerald-400" /> Audit Logged
            </span>
          </div>
        </div>

        {/* Bottom Status Row */}
        <div className="relative pt-3 border-t border-white/6 flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Server size={12} className="text-indigo-400" />
            <span>Identity Vault • <strong className="text-emerald-400 font-medium">Verified Active</strong></span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Zero-Trust Authentication</span>
        </div>
      </div>

      {/* RIGHT SIDE: Compact Reset Form Console (Fixed 100vh, No Scroll) */}
      <div className="relative flex-1 lg:w-[46%] p-6 sm:p-8 lg:p-10 flex items-center justify-center z-10 bg-[#070b16]/95 backdrop-blur-2xl overflow-hidden">
        <div className="w-full max-w-sm space-y-4">
          {/* Header Title */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 mb-2 uppercase tracking-wider">
              <KeyRound size={11} className="text-indigo-400" />
              <span>Step {step} of 2: {step === 1 ? "Verify Identity" : "New Password"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {step === 1 ? "Reset Admin Access" : "Create New Password"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {step === 1
                ? "Enter your registered administrative email to receive a secure recovery OTP."
                : `Enter the 6-digit OTP code sent to your registered address.`}
            </p>
          </div>

          {/* Form Step 1: Send OTP */}
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Admin Email Address
                </label>
                <div className="relative group">
                  <Mail 
                    size={15} 
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" 
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ecomstore.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-3 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary, #6366f1) 0%, #4338ca 100%)",
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Recovery OTP</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form Step 2: Verify OTP & Enter New Password */
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="p-2.5 bg-white/3 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate mr-2 font-mono text-[11px]">{email}</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-indigo-400 font-bold hover:underline shrink-0 text-[11px] cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <div className="relative group">
                  <KeyRound 
                    size={15} 
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" 
                  />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs tracking-widest font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative group">
                  <Lock 
                    size={15} 
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" 
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock 
                    size={15} 
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" 
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="text-slate-400">Didn't receive code?</span>
                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleResend}
                  className="font-bold text-indigo-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary, #6366f1) 0%, #4338ca 100%)",
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Reset Password & Access</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Back to Sign In & Customer Storefront Link */}
          <div className="pt-3 border-t border-white/6 flex items-center justify-between text-[11px]">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Back to Sign In</span>
            </Link>

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition-colors"
            >
              <ShoppingBag size={12} />
              <span>Storefront</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
