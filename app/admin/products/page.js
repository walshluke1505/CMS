"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUserBusiness, canDelete, canEdit } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminInput from "@/components/admin/AdminInput";
import AdminTextarea from "@/components/admin/AdminTextarea";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import AdminPagination from "@/components/admin/AdminPagination";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [businessId, setBusinessId] = useState(null);
  const [businessSlug, setBusinessSlug] = useState("");
  const [role, setRole] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const emptyForm = {
    name: "",
    slug: "",
    category_id: "",
    category: "",
    code: "",
    description: "",
    image_url: "",
    pdf_url: "",
    meta_title: "",
    meta_description: "",
  };

  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async function loadData() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error) {
        toast.error("Unable to load business permissions.");
        return;
      }

      setBusinessId(result.business.id);
      setBusinessSlug(result.business.slug || "");
      setRole(result.role);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("business_id", result.business.id)
        .order("name", { ascending: true });

      if (categoriesError) {
        toast.error(categoriesError.message);
        return;
      }

      setCategories(categoriesData || []);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          `
          *,
          categories (
            id,
            name,
            slug
          )
        `
        )
        .eq("business_id", result.business.id)
        .order("created_at", { ascending: false });

      if (productsError) {
        toast.error(productsError.message);
        return;
      }

      setProducts(productsData || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function updateCategoryFilter(value) {
    setCategoryFilter(value);
    setPage(1);
  }

  function updateStatusFilter(value) {
    setStatusFilter(value);
    setPage(1);
  }

  function updateSortBy(value) {
    setSortBy(value);
    setPage(1);
  }

  function createSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleNameChange(e) {
    const name = e.target.value;

    setForm((prev) => ({
      ...prev,
      name,
      slug: createSlug(name),
      meta_title: prev.meta_title || name,
    }));
  }

  function handleCategoryChange(e) {
    const selectedCategoryId = e.target.value;
    const selectedCategory = categories.find(
      (category) => category.id === selectedCategoryId
    );

    setForm({
      ...form,
      category_id: selectedCategoryId,
      category: selectedCategory?.name || "",
    });
  }

  async function uploadFile(file, bucket, field) {
    if (!file) return;

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${businessId || "business"}-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        toast.error(error.message);
        return;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

      setForm((prev) => ({
        ...prev,
        [field]: data.publicUrl,
      }));

      toast.success("File uploaded successfully");
    } finally {
      setUploading(false);
    }
  }

  async function addProduct(e) {
    e.preventDefault();

    if (!canEdit(role)) {
      toast.error("You do not have permission to add products.");
      return;
    }

    if (!businessId) {
      toast.error("Business not loaded yet.");
      return;
    }

    if (!form.name || !form.slug) {
      toast.error("Product name and slug are required.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("products").insert({
        business_id: businessId,
        name: form.name,
        slug: form.slug,
        category_id: form.category_id || null,
        category: form.category,
        code: form.code,
        description: form.description,
        image_url: form.image_url,
        pdf_url: form.pdf_url,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        is_active: true,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Product added successfully");
      setForm(emptyForm);
      loadData();
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct() {
    if (!deleteTarget) return;

    if (!canDelete(role)) {
      toast.error("Only admins can delete products.");
      return;
    }

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("business_id", businessId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Product deleted");
      setDeleteTarget(null);
      loadData();
    } finally {
      setDeleting(false);
    }
  }

  async function toggleProductVisibility(product) {
    if (!canEdit(role)) {
      toast.error("You do not have permission to update products.");
      return;
    }

    if (!businessId) {
      toast.error("Business not loaded yet.");
      return;
    }

    const nextIsActive = !product.is_active;

    try {
      setVisibilityUpdatingId(product.id);

      const { error } = await supabase
        .from("products")
        .update({ is_active: nextIsActive })
        .eq("id", product.id)
        .eq("business_id", businessId);

      if (error) {
        toast.error(error.message);
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === product.id
            ? { ...currentProduct, is_active: nextIsActive }
            : currentProduct
        )
      );

      toast.success(
        nextIsActive ? "Product published" : "Product hidden from website"
      );
    } finally {
      setVisibilityUpdatingId(null);
    }
  }

  function cleanCsvValue(value) {
    if (value === null || value === undefined) return "";

    return `"${String(value).replace(/"/g, '""')}"`;
  }

  function exportProductsCsv() {
    if (filteredProducts.length === 0) {
      toast.error("No products to export.");
      return;
    }

    const headers = [
      "Product Name",
      "Slug",
      "Category",
      "Code",
      "Active Status",
      "Image URL",
      "PDF URL",
      "Created At",
    ];

    const rows = filteredProducts.map((product) => [
      product.name || "",
      product.slug || "",
      product.categories?.name || product.category || "",
      product.code || "",
      product.is_active ? "Active" : "Hidden",
      product.image_url || "",
      product.pdf_url || "",
      product.created_at
        ? new Date(product.created_at).toLocaleString()
        : "",
    ]);

    const csvContent = [
      headers.map(cleanCsvValue).join(","),
      ...rows.map((row) => row.map(cleanCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `products-${date}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("Products exported");
  }

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      label: category.name,
      value: category.id,
    }));
  }, [categories]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((product) => product.is_active).length,
      inactive: products.filter((product) => !product.is_active).length,
      withPdf: products.filter((product) => product.pdf_url).length,
    };
  }, [products]);

  const filteredProducts = (() => {
    let result = [...products];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((product) => {
        const categoryName = product.categories?.name || product.category || "";

        return (
          product.name?.toLowerCase().includes(query) ||
          product.code?.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query) ||
          product.slug?.toLowerCase().includes(query) ||
          product.meta_title?.toLowerCase().includes(query)
        );
      });
    }

    if (categoryFilter) {
      result = result.filter((product) => product.category_id === categoryFilter);
    }

    if (statusFilter === "active") {
      result = result.filter((product) => product.is_active);
    }

    if (statusFilter === "inactive") {
      result = result.filter((product) => !product.is_active);
    }

    if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    if (sortBy === "category") {
      result.sort((a, b) => {
        const categoryA = a.categories?.name || a.category || "";
        const categoryB = b.categories?.name || b.category || "";

        return categoryA.localeCompare(categoryB);
      });
    }

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  })();

  const paginatedProducts = (() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  })();

  return (
    <AdminLayout
      title="Manage Products"
      subtitle={`Add, edit and manage products. Role: ${role || "loading..."}`}
    >
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatBox label="Total Products" value={stats.total} />
        <StatBox label="Active" value={stats.active} />
        <StatBox label="Inactive" value={stats.inactive} />
        <StatBox label="With PDFs" value={stats.withPdf} />
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        {canEdit(role) && (
          <AdminCard>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">
                Add Product
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add catalogue products with images, datasheets and SEO details.
              </p>
            </div>

            <form onSubmit={addProduct} className="space-y-4">
              <AdminInput
                required
                label="Product Name"
                placeholder="e.g. Aluminium Conductor"
                value={form.name}
                onChange={handleNameChange}
              />

              <AdminInput
                required
                label="Slug"
                placeholder="e.g. aluminium-conductor"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />

              <AdminSelect
                label="Category"
                value={form.category_id}
                onChange={handleCategoryChange}
                placeholder={
                  categories.length === 0
                    ? "No categories yet"
                    : "Select category"
                }
                options={categoryOptions}
              />

              <AdminInput
                label="Product Code"
                placeholder="e.g. CUAL-001"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />

              <AdminTextarea
                label="Description"
                rows={5}
                placeholder="Describe this product..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <UploadField
                label="Product Image"
                accept="image/*"
                uploading={uploading}
                previewUrl={form.image_url}
                onChange={(file) =>
                  uploadFile(file, "product-images", "image_url")
                }
              />

              <UploadField
                label="Product PDF / Datasheet"
                accept=".pdf"
                uploading={uploading}
                fileUrl={form.pdf_url}
                onChange={(file) => uploadFile(file, "product-pdfs", "pdf_url")}
              />

              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-xl font-black text-slate-950">
                  Product SEO
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Optional browser title and Google description.
                </p>
              </div>

              <AdminInput
                label="Meta Title"
                placeholder="e.g. Aluminium Conductor Supplier"
                value={form.meta_title}
                onChange={(e) =>
                  setForm({ ...form, meta_title: e.target.value })
                }
              />

              <AdminTextarea
                label="Meta Description"
                rows={4}
                placeholder="Short description shown in search results..."
                value={form.meta_description}
                onChange={(e) =>
                  setForm({ ...form, meta_description: e.target.value })
                }
              />

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs text-slate-500">
                  /products/{form.slug || "product-slug"}
                </p>

                <h4 className="mt-2 text-base font-bold text-blue-700">
                  {form.meta_title || form.name || "Product meta title"}
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {form.meta_description ||
                    form.description ||
                    "Product meta description preview..."}
                </p>
              </div>

              <AdminButton
                type="submit"
                className="w-full bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
                disabled={saving || uploading}
              >
                {saving ? "Adding Product..." : "Add Product"}
              </AdminButton>
            </form>
          </AdminCard>
        )}

        <AdminCard>
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Current Products
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Manage catalogue items for this business.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <AdminBadge variant="info">
                {filteredProducts.length} shown
              </AdminBadge>

              {businessSlug && (
                <Link
                  href={`/${businessSlug}/products`}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  View Catalogue
                </Link>
              )}

              <AdminButton
                type="button"
                variant="secondary"
                onClick={exportProductsCsv}
              >
                Export CSV
              </AdminButton>
            </div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_170px_150px_150px]">
            <AdminInput
              placeholder="Search products..."
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
            />

            <AdminSelect
              value={categoryFilter}
              onChange={(e) => updateCategoryFilter(e.target.value)}
              placeholder="All categories"
              options={categoryOptions}
            />

            <AdminSelect
              value={statusFilter}
              onChange={(e) => updateStatusFilter(e.target.value)}
              placeholder="All statuses"
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />

            <AdminSelect
              value={sortBy}
              onChange={(e) => updateSortBy(e.target.value)}
              placeholder="Sort by"
              options={[
                { label: "Newest", value: "newest" },
                { label: "Name", value: "name" },
                { label: "Category", value: "category" },
              ]}
            />
          </div>

          {loading ? (
            <AdminLoader text="Loading products..." />
          ) : filteredProducts.length === 0 ? (
            <AdminEmptyState
              title="No products found"
              description="Try changing your filters or create your first product to start building the catalogue."
            />
          ) : (
            <>
              <div className="space-y-4">
                {paginatedProducts.map((product) => {
                  const displayCategory =
                    product.categories?.name ||
                    product.category ||
                    "No category";

                  return (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="h-24 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-20 sm:w-20">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-black text-slate-950">
                              {product.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              {displayCategory} · {product.code || "No code"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              /products/{product.slug}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              {product.is_active ? (
                                <AdminBadge variant="success">Active</AdminBadge>
                              ) : (
                                <AdminBadge variant="warning">
                                  Inactive
                                </AdminBadge>
                              )}

                              {product.category_id ? (
                                <AdminBadge variant="info">
                                  Linked category
                                </AdminBadge>
                              ) : (
                                <AdminBadge variant="warning">
                                  Text category
                                </AdminBadge>
                              )}

                              {product.meta_title && (
                                <AdminBadge variant="info">SEO</AdminBadge>
                              )}

                              {product.pdf_url && (
                                <AdminBadge variant="info">
                                  PDF attached
                                </AdminBadge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                          {canEdit(role) && (
                            <>
                              <AdminButton
                                variant={
                                  product.is_active ? "secondary" : "primary"
                                }
                                className="w-full sm:w-auto"
                                disabled={visibilityUpdatingId === product.id}
                                onClick={() => toggleProductVisibility(product)}
                              >
                                {visibilityUpdatingId === product.id
                                  ? "Updating..."
                                  : product.is_active
                                    ? "Hide"
                                    : "Publish"}
                              </AdminButton>

                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1f5f8b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#174b70] sm:w-auto"
                              >
                                Edit
                              </Link>
                            </>
                          )}

                          {canDelete(role) && (
                            <AdminButton
                              variant="danger"
                              className="w-full sm:w-auto"
                              onClick={() => setDeleteTarget(product)}
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

              <AdminPagination
                page={page}
                totalItems={filteredProducts.length}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </AdminCard>
      </div>

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete product?"
        description={`Are you sure you want to delete ${
          deleteTarget?.name || "this product"
        }? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteProduct}
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

function UploadField({ label, accept, uploading, previewUrl, fileUrl, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      <input
        type="file"
        accept={accept}
        className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
        onChange={(e) => onChange(e.target.files[0])}
      />

      {uploading && <p className="mt-2 text-sm text-slate-500">Uploading...</p>}

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Uploaded product"
          className="mt-4 h-36 w-full rounded-2xl object-cover"
        />
      )}

      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          className="mt-3 block text-sm font-bold text-[#1f5f8b]"
        >
          View Uploaded PDF
        </a>
      )}
    </div>
  );
}
