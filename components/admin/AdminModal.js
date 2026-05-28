"use client";

import AdminButton from "./AdminButton";

export default function AdminModal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

              {description && (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              ✕
            </button>
          </div>
        </div>

        {children && <div className="px-6 py-5">{children}</div>}

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          {footer || (
            <AdminButton variant="secondary" onClick={onClose}>
              Close
            </AdminButton>
          )}
        </div>
      </div>
    </div>
  );
}