"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUserBusiness, canEdit } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminInput from "@/components/admin/AdminInput";
import AdminTextarea from "@/components/admin/AdminTextarea";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [businessSlug, setBusinessSlug] = useState("");
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category_id: "",
    category: "",
    code: "",
    description: "",
    image_url: "",
    pdf_url: "",
    is_active: true,
    meta_title: "",
    meta_description: "",
    og_image_url: "",
  });

  async function initialise() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error || !canEdit(result.role)) {
        setAllowed(false);
        return;
      }

      setAllowed(true);
      setBusinessId(result.business.id);
      setBusinessSlug(result.business.slug);

      await loadCategories(result.business.id);
      const productLoaded = await loadProduct(result.business.id);

      if (!productLoaded) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories(currentBusinessId) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("business_id", currentBusinessId)
      .order("name", { ascending: true });

    if (error) {
      toast.error(error.message);
      return false;
    }

    if (!data) {
      return false;
    }

    setCategories(data || []);
  }

  async function loadProduct(currentBusinessId) {
    const { data, error } = await supabase
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
      .eq("id", productId)
      .eq("business_id", currentBusinessId)
      .maybeSingle();

    if (error) {
      toast.error(error.message);
      return;
    }

    setForm({
      name: data.name || "",
      slug: data.slug || "",
      category_id: data.category_id || "",
      category: data.categories?.name || data.category || "",
      code: data.code || "",
      description: data.description || "",
      image_url: data.image_url || "",
      pdf_url: data.pdf_url || "",
      is_active: data.is_active ?? true,
      meta_title: data.meta_title || "",
      meta_description: data.meta_description || "",
      og_image_url: data.og_image_url || "",
    });

    return true;
  }

  useEffect(() => {
    initialise();
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

  async function updateProduct(e) {
    e.preventDefault();

    if (!allowed) {
      toast.error("You do not have permission to edit products.");
      return;
    }

    if (!form.name || !form.slug) {
      toast.error("Product name and slug are required.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          slug: form.slug,
          category_id: form.category_id || null,
          category: form.category,
          code: form.code,
          description: form.description,
          image_url: form.image_url,
          pdf_url: form.pdf_url,
          is_active: form.is_active,
          meta_title: form.meta_title,
          meta_description: form.meta_description,
          og_image_url: form.og_image_url,
        })
        .eq("id", productId)
        .eq("business_id", businessId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Product updated successfully");
      router.push("/admin/products");
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      label: category.name,
      value: category.id,
    }));
  }, [categories]);

  if (loading) {
    return (
      <AdminLayout title="Edit Product" subtitle="Loading product...">
        <AdminLoader text="Loading product..." />
      </AdminLayout>
    );
  }

  if (!allowed) {
    return (
      <AdminLayout title="Access Denied" subtitle="You cannot edit products.">
        <AdminCard>
          <h2 className="text-2xl font-black text-slate-950">
            Permission Required
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your account does not have permission to edit products.
          </p>

          <Link
            href="/admin/products"
            className="mt-6 inline-block font-bold text-[#d99a1e]"
          >
            ← Back to Products
          </Link>
        </AdminCard>
      </AdminLayout>
    );
  }

  if (notFound) {
    return (
      <AdminLayout
        title="Product Not Found"
        subtitle="This product could not be loaded for the current business."
      >
        <AdminCard>
          <h2 className="text-2xl font-black text-slate-950">
            Product unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            The product may have been deleted, or it may belong to another
            business.
          </p>

          <Link
            href="/admin/products"
            className="mt-6 inline-block font-bold text-[#d99a1e]"
          >
            ← Back to Products
          </Link>
        </AdminCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Edit Product"
      subtitle="Update product details, images, PDFs, active status and SEO."
    >
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard>
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <Link
                href="/admin/products"
                className="text-sm font-bold text-[#d99a1e]"
              >
                ← Back to Products
              </Link>

              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Product Details
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Edit the product information used on the public catalogue.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.is_active ? (
                <AdminBadge variant="success">Active</AdminBadge>
              ) : (
                <AdminBadge variant="warning">Inactive</AdminBadge>
              )}

              {form.category_id ? (
                <AdminBadge variant="info">Linked Category</AdminBadge>
              ) : (
                <AdminBadge variant="warning">Text Category</AdminBadge>
              )}

              {form.pdf_url && <AdminBadge variant="info">PDF</AdminBadge>}
            </div>
          </div>

          <form onSubmit={updateProduct} className="space-y-5">
            <AdminInput
              required
              label="Product Name"
              value={form.name}
              onChange={handleNameChange}
            />

            <AdminInput
              required
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />

            <div className="grid gap-5 md:grid-cols-2">
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
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>

            {!form.category_id && form.category && (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                This product currently has an old text category:{" "}
                <span className="font-bold">{form.category}</span>. Select a
                CMS category above to link it properly.
              </div>
            )}

            <AdminTextarea
              label="Description"
              rows={6}
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
              onRemove={() => setForm({ ...form, image_url: "" })}
            />

            <UploadField
              label="Product PDF / Datasheet"
              accept=".pdf"
              uploading={uploading}
              fileUrl={form.pdf_url}
              onChange={(file) => uploadFile(file, "product-pdfs", "pdf_url")}
              onRemove={() => setForm({ ...form, pdf_url: "" })}
            />

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-2xl font-black text-slate-950">
                Product SEO
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Control the browser title and Google description for this
                product page.
              </p>
            </div>

            <AdminInput
              label="Meta Title"
              value={form.meta_title}
              onChange={(e) =>
                setForm({ ...form, meta_title: e.target.value })
              }
            />

            <AdminTextarea
              label="Meta Description"
              rows={4}
              value={form.meta_description}
              onChange={(e) =>
                setForm({ ...form, meta_description: e.target.value })
              }
            />

            <UploadField
              label="Social Sharing Image"
              accept="image/*"
              uploading={uploading}
              previewUrl={form.og_image_url}
              description="Used when this product is shared on WhatsApp, Facebook or LinkedIn."
              onChange={(file) =>
                uploadFile(file, "product-images", "og_image_url")
              }
              onRemove={() => setForm({ ...form, og_image_url: "" })}
            />

            <label className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              Product is active
            </label>

            <div className="flex flex-col gap-3 pt-2 md:flex-row">
              <AdminButton
                type="submit"
                className="w-full bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
                disabled={saving || uploading}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </AdminButton>

              <AdminButton
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => router.push("/admin/products")}
                disabled={saving}
              >
                Cancel
              </AdminButton>
            </div>
          </form>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard>
            <h2 className="text-2xl font-black text-slate-950">
              Product Preview
            </h2>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="h-56 bg-slate-100">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt={form.name || "Product preview"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                    No image uploaded
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  {form.is_active ? (
                    <AdminBadge variant="success">Active</AdminBadge>
                  ) : (
                    <AdminBadge variant="warning">Inactive</AdminBadge>
                  )}

                  {form.category_id ? (
                    <AdminBadge variant="info">Linked category</AdminBadge>
                  ) : (
                    <AdminBadge variant="warning">Text category</AdminBadge>
                  )}

                  {form.pdf_url && (
                    <AdminBadge variant="info">PDF attached</AdminBadge>
                  )}
                </div>

                <h3 className="text-xl font-black text-slate-950">
                  {form.name || "Product Name"}
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  {form.category || "No category"} · {form.code || "No code"}
                </p>

                <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
                  {form.description || "No description added yet."}
                </p>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-xl font-black text-slate-950">SEO Preview</h2>

            <div className="mt-4 rounded-xl bg-slate-100 p-4">
              <p className="text-xs text-slate-500">
                /products/{form.slug || "product-slug"}
              </p>

              <h3 className="mt-2 text-lg font-bold text-blue-700">
                {form.meta_title || form.name || "Product meta title"}
              </h3>

              {form.og_image_url && (
                <img
                  src={form.og_image_url}
                  alt="OG preview"
                  className="my-4 h-40 w-full rounded-xl object-cover"
                />
              )}

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {form.meta_description ||
                  form.description ||
                  "Product meta description preview..."}
              </p>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-xl font-black text-slate-950">Public URL</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This is where the product appears on the public website.
            </p>

            <div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm font-semibold text-slate-700">
              /{businessSlug || "business"}/products/
              {form.slug || "product-slug"}
            </div>

            {businessSlug && form.slug && (
              <a
                href={`/${businessSlug}/products/${form.slug}`}
                target="_blank"
                className="mt-4 inline-block rounded-xl bg-[#1f5f8b] px-5 py-3 text-sm font-bold text-white"
              >
                View Public Product
              </a>
            )}
          </AdminCard>
        </div>
      </div>
    </AdminLayout>
  );
}

function UploadField({
  label,
  accept,
  uploading,
  previewUrl,
  fileUrl,
  description,
  onChange,
  onRemove,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      {description && (
        <p className="mb-3 text-sm leading-6 text-slate-600">{description}</p>
      )}

      <input
        type="file"
        accept={accept}
        className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
        onChange={(e) => onChange(e.target.files[0])}
      />

      {uploading && <p className="mt-2 text-sm text-slate-500">Uploading...</p>}

      {previewUrl && (
        <div className="mt-4">
          <img
            src={previewUrl}
            alt={label}
            className="h-44 w-full rounded-2xl object-cover"
          />

          <button
            type="button"
            onClick={onRemove}
            className="mt-3 text-sm font-bold text-red-600"
          >
            Remove image
          </button>
        </div>
      )}

      {fileUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a
            href={fileUrl}
            target="_blank"
            className="text-sm font-bold text-[#1f5f8b]"
          >
            View Uploaded PDF
          </a>

          <button
            type="button"
            onClick={onRemove}
            className="text-sm font-bold text-red-600"
          >
            Remove PDF
          </button>
        </div>
      )}
    </div>
  );
}
