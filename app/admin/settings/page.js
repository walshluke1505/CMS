"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUserBusiness, canManageSettings } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminInput from "@/components/admin/AdminInput";
import AdminTextarea from "@/components/admin/AdminTextarea";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";

export default function AdminSettingsPage() {
  const router = useRouter();

  const [business, setBusiness] = useState(null);
  const [role, setRole] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    contact_email: "",
    phone: "",
    address: "",
    domain: "",
    logo_url: "",
    primary_color: "#101820",
    accent_color: "#f2a900",
  });

  async function loadBusiness() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error) {
        toast.error("Unable to load settings.");
        return;
      }

      if (!canManageSettings(result.role)) {
        toast.error("You do not have permission to access settings.");
        router.replace("/admin");
        return;
      }

      setRole(result.role);
      setBusiness(result.business);

      setForm({
        name: result.business.name || "",
        slug: result.business.slug || "",
        contact_email: result.business.contact_email || "",
        phone: result.business.phone || "",
        address: result.business.address || "",
        domain: result.business.domain || "",
        logo_url: result.business.logo_url || "",
        primary_color: result.business.primary_color || "#101820",
        accent_color: result.business.accent_color || "#f2a900",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, []);

  async function uploadLogo(file) {
    if (!file) return;

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${business?.id || "business"}-logo-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("business-logos")
        .upload(fileName, file);

      if (error) {
        toast.error(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("business-logos")
        .getPublicUrl(fileName);

      setForm((prev) => ({
        ...prev,
        logo_url: data.publicUrl,
      }));

      toast.success("Logo uploaded successfully");
    } finally {
      setUploading(false);
    }
  }

  async function saveSettings(e) {
    e.preventDefault();

    if (!business?.id) {
      toast.error("Business not loaded yet.");
      return;
    }

    if (!form.name || !form.slug) {
      toast.error("Business name and slug are required.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("businesses")
        .update({
          name: form.name,
          slug: form.slug,
          contact_email: form.contact_email,
          phone: form.phone,
          address: form.address,
          domain: form.domain,
          logo_url: form.logo_url,
          primary_color: form.primary_color,
          accent_color: form.accent_color,
        })
        .eq("id", business.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Settings updated successfully");
      loadBusiness();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Business Settings" subtitle="Loading settings...">
        <AdminLoader text="Loading business settings..." />
      </AdminLayout>
    );
  }

  if (!business) {
    return (
      <AdminLayout title="Business Settings" subtitle="Unable to load business.">
        <AdminCard>
          <p className="text-sm text-slate-600">
            Business settings could not be loaded.
          </p>
        </AdminCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Business Settings" subtitle={`Role: ${role}`}>
      <div className="mb-8 flex flex-col gap-3 rounded-3xl bg-[#101820] p-6 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Business profile</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Keep the client identity, public website URL and contact details up
            to date.
          </p>
        </div>

        <a
          href={`/${form.slug || business.slug}`}
          target="_blank"
          className="inline-flex items-center justify-center rounded-xl bg-[#f2a900] px-5 py-3 text-sm font-bold text-slate-950"
        >
          View Public Site
        </a>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard>
          <form onSubmit={saveSettings} className="space-y-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Business Details
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  These details are used across the public website and enquiry
                  system.
                </p>
              </div>

              <AdminBadge variant="info">{role}</AdminBadge>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                required
                label="Business Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <AdminInput
                required
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />

              <AdminInput
                type="email"
                label="Contact Email"
                value={form.contact_email}
                onChange={(e) =>
                  setForm({ ...form, contact_email: e.target.value })
                }
              />

              <AdminInput
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <AdminInput
                label="Website Domain"
                placeholder="example.co.za"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              />
            </div>

            <AdminTextarea
              label="Address"
              rows={4}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-2xl font-black text-slate-950">Branding</h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Upload the business logo and control brand colours for the
                public website.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Logo Upload
              </label>

              <input
                type="file"
                accept="image/*"
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
                onChange={(e) => uploadLogo(e.target.files[0])}
              />

              {uploading && (
                <p className="mt-2 text-sm text-slate-500">Uploading...</p>
              )}

              {form.logo_url && (
                <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-100 p-4">
                  <img
                    src={form.logo_url}
                    alt="Business logo"
                    className="h-20 max-w-[180px] rounded-xl bg-white object-contain p-3"
                  />

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Logo uploaded
                    </p>
                    <p className="text-xs text-slate-500">
                      This logo can be used on the public website and admin
                      branding.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Primary Color
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-12 w-16 cursor-pointer rounded-xl border border-slate-300 bg-white"
                    value={form.primary_color}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        primary_color: e.target.value,
                      })
                    }
                  />

                  <AdminInput
                    value={form.primary_color}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        primary_color: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Accent Color
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-12 w-16 cursor-pointer rounded-xl border border-slate-300 bg-white"
                    value={form.accent_color}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        accent_color: e.target.value,
                      })
                    }
                  />

                  <AdminInput
                    value={form.accent_color}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        accent_color: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <AdminButton
              type="submit"
              className="w-full bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
              disabled={saving || uploading}
            >
              {saving ? "Saving Settings..." : "Save Settings"}
            </AdminButton>
          </form>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard>
            <h2 className="text-2xl font-black text-slate-950">
              Brand Preview
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Preview how this business identity may appear across the platform.
            </p>

            <div
              className="mt-6 overflow-hidden rounded-2xl border border-slate-200"
              style={{ backgroundColor: form.primary_color }}
            >
              <div className="p-6 text-white">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Business logo preview"
                    className="mb-5 h-16 max-w-[180px] rounded-xl bg-white object-contain p-3"
                  />
                ) : (
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-xl font-black">
                    {form.name?.charAt(0) || "B"}
                  </div>
                )}

                <h3 className="text-2xl font-black">
                  {form.name || "Business Name"}
                </h3>

                <p className="mt-2 text-sm opacity-80">
                  {form.contact_email || "contact@example.com"}
                </p>
              </div>

              <div className="bg-white p-5">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm font-bold"
                  style={{
                    backgroundColor: form.accent_color,
                    color: "#101820",
                  }}
                >
                  Sample Button
                </button>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-xl font-black text-slate-950">
              Public Website
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Customers can access this business website using the platform
              slug. Use the domain field if this client also has a custom
              domain.
            </p>

            <div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm font-semibold text-slate-700">
              /{form.slug || "business-slug"}
            </div>

            {form.domain && (
              <div className="mt-3 rounded-xl bg-slate-100 p-4 text-sm font-semibold text-slate-700">
                {form.domain}
              </div>
            )}

            <a
              href={`/${form.slug || business.slug}`}
              target="_blank"
              className="mt-5 inline-flex rounded-xl bg-[#1f5f8b] px-5 py-3 text-sm font-bold text-white"
            >
              Open Public Site
            </a>
          </AdminCard>
        </div>
      </div>
    </AdminLayout>
  );
}
