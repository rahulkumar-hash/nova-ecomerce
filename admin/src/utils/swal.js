import Swal from "sweetalert2";

// Common Dark Theme styling for SweetAlert2 in Admin
const AdminSwal = Swal.mixin({
  background: "#131926",
  color: "#f8fafc",
  backdrop: "rgba(3, 7, 18, 0.75)",
  customClass: {
    popup: "border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md",
    title: "text-base sm:text-lg font-black text-white tracking-tight",
    htmlContainer: "text-xs sm:text-sm text-slate-400 leading-relaxed",
    confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all cursor-pointer mx-1",
    cancelButton: "px-5 py-2.5 rounded-xl font-bold text-xs text-slate-300 bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer mx-1",
    denyButton: "px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer mx-1",
  },
  buttonsStyling: false,
});

/**
 * Mandatory Confirmation Dialog for Delete Actions
 * @param {string} title - Dialog title
 * @param {string} text - Detailed explanation
 * @param {string} confirmButtonText - Custom confirm button text
 * @returns {Promise<boolean>} - Resolves to true if user clicked Confirm
 */
export const confirmDelete = async (
  title = "Are you sure you want to delete this?",
  text = "This action is permanent and cannot be undone.",
  confirmButtonText = "Yes, Delete Permanently"
) => {
  const result = await AdminSwal.fire({
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

/**
 * General Action Confirmation Dialog
 */
export const confirmAction = async (
  title = "Confirm Action",
  text = "Are you sure you want to proceed with this action?",
  confirmButtonText = "Confirm",
  icon = "question"
) => {
  const result = await AdminSwal.fire({
    title,
    text,
    icon,
    iconColor: "#6366f1",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
    customClass: {
      popup: "border border-white/10 rounded-2xl shadow-2xl",
      title: "text-base font-bold text-white",
      htmlContainer: "text-xs text-slate-400",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer mx-1",
      cancelButton: "px-5 py-2.5 rounded-xl font-bold text-xs text-slate-300 bg-white/10 hover:bg-white/15 transition-all cursor-pointer mx-1",
    },
  });

  return result.isConfirmed;
};

export const showSuccessAlert = (title, text = "") => {
  return AdminSwal.fire({
    icon: "success",
    iconColor: "#10b981",
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
  });
};

export const showErrorAlert = (title, text = "") => {
  return AdminSwal.fire({
    icon: "error",
    iconColor: "#f43f5e",
    title,
    text,
    confirmButtonText: "Okay",
  });
};

export default AdminSwal;
