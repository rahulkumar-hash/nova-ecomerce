import React from "react";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export default function AdminTable({
  columns,
  data = [],
  loading = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  actions,
  pagination,
  emptyMessage = "No records found",
}) {
  return (
    <div className="rounded-2xl bg-[#131926] border border-white/8 overflow-hidden shadow-xl">
      {/* Header bar */}
      {(onSearchChange || actions) && (
        <div className="p-4 sm:p-5 border-b border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {onSearchChange && (
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">{actions}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-white/3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/6">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox size={32} className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-400">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row._id || rowIdx} className="hover:bg-white/2 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-5 py-4 ${col.className || ""}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="p-4 border-t border-white/6 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing page <strong className="text-white">{pagination.page}</strong> of{" "}
            <strong className="text-white">{pagination.pages || 1}</strong> ({pagination.total} items)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
