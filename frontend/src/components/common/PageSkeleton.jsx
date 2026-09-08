import React from "react";

export default function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page content">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-2xl w-48" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-72" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-slate-200/80 dark:bg-slate-800 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
