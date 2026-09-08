import React from "react";
import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 text-primary">
        <Compass className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">404 - Page Not Found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25"
      >
        Go to Homepage <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
