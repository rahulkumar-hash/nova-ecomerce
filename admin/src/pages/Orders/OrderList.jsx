import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download, Calendar, FileSpreadsheet, RotateCcw } from "lucide-react";
import AdminTable from "../../components/common/AdminTable";
import Modal from "../../components/common/Modal";
import adminApi from "../../services/adminApi";
import { useAdminTheme } from "../../context/AdminThemeContext";
import toast from "react-hot-toast";

const STATUS_TABS = ["all", "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Returns", "Cancelled"];

export default function OrderList() {
  const { settings } = useAdminTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [pendingReturnsCount, setPendingReturnsCount] = useState(0);

  // Export CSV State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportStatus, setExportStatus] = useState("all");
  const [exporting, setExporting] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    orderStatus: "",
    carrier: "",
    trackingNumber: "",
    paymentStatus: "",
    note: "",
  });

  const symbol = settings?.currency?.symbol || "₹";

  const handleExportCsv = async (e) => {
    e.preventDefault();
    try {
      setExporting(true);
      const token = localStorage.getItem("adminToken") || "";
      const baseURL = import.meta.env.VITE_API_URL || "/api/v1";
      const params = new URLSearchParams();
      if (exportStartDate) params.append("startDate", exportStartDate);
      if (exportEndDate) params.append("endDate", exportEndDate);
      if (exportStatus && exportStatus !== "all") params.append("status", exportStatus);

      const downloadUrl = `${baseURL}/orders/admin/export/csv?${params.toString()}`;
      const res = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error("Failed to generate CSV export");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders-gst-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Orders & GST report downloaded successfully! 📊");
      setExportModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/orders/admin/all?page=" + page + "&limit=12&status=" + status + "&search=" + search);
      if (res.success) {
        setOrders(res.data.orders);
        setPagination({ total: res.data.total, pages: res.data.pages, page: res.data.page });
        if (res.data.pendingReturnsCount !== undefined) {
          setPendingReturnsCount(res.data.pendingReturnsCount);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status, search]);

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusForm({
      orderStatus: order.orderStatus,
      carrier: order.tracking?.carrier || "BlueDart Express",
      trackingNumber: order.tracking?.trackingNumber || "",
      paymentStatus: order.paymentInfo?.status || "Pending",
      note: "",
    });
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await adminApi.patch("/orders/admin/" + selectedOrder._id + "/status", statusForm);
      toast.success("Order status updated!");
      setStatusModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to update order status");
    }
  };

  const columns = [
    {
      header: "Order & Date",
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-white text-xs block">{row.orderNumber}</span>
          <span className="text-[11px] text-slate-400">{new Date(row.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: "Customer",
      render: (row) => (
        <div>
          <p className="font-semibold text-white leading-tight">{row.customerInfo?.name || "Customer"}</p>
          <p className="text-[11px] text-slate-400">{row.customerInfo?.phone || row.customerInfo?.email}</p>
        </div>
      ),
    },
    {
      header: "Items",
      render: (row) => (
        <span className="text-xs text-slate-300 font-medium">
          {row.items?.length} {row.items?.length === 1 ? "Item" : "Items"}
        </span>
      ),
    },
    {
      header: "Total",
      render: (row) => (
        <span className="font-mono font-bold text-emerald-400">
          {symbol}{row.totalAmount?.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Payment",
      render: (row) => (
        <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold " + (row.paymentInfo?.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400")}>
          {row.paymentInfo?.method} ({row.paymentInfo?.status})
        </span>
      ),
    },
    {
      header: "Fulfillment & Returns",
      render: (row) => {
        const retStatus = row.returnRequest?.status;
        const hasReturn = retStatus && retStatus !== "None";

        return (
          <div className="flex flex-col gap-1.5 items-start">
            {hasReturn && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm ${
                  retStatus === "Requested"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                    : retStatus === "Approved"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : retStatus === "Refunded" || retStatus === "Refund Processed"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
                title={`Return: ${retStatus} (${row.returnRequest?.reason || "Doorstep Return"})`}
              >
                <RotateCcw size={10} />
                <span>Return: {retStatus}</span>
              </span>
            )}

            <button
              onClick={() => handleOpenStatusModal(row)}
              className={
                "px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer " +
                (row.orderStatus === "Delivered"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                  : row.orderStatus === "Cancelled"
                  ? "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                  : row.orderStatus === "Returned"
                  ? "bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20"
                  : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20")
              }
            >
              {row.orderStatus} ✎
            </button>
          </div>
        );
      },
    },
    {
      header: "Action",
      className: "text-right",
      render: (row) => (
        <Link
          to={"/orders/" + row._id}
          className="p-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
        >
          Details
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Orders Fulfillment</h2>
          <p className="text-xs text-slate-400">Process incoming customer orders and delivery updates</p>
        </div>

        {/* Feature 6: Export Orders & GST CSV + Link to full Reports */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/reports"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>Tax & GST Reports</span>
          </Link>

          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 border border-emerald-500 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatus(tab);
              setPage(1);
            }}
            className={
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer " +
              (status === tab
                ? "bg-white/15 text-white shadow"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200")
            }
          >
            {tab === "all" ? (
              "All Orders"
            ) : tab === "Returns" ? (
              <span className="flex items-center gap-1.5">
                <span>Returns</span>
                {pendingReturnsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black leading-none">
                    {pendingReturnsCount}
                  </span>
                )}
              </span>
            ) : (
              tab
            )}
          </button>
        ))}
      </div>

      <AdminTable
        columns={columns}
        data={orders}
        loading={loading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search order number, customer name, phone..."
        pagination={{
          page: pagination.page || page,
          pages: pagination.pages,
          total: pagination.total,
          onPageChange: setPage,
        }}
      />

      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={"Update Order: " + (selectedOrder?.orderNumber || "")}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          {selectedOrder?.returnRequest?.status && selectedOrder.returnRequest.status !== "None" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <RotateCcw size={13} />
                  <span>Doorstep Return: {selectedOrder.returnRequest.status}</span>
                </span>
                <Link
                  to={`/orders/${selectedOrder._id}`}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                >
                  Resolve in Details ➔
                </Link>
              </div>
              <p className="text-slate-300 text-[11px]">
                Reason: <strong>{selectedOrder.returnRequest.reason}</strong>
                {selectedOrder.returnRequest.comment && ` • "${selectedOrder.returnRequest.comment}"`}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Order Status</label>
            <select
              value={statusForm.orderStatus}
              onChange={(e) => setStatusForm({ ...statusForm, orderStatus: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#1a2336] border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Returned">Returned</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Courier Carrier</label>
              <input
                type="text"
                value={statusForm.carrier}
                onChange={(e) => setStatusForm({ ...statusForm, carrier: e.target.value })}
                placeholder="BlueDart / Delhivery"
                className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tracking Number</label>
              <input
                type="text"
                value={statusForm.trackingNumber}
                onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                placeholder="TRK-982348"
                className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Status</label>
            <select
              value={statusForm.paymentStatus}
              onChange={(e) => setStatusForm({ ...statusForm, paymentStatus: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#1a2336] border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-white/8">
            <button type="button" onClick={() => setStatusModalOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg" style={{ backgroundColor: "var(--color-primary)" }}>
              Save Update
            </button>
          </div>
        </form>
      </Modal>

      {/* Feature 6: Export CSV Date Filter Modal */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Orders & GST Tax Report (CSV)"
      >
        <form onSubmit={handleExportCsv} className="space-y-4 text-xs">
          <p className="text-slate-400">
            Generate an Excel-ready spreadsheet of sales with full GST breakdown, order milestones, customer details, and payment statuses.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Start Date (Optional)</label>
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Filter by Order Status</label>
            <select
              value={exportStatus}
              onChange={(e) => setExportStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a2336] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Orders</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px]">
            ⚡ Includes Order Number, Customer Name, Phone, Email, City, State, Subtotal, Discount, Shipping, 5% GST Breakdown, Grand Total, and AWB Tracking.
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-white/8">
            <button
              type="button"
              onClick={() => setExportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={exporting}
              className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download size={14} />
              <span>{exporting ? "Streaming CSV..." : "Download CSV Report"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
