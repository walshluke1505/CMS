"use client";

import AdminButton from "./AdminButton";

export default function AdminPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-500">
        Showing <span className="font-bold text-slate-800">{startItem}</span>–
        <span className="font-bold text-slate-800">{endItem}</span> of{" "}
        <span className="font-bold text-slate-800">{totalItems}</span>
      </p>

      <div className="flex items-center gap-2">
        <AdminButton
          variant="secondary"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </AdminButton>

        <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
          Page {page} of {totalPages}
        </span>

        <AdminButton
          variant="secondary"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </AdminButton>
      </div>
    </div>
  );
}