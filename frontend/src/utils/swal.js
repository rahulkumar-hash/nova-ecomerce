import Swal from "sweetalert2";

// Responsive SweetAlert2 configuration for frontend
const FrontendSwal = Swal.mixin({
  customClass: {
    popup: "rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6",
    title: "text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight",
    htmlContainer: "text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed",
    confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all cursor-pointer mx-1.5",
    cancelButton: "px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer mx-1.5",
  },
  buttonsStyling: false,
});

export const confirmDelete = async (
  title = "Are you sure?",
  text = "This action cannot be undone.",
  confirmButtonText = "Yes, Delete"
) => {
  const result = await FrontendSwal.fire({
    title,
    text,
    icon: "warning",
    iconColor: "#f43f5e",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
};

export const confirmAction = async (
  title = "Confirm Action",
  text = "Are you sure you want to proceed?",
  confirmButtonText = "Confirm",
  icon = "question"
) => {
  const result = await FrontendSwal.fire({
    title,
    text,
    icon,
    iconColor: "#6366f1",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
    customClass: {
      popup: "rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6",
      title: "text-base font-bold text-slate-900 dark:text-white",
      htmlContainer: "text-xs text-slate-600 dark:text-slate-400",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer mx-1.5",
      cancelButton: "px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer mx-1.5",
    },
  });

  return result.isConfirmed;
};

export const showSuccessAlert = (title, text = "") => {
  return FrontendSwal.fire({
    icon: "success",
    iconColor: "#10b981",
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
  });
};

export const showErrorAlert = (title, text = "") => {
  return FrontendSwal.fire({
    icon: "error",
    iconColor: "#f43f5e",
    title,
    text,
    confirmButtonText: "Okay",
  });
};

export default FrontendSwal;
