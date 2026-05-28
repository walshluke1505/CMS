"use client";

import AdminButton from "./AdminButton";
import AdminModal from "./AdminModal";

export default function AdminConfirmDialog({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <AdminModal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      footer={
        <>
          <AdminButton variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </AdminButton>

          <AdminButton variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Processing..." : confirmLabel}
          </AdminButton>
        </>
      }
    />
  );
}