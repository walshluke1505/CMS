import Link from "next/link";
import AdminButton from "./AdminButton";

export default function AdminEmptyState({
  title = "Nothing here yet",
  description = "Once data is added, it will appear here.",
  actionLabel,
  actionHref,
  onAction,
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
        —
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>

      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>

      {actionLabel && actionHref && (
        <div className="mt-5">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {actionLabel}
          </Link>
        </div>
      )}

      {actionLabel && onAction && !actionHref && (
        <div className="mt-5">
          <AdminButton onClick={onAction}>{actionLabel}</AdminButton>
        </div>
      )}
    </div>
  );
}
