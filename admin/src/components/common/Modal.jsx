import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full ${sizeClasses[size]} rounded-3xl bg-[#141a29] border border-white/10 shadow-2xl overflow-hidden z-10 my-8`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-white/2">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
