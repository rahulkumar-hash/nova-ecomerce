import React, { useState, useEffect } from "react";
import AdminTable from "../../components/common/AdminTable";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";

export default function Userlist() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/admin/customers?page=" + page + "&limit=12&search=" + search);
      if (res.success) {
        setUsers(res.data.customers);
        setPagination({ total: res.data.total, pages: res.data.pages, page: res.data.page });
      }
    } catch (err) {
      toast.error(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleToggleStatus = async (id) => {
    try {
      await adminApi.patch("/admin/customers/" + id + "/toggle-status");
      toast.success("Customer status updated");
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to toggle status");
    }
  };

  const columns = [
    {
      header: "Customer",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64"}
            alt=""
            className="w-9 h-9 rounded-full object-cover bg-white/5"
          />
          <div>
            <p className="font-bold text-white">{row.name}</p>
            <p className="text-[11px] text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Phone",
      render: (row) => <span className="font-mono text-slate-300 text-xs">{row.phone || "N/A"}</span>,
    },
    {
      header: "Addresses",
      render: (row) => <span className="text-slate-400 text-xs">{row.addresses?.length || 0} saved</span>,
    },
    {
      header: "Joined",
      render: (row) => <span className="text-slate-400 text-xs">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: "Status",
      render: (row) => (
        <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold " + (row.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row._id)}
          className={"px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors " + (row.status === "active" ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400" : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400")}
        >
          {row.status === "active" ? "Block" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Registered Customers</h2>
        <p className="text-xs text-slate-400">View user directory and account status</p>
      </div>

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search customer by name, email..."
        pagination={{
          page: pagination.page || page,
          pages: pagination.pages,
          total: pagination.total,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
