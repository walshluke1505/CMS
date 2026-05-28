"use client";

export default function AdminButton({
  children,
  type = "button",
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}) {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-300",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant] || variants.primary
      } ${className}`}
    >
      {children}
    </button>
  );
}