"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminInput from "@/components/admin/AdminInput";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPagination from "@/components/admin/AdminPagination";

export default function PlatformAdminPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [businesses, setBusinesses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    domain: "",
    primary_color: "#1f5f8b",
    accent_color: "#f2a900",
  });

  async function initialise() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/admin/login");
        return;
      }

      setUser(session.user);

      const { data: adminRecord, error } = await supabase
        .from("platform_admins")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        router.push("/admin");
        return;
      }

      if (!adminRecord) {
        toast.error("You do not have access to the platform admin area.");
        router.push("/admin");
        return;
      }

      setIsPlatformAdmin(true);
      await loadBusinesses();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialise();
  }, []);

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  async function loadBusinesses() {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }

    setBusinesses(data || []);
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

    setForm({
      ...form,
      name,
      slug: createSlug(name),
    });
  }

  async function addBusiness(e) {
    e.preventDefault();

    if (!form.name || !form.slug) {
      toast.error("Business name and slug are required.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("businesses").insert({
        name: form.name,
        slug: form.slug,
        domain: form.domain,
        primary_color: form.primary_color,
        accent_color: form.accent_color,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Business added successfully");

      setForm({
        name: "",
        slug: "",
        domain: "",
        primary_color: "#1f5f8b",
        accent_color: "#f2a900",
      });

      loadBusinesses();
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const filteredBusinesses = useMemo(() => {
    if (!search.trim()) return businesses;

    const query = search.toLowerCase();

    return businesses.filter((business) => {
      return (
        business.name?.toLowerCase().includes(query) ||
        business.slug?.toLowerCase().includes(query) ||
        business.domain?.toLowerCase().includes(query)
      );
    });
  }, [businesses, search]);

  const paginatedBusinesses = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return filteredBusinesses.slice(start, end);
  }, [filteredBusinesses, page]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f5f7] p-6">
        <AdminLoader text="Loading platform admin..." />
      </main>
    );
  }

  if (!user || !isPlatformAdmin) return null;

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-[#101820]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black text-[#1f5f8b]">
                Platform Admin
              </h1>

              <AdminBadge variant="dark">Owner</AdminBadge>
            </div>

            <p className="mt-1 text-sm text-slate-600">
              SaaS control centre · {user.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/platform-admin/users"
              className="inline-flex items-center justify-center rounded-xl bg-[#1f5f8b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#174b70]"
            >
              Manage Users
            </Link>

            <AdminButton
              variant="secondary"
              onClick={() => router.push("/admin")}
            >
              Business Admin
            </AdminButton>

            <AdminButton variant="danger" onClick={logout}>
              Logout
            </AdminButton>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <AdminCard>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
              Businesses
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              {businesses.length}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Active tenants on the platform
            </p>
          </AdminCard>

          <AdminCard>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
              Domains
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              {businesses.filter((business) => business.domain).length}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Businesses with domains set
            </p>
          </AdminCard>

          <AdminCard>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
              Platform Status
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">Live</h2>

            <p className="mt-2 text-sm text-slate-500">
              Multi-tenant CMS running
            </p>
          </AdminCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <AdminCard>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">
                Add Business
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create a new client/business inside your CMS platform.
              </p>
            </div>

            <form onSubmit={addBusiness} className="space-y-4">
              <AdminInput
                required
                label="Business Name"
                placeholder="e.g. Archies Mobiles"
                value={form.name}
                onChange={handleNameChange}
              />

              <AdminInput
                required
                label="Business Slug"
                placeholder="e.g. archies-mobiles"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />

              <AdminInput
                label="Domain"
                placeholder="e.g. archiesmobiles.co.za"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-800">
                    Primary Colour
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
                    Accent Colour
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
                disabled={saving}
              >
                {saving ? "Adding Business..." : "Add Business"}
              </AdminButton>
            </form>
          </AdminCard>

          <AdminCard>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Businesses
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  All clients currently registered on the platform.
                </p>
              </div>

              <div className="w-full md:w-72">
                <AdminInput
                  placeholder="Search businesses..."
                  value={search}
                  onChange={(e) => updateSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredBusinesses.length === 0 ? (
              <AdminEmptyState
                title="No businesses found"
                description="Try changing your search or add your first business."
              />
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedBusinesses.map((business) => (
                    <div
                      key={business.id}
                      className="rounded-2xl bg-slate-100 p-5 transition hover:bg-slate-200/70"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black text-slate-950">
                              {business.name}
                            </h3>

                            <AdminBadge variant="info">Tenant</AdminBadge>

                              <AdminBadge variant={business.status === "active" ? "success" : "danger"}>
                                {business.status || "active"}
                              </AdminBadge>

                              <AdminBadge variant="dark">
                                {business.plan || "starter"}
                              </AdminBadge>
                          </div>

                          <p className="text-sm text-slate-600">
                            Slug: {business.slug}
                          </p>

                          <p className="text-sm text-slate-600">
                            Domain: {business.domain || "No domain set"}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            Monthly Fee: R {Number(business.monthly_fee || 0).toLocaleString("en-ZA")}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Link
                            href={`/platform-admin/businesses/${business.id}/edit`}
                            className="rounded-xl bg-[#1f5f8b] px-4 py-2 text-sm font-bold text-white"
                          >
                            Edit
                          </Link>

                          <div
                            className="h-9 w-9 rounded-full border border-slate-300"
                            style={{
                              backgroundColor:
                                business.primary_color || "#1f5f8b",
                            }}
                          />

                          <div
                            className="h-9 w-9 rounded-full border border-slate-300"
                            style={{
                              backgroundColor:
                                business.accent_color || "#f2a900",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <AdminPagination
                  page={page}
                  totalItems={filteredBusinesses.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
              </>
            )}
          </AdminCard>
        </div>
      </section>
    </main>
  );
}
