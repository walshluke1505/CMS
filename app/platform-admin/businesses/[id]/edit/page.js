"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { supabase } from "@/lib/supabase";

import AdminCard from "@/components/admin/AdminCard";
import AdminInput from "@/components/admin/AdminInput";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminButton from "@/components/admin/AdminButton";
import AdminLoader from "@/components/admin/AdminLoader";

export default function EditBusinessPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    domain: "",
    contact_email: "",
    phone: "",
    address: "",
    primary_color: "#1f5f8b",
    accent_color: "#f2a900",
    plan: "starter",
    status: "active",
    monthly_fee: 0,
  });

  async function loadBusiness() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data) {
        toast.error("Business not found");
        router.push("/platform-admin");
        return;
      }

      setForm({
        name: data.name || "",
        slug: data.slug || "",
        domain: data.domain || "",
        contact_email: data.contact_email || "",
        phone: data.phone || "",
        address: data.address || "",
        primary_color: data.primary_color || "#1f5f8b",
        accent_color: data.accent_color || "#f2a900",
        plan: data.plan || "starter",
        status: data.status || "active",
        monthly_fee: data.monthly_fee || 0,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, []);

  async function saveBusiness(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const { error } = await supabase
        .from("businesses")
        .update({
          name: form.name,
          slug: form.slug,
          domain: form.domain,
          contact_email: form.contact_email,
          phone: form.phone,
          address: form.address,
          primary_color: form.primary_color,
          accent_color: form.accent_color,
          plan: form.plan,
          status: form.status,
          monthly_fee: Number(form.monthly_fee || 0),
        })
        .eq("id", businessId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Business updated");
      router.push("/platform-admin");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f5f7] p-6">
        <AdminLoader text="Loading business..." />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f5f7] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => router.push("/platform-admin")}
            className="text-sm font-bold text-[#d99a1e]"
          >
            ← Back to Platform Admin
          </button>
        </div>

        <AdminCard>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-950">
              Edit Business
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Manage branding, contact details, plan and tenant status.
            </p>
          </div>

          <form onSubmit={saveBusiness} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                label="Business Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <AdminInput
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />

              <AdminInput
                label="Domain"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              />

              <AdminInput
                label="Contact Email"
                value={form.contact_email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contact_email: e.target.value,
                  })
                }
              />

              <AdminInput
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <AdminInput
                label="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <AdminSelect
                label="Plan"
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                options={[
                  { label: "Starter", value: "starter" },
                  { label: "Business", value: "business" },
                  { label: "Enterprise", value: "enterprise" },
                ]}
              />

              <AdminSelect
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Suspended", value: "suspended" },
                ]}
              />

              <AdminInput
                label="Monthly Fee"
                type="number"
                min="0"
                step="0.01"
                value={form.monthly_fee}
                onChange={(e) =>
                  setForm({
                    ...form,
                    monthly_fee: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <ColourField
                label="Primary Colour"
                value={form.primary_color}
                onChange={(value) =>
                  setForm({
                    ...form,
                    primary_color: value,
                  })
                }
              />

              <ColourField
                label="Accent Colour"
                value={form.accent_color}
                onChange={(value) =>
                  setForm({
                    ...form,
                    accent_color: value,
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-3 pt-4 md:flex-row">
              <AdminButton
                type="submit"
                className="w-full bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Business"}
              </AdminButton>

              <button
                type="button"
                onClick={() => router.push("/platform-admin")}
                className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </AdminCard>
      </div>
    </main>
  );
}

function ColourField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      <div className="flex items-center gap-3">
        <input
          type="color"
          className="h-12 w-16 rounded-xl border border-slate-300"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <AdminInput value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
