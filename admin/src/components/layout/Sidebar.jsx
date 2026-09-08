import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  TicketPercent,
  Image,
  Palette,
  Users,
  Star,
  Settings,
  FileText,
  User,
  ShieldCheck,
  X,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Building2,
  Mail,
  HelpCircle,
  FileSpreadsheet,
} from "lucide-react";
import { useAdminTheme } from "../../context/AdminThemeContext";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";

const menuItems = [
  {
    category: "Main",
    items: [
      { id: 1, label: "Dashboard", icon: LayoutDashboard, route: "/" },
    ],
  },
  {
    category: "Catalogue",
    items: [
      {
        id: 2,
        label: "Products",
        icon: Package,
        hasChildren: true,
        children: [
          { label: "All Products", route: "/products" },
          { label: "Add Product", route: "/products/new" },
        ],
      },
      { id: 3, label: "Categories", icon: Layers, route: "/categories" },
      { id: 4, label: "Product Reviews", icon: Star, route: "/reviews" },
      { id: 15, label: "Customer Q&A", icon: HelpCircle, route: "/questions" },
    ],
  },
  {
    category: "Sales & Orders",
    items: [
      { id: 5, label: "Orders Management", icon: ShoppingBag, route: "/orders" },
      { id: 16, label: "Sales & GST Reports", icon: FileSpreadsheet, route: "/reports" },
      { id: 6, label: "Coupons & Discounts", icon: TicketPercent, route: "/coupons" },
    ],
  },
  {
    category: "Storefront & CMS",
    items: [
      { id: 7, label: "Hero Banners & Sliders", icon: Image, route: "/banners" },
      { id: 8, label: "Dynamic Color Theme", icon: Palette, route: "/theme" },
      { id: 11, label: "Pages & Policies", icon: FileText, route: "/pages" },
      { id: 14, label: "Newsletter Subscribers", icon: Mail, route: "/subscribers" },
      { id: 13, label: "Warehouse & Invoices", icon: Building2, route: "/warehouse-invoice" },
      { id: 9, label: "Store Settings", icon: Settings, route: "/settings" },
    ],
  },
  {
    category: "Account & Users",
    items: [
      { id: 10, label: "Customers List", icon: Users, route: "/customers" },
      { id: 12, label: "Admin Profile & Security", icon: User, route: "/profile" },
    ],
  },
];

function MenuItem({ item, isActive, isChildActive, isOpen, onToggle, location }) {
  const Icon = item.icon;
  const highlighted = isActive || isChildActive;

  const handleClick = (e) => {
    if (item.hasChildren) {
      e.preventDefault();
      onToggle(item.id);
    }
  };

  return (
    <div>
      <Link
        to={item.hasChildren ? "#" : item.route || "#"}
        onClick={handleClick}
        className={`group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative
          ${
            highlighted
              ? "bg-white/10 text-white shadow-sm"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`}
      >
        {highlighted && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
        )}

        <span
          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all shrink-0
            ${highlighted ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}
          style={
            highlighted
              ? { backgroundColor: "var(--color-primary)", boxShadow: "0 0 12px -2px var(--color-primary)" }
              : { backgroundColor: "rgba(255, 255, 255, 0.04)" }
          }
        >
          <Icon size={15} strokeWidth={1.8} />
        </span>

        <span className="flex-1 leading-none">{item.label}</span>

        {item.hasChildren && (
          <ChevronDown
            size={13}
            className={`ml-auto transition-transform duration-200 text-slate-400 ${
              isOpen ? "rotate-180 text-white" : ""
            }`}
          />
        )}
      </Link>

      <AnimatePresence initial={false}>
        {isOpen && item.hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-1 pl-3.5 border-l border-white/10 space-y-0.5 pb-1">
              {item.children?.map((sub) => {
                const isSubActive = location.pathname === sub.route;
                return (
                  <Link
                    key={sub.route}
                    to={sub.route}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] transition-all duration-150
                      ${
                        isSubActive
                          ? "bg-white/10 text-white font-semibold"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors"
                      style={{
                        backgroundColor: isSubActive ? "var(--color-primary)" : "rgba(255,255,255,0.2)",
                      }}
                    />
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarContent({ onClose }) {
  const location = useLocation();
  const { settings } = useAdminTheme();
  const { admin } = useAdminAuthStore();

  const [openId, setOpenId] = useState(() => {
    for (const group of menuItems) {
      for (const item of group.items) {
        if (item.hasChildren) {
          const match = item.children?.some((c) => location.pathname === c.route);
          if (match) return item.id;
        }
      }
    }
    return 2; // Open products by default
  });

  const handleToggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <aside className="w-68 h-screen flex flex-col overflow-y-auto bg-[#0d111d] border-r border-white/8 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5 shrink-0">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              {settings?.storeName || "NovaStore"}
            </h1>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mx-5 h-px bg-white/6 mb-4 shrink-0" />

      {/* Navigation */}
      <nav className="flex-1 px-3.5 space-y-5 pb-6">
        {menuItems.map((group, index) => (
          <div key={index}>
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.16em] uppercase px-3 mb-1.5">
              {group.category}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.route && location.pathname === item.route && !item.hasChildren;
                const isChildActive =
                  item.hasChildren && item.children?.some((c) => location.pathname === c.route);

                return (
                  <MenuItem
                    key={item.id}
                    item={item}
                    isActive={isActive}
                    isChildActive={isChildActive}
                    isOpen={openId === item.id}
                    onToggle={handleToggle}
                    location={location}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin Mini Profile Footer */}
      <div className="p-2.5 mx-3 mb-2 rounded-xl bg-white/4 border border-white/6 flex items-center justify-between">
        <Link to="/profile" className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity">
          <img
            src={
              admin?.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            }
            alt="Admin"
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10 shrink-0 bg-slate-800"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">{admin?.name || "Admin"}</p>
            <p className="text-[10px] text-slate-400 capitalize truncate">{admin?.role || "Super Admin"}</p>
          </div>
        </Link>
      </div>

      {/* Live Storefront Footer Link */}
      <div className="p-3.5 mx-3 mb-4 rounded-xl bg-white/4 border border-white/6">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>View Live Storefront</span>
          </div>
          <ExternalLink size={13} className="text-slate-400" />
        </a>
      </div>
    </aside>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <div className="hidden lg:flex lg:shrink-0">
        <SidebarContent onClose={onClose} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 h-full z-50 lg:hidden"
            >
              <SidebarContent onClose={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
