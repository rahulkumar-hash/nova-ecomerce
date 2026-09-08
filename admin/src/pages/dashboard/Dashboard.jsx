import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Truck,
  CheckCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import adminApi from "../../services/adminApi";
import { useAdminTheme } from "../../context/AdminThemeContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const { settings } = useAdminTheme();
  const [stats, setStats] = useState(null);
  const [lowStockList, setLowStockList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [statsRes, stockRes] = await Promise.all([
          adminApi.get("/admin/dashboard-stats"),
          adminApi.get("/products/admin/low-stock?threshold=5").catch(() => null),
        ]);
        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (stockRes?.success && Array.isArray(stockRes.data)) {
          setLowStockList(stockRes.data);
        } else if (statsRes.data?.lowStockProducts) {
          setLowStockList(statsRes.data.lowStockProducts);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const symbol = settings?.currency?.symbol || "₹";

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Overview Dashboard</h2>
          <p className="text-xs text-slate-400">
            Real-time sales, order fulfillment status, and inventory metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/products/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:scale-105"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Plus size={15} />
            <span>Add New Product</span>
          </Link>
          <Link
            to="/orders"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/8 hover:bg-white/12 text-slate-200 border border-white/10 transition-all"
          >
            <ShoppingBag size={15} />
            <span>View Orders</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`${symbol}${stats?.totalRevenue?.toLocaleString() || "0"}`}
          icon={DollarSign}
          trend={14.2}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || "0"}
          icon={ShoppingBag}
          trend={8.7}
        />
        <StatCard
          title="Active Products"
          value={stats?.totalProducts || "0"}
          icon={Package}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || "0"}
          icon={Users}
          trend={12.5}
        />
      </div>

      {/* Order Status Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[11px] text-amber-300 font-medium">Pending Orders</p>
            <p className="text-lg font-bold text-white font-mono">{stats?.orderStats?.pending || 0}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <Package size={18} />
          </div>
          <div>
            <p className="text-[11px] text-blue-300 font-medium">In Processing</p>
            <p className="text-lg font-bold text-white font-mono">{stats?.orderStats?.processing || 0}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <Truck size={18} />
          </div>
          <div>
            <p className="text-[11px] text-purple-300 font-medium">Shipped / In Transit</p>
            <p className="text-lg font-bold text-white font-mono">{stats?.orderStats?.shipped || 0}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[11px] text-emerald-300 font-medium">Delivered</p>
            <p className="text-lg font-bold text-white font-mono">{stats?.orderStats?.delivered || 0}</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analytics Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#131926] border border-white/8 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Revenue Performance</h3>
              <p className="text-[11px] text-slate-400">Monthly gross sales trends</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              <span className="text-xs text-slate-300">Revenue ({symbol})</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Volume Chart */}
        <div className="rounded-2xl bg-[#131926] border border-white/8 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Orders Volume</h3>
              <p className="text-[11px] text-slate-400">Order counts by month</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData || []}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="orders" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl bg-[#131926] border border-white/8 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 border-b border-white/6 uppercase">
                <tr>
                  <th className="pb-3 font-semibold">Order</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recentOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No orders placed yet
                    </td>
                  </tr>
                ) : (
                  stats?.recentOrders?.map((ord) => (
                    <tr key={ord._id} className="hover:bg-white/2">
                      <td className="py-3 font-mono font-bold text-white">{ord.orderNumber}</td>
                      <td className="py-3 text-slate-300">{ord.customerInfo?.name || "Customer"}</td>
                      <td className="py-3 font-mono text-emerald-400">
                        {symbol}{ord.totalAmount?.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.orderStatus === "Delivered"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : ord.orderStatus === "Cancelled"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/orders/${ord._id}`}
                          className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl bg-[#131926] border border-white/8 p-5 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">Low Stock Watchlist</h3>
            </div>
            {lowStockList.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {lowStockList.length} items &lt; 5
              </span>
            )}
          </div>

          <div className="space-y-3">
            {lowStockList.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">All inventory levels healthy (≥ 5 units)</p>
            ) : (
              lowStockList.map((prod) => (
                <Link
                  to={`/products/edit/${prod._id}`}
                  key={prod._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 transition-all group"
                  title="Click to restock product"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={prod.thumbnail?.url || prod.thumbnail || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64"}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover bg-white/5"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-indigo-400 truncate max-w-[130px] transition-colors">
                        {prod.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {symbol}{prod.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-mono block">
                      {prod.stock} left
                    </span>
                    <span className="text-[10px] text-indigo-400 hover:underline mt-0.5 block">
                      Restock ↗
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
