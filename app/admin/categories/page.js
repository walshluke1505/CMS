"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUserBusiness, canDelete, canEdit } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminInput from "@/components/admin/AdminInput";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import AdminModal from "@/components/admin/AdminModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [role, setRole] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
  });

  async function loadData() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error) {
        toast.error("Unable to load permissions.");
        return;
      }

      setBusinessId(result.business.id);
      setRole(result.role);

      const { data, error } = await supabase
        .from("categories")
        .select(
          `
          *,
          products (
            id
          )
        `
        )
        .eq("business_id", result.business.id)
        .order("name", { ascending: true });

      if (error) {
        toast.error(error.message);
        return;
      }

      setCategories(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function createSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleNameChange(e) {
    const name = e.target.value;

    setForm({
      name,
      slug: createSlug(name),
    });
  }

  function openEdit(category) {
    setEditTarget(category);
    setEditForm({
      name: category.name || "",
      slug: category.slug || "",
    });
  }

  function handleEditNameChange(e) {
    const name = e.target.value;

    setEditForm({
      name,
      slug: createSlug(name),
    });
  }

  async function addCategory(e) {
    e.preventDefault();

    if (!canEdit(role)) {
      toast.error("You do not have permission to add categories.");
      return;
    }

    if (!businessId) {
      toast.error("Business not loaded yet.");
      return;
    }

    if (!form.name || !form.slug) {
      toast.error("Category name and slug are required.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("categories").insert({
        business_id: businessId,
        name: form.name,
        slug: form.slug,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Category added successfully");

      setForm({
        name: "",
        slug: "",
      });

      loadData();
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(e) {
    e.preventDefault();

    if (!editTarget) return;

    if (!canEdit(role)) {
      toast.error("You do not have permission to edit categories.");
      return;
    }

    if (!editForm.name || !editForm.slug) {
      toast.error("Category name and slug are required.");
      return;
    }

    try {
      setUpdating(true);

      const { error } = await supabase
        .from("categories")
        .update({
          name: editForm.name,
          slug: editForm.slug,
        })
        .eq("id", editTarget.id)
        .eq("business_id", businessId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Category updated successfully");
      setEditTarget(null);
      loadData();
    } finally {
      setUpdating(false);
    }
  }

  async function deleteCategory() {
    if (!deleteTarget) return;

    if (!canDelete(role)) {
      toast.error("Only admins can delete categories.");
      return;
    }

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("business_id", businessId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Category deleted");
      setDeleteTarget(null);
      loadData();
    } finally {
      setDeleting(false);
    }
  }

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;

    const query = search.toLowerCase();

    return categories.filter((category) => {
      return (
        category.name?.toLowerCase().includes(query) ||
        category.slug?.toLowerCase().includes(query)
      );
    });
  }, [categories, search]);

  const stats = useMemo(() => {
    const linkedProducts = categories.reduce((total, category) => {
      return total + (category.products?.length || 0);
    }, 0);

    return {
      total: categories.length,
      linkedProducts,
      empty: categories.filter((category) => !category.products?.length).length,
    };
  }, [categories]);

  return (
    <AdminLayout
      title="Manage Categories"
      subtitle={`Create and organise product categories. Role: ${
        role || "loading..."
      }`}
    >
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatBox label="Categories" value={stats.total} />
        <StatBox label="Linked Products" value={stats.linkedProducts} />
        <StatBox label="Empty Categories" value={stats.empty} />
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        {canEdit(role) && (
          <AdminCard>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">
                Add Category
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Categories help organise products on the public catalogue.
              </p>
            </div>

            <form onSubmit={addCategory} className="space-y-4">
              <AdminInput
                required
                label="Category Name"
                placeholder="e.g. Conductors"
                value={form.name}
                onChange={handleNameChange}
              />

              <AdminInput
                required
                label="Slug"
                placeholder="e.g. conductors"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Public Category Path
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  /products?category={form.slug || "category-slug"}
                </p>
              </div>

              <AdminButton
                type="submit"
                className="w-full bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
                disabled={saving}
              >
                {saving ? "Adding Category..." : "Add Category"}
              </AdminButton>
            </form>
          </AdminCard>
        )}

        <AdminCard>
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Current Categories
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Manage the categories connected to this business.
              </p>
            </div>

            <AdminBadge variant="info">
              {filteredCategories.length} shown
            </AdminBadge>
          </div>

          <div className="mb-5">
            <AdminInput
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <AdminLoader text="Loading categories..." />
          ) : filteredCategories.length === 0 ? (
            <AdminEmptyState
              title="No categories found"
              description="Try changing your search or add your first category."
            />
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category) => {
                const productCount = category.products?.length || 0;

                return (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950">
                            {category.name}
                          </h3>

                          <AdminBadge variant="info">Category</AdminBadge>

                          {productCount > 0 ? (
                            <AdminBadge variant="success">
                              {productCount} product
                              {productCount === 1 ? "" : "s"}
                            </AdminBadge>
                          ) : (
                            <AdminBadge variant="warning">Empty</AdminBadge>
                          )}
                        </div>

                        <p className="text-sm text-slate-600">
                          Slug: {category.slug}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Used for filtering products on the public catalogue.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {canEdit(role) && (
                          <AdminButton
                            variant="secondary"
                            onClick={() => openEdit(category)}
                          >
                            Edit
                          </AdminButton>
                        )}

                        {canDelete(role) && (
                          <AdminButton
                            variant="danger"
                            onClick={() => setDeleteTarget(category)}
                          >
                            Delete
                          </AdminButton>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminCard>
      </div>

      <AdminModal
        open={!!editTarget}
        title="Edit category"
        description="Update the category name and slug."
        onClose={() => setEditTarget(null)}
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => setEditTarget(null)}
              disabled={updating}
            >
              Cancel
            </AdminButton>

            <AdminButton
              onClick={updateCategory}
              disabled={updating}
              className="bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
            >
              {updating ? "Saving..." : "Save Category"}
            </AdminButton>
          </>
        }
      >
        <form onSubmit={updateCategory} className="space-y-4">
          <AdminInput
            required
            label="Category Name"
            value={editForm.name}
            onChange={handleEditNameChange}
          />

          <AdminInput
            required
            label="Slug"
            value={editForm.slug}
            onChange={(e) =>
              setEditForm({ ...editForm, slug: e.target.value })
            }
          />
        </form>
      </AdminModal>

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete category?"
        description={`Are you sure you want to delete ${
          deleteTarget?.name || "this category"
        }? Products using this category may keep their old category text, but the category link can be affected.`}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteCategory}
      />
    </AdminLayout>
  );
}

function StatBox({ label, value }) {
  return (
    <AdminCard>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
        {label}
      </p>

      <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
    </AdminCard>
  );
}
