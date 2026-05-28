"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminInput from "@/components/admin/AdminInput";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import AdminPagination from "@/components/admin/AdminPagination";

export default function PlatformUsersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businesses, setBusinesses] = useState([]);
  const [links, setLinks] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const [form, setForm] = useState({
    user_id: "",
    business_id: "",
    role: "admin",
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
        toast.error("No platform admin access.");
        router.push("/admin");
        return;
      }

      await loadBusinesses();
      await loadLinks();
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

  function updateRoleFilter(value) {
    setRoleFilter(value);
    setPage(1);
  }

  async function loadBusinesses() {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    setBusinesses(data || []);
  }

  async function loadLinks() {
    const { data, error } = await supabase
      .from("business_users")
      .select(
        `
        *,
        businesses (
          name,
          slug
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }

    setLinks(data || []);
  }

  async function assignUser(e) {
    e.preventDefault();

    if (!form.user_id || !form.business_id || !form.role) {
      toast.error("User ID, business and role are required.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("business_users").insert({
        user_id: form.user_id,
        business_id: form.business_id,
        role: form.role,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("User assigned successfully");

      setForm({
        user_id: "",
        business_id: "",
        role: "admin",
      });

      loadLinks();
    } finally {
      setSaving(false);
    }
  }

  async function removeLink() {
    if (!removeTarget) return;

    try {
      setRemoving(true);

      const { error } = await supabase
        .from("business_users")
        .delete()
        .eq("id", removeTarget.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("User assignment removed");
      setRemoveTarget(null);
      loadLinks();
    } finally {
      setRemoving(false);
    }
  }

  function roleBadge(role) {
    if (role === "admin") return <AdminBadge variant="dark">Admin</AdminBadge>;
    if (role === "editor") return <AdminBadge variant="info">Editor</AdminBadge>;

    return <AdminBadge>{role || "Unknown"}</AdminBadge>;
  }

  const businessOptions = businesses.map((business) => ({
    label: business.name,
    value: business.id,
  }));

  const filteredLinks = useMemo(() => {
    let result = [...links];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((link) => {
        return (
          link.user_id?.toLowerCase().includes(query) ||
          link.businesses?.name?.toLowerCase().includes(query) ||
          link.businesses?.slug?.toLowerCase().includes(query)
        );
      });
    }

    if (roleFilter) {
      result = result.filter((link) => link.role === roleFilter);
    }

    return result;
  }, [links, search, roleFilter]);

  const paginatedLinks = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return filteredLinks.slice(start, end);
  }, [filteredLinks, page]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f5f7] p-6">
        <AdminLoader text="Loading business users..." />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-[#101820]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/platform-admin"
              className="text-sm font-bold text-[#d99a1e]"
            >
              ← Back to Platform Admin
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black text-[#1f5f8b]">
                Business Users
              </h1>

              <AdminBadge variant="dark">Platform</AdminBadge>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Assign users to client businesses and control their CMS role.
            </p>
          </div>

          <AdminButton variant="secondary" onClick={() => router.push("/admin")}>
            Business Admin
          </AdminButton>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <AdminCard>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
              Assignments
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              {links.length}
            </h2>

            <p className="mt-2 text-sm text-slate-500">User-business links</p>
          </AdminCard>

          <AdminCard>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
              Admins
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              {links.filter((link) => link.role === "admin").length}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Users with full CMS access
            </p>
          </AdminCard>

          <AdminCard>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
              Editors
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              {links.filter((link) => link.role === "editor").length}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Users with content access
            </p>
          </AdminCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <AdminCard>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">
                Assign User to Business
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Paste a Supabase Auth user ID, choose a business and assign a
                role.
              </p>
            </div>

            <form onSubmit={assignUser} className="space-y-4">
              <AdminInput
                required
                label="User ID"
                placeholder="Paste Supabase auth user ID"
                value={form.user_id}
                onChange={(e) =>
                  setForm({ ...form, user_id: e.target.value })
                }
              />

              <AdminSelect
                required
                label="Business"
                value={form.business_id}
                onChange={(e) =>
                  setForm({ ...form, business_id: e.target.value })
                }
                placeholder="Select business"
                options={businessOptions}
              />

              <AdminSelect
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={[
                  { label: "Admin", value: "admin" },
                  { label: "Editor", value: "editor" },
                ]}
              />

              <AdminButton
                type="submit"
                className="w-full bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
                disabled={saving}
              >
                {saving ? "Assigning User..." : "Assign User"}
              </AdminButton>
            </form>
          </AdminCard>

          <AdminCard>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">
                Current User Assignments
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                These users can access the client CMS for their linked business.
              </p>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_160px]">
              <AdminInput
                placeholder="Search user ID or business..."
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
              />

              <AdminSelect
                value={roleFilter}
                onChange={(e) => updateRoleFilter(e.target.value)}
                placeholder="All roles"
                options={[
                  { label: "Admin", value: "admin" },
                  { label: "Editor", value: "editor" },
                ]}
              />
            </div>

            {filteredLinks.length === 0 ? (
              <AdminEmptyState
                title="No assignments found"
                description="Try changing your search or assign a user to a business."
              />
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedLinks.map((link) => (
                    <div
                      key={link.id}
                      className="rounded-2xl bg-slate-100 p-5 transition hover:bg-slate-200/70"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-950">
                              {link.businesses?.name || "Unknown business"}
                            </h3>

                            {roleBadge(link.role)}
                          </div>

                          <p className="text-sm text-slate-600">
                            Slug: {link.businesses?.slug || "No slug"}
                          </p>

                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            User ID
                          </p>

                          <p className="mt-1 break-all rounded-xl bg-white p-3 text-xs text-slate-500">
                            {link.user_id}
                          </p>
                        </div>

                        <AdminButton
                          variant="danger"
                          onClick={() => setRemoveTarget(link)}
                        >
                          Remove
                        </AdminButton>
                      </div>
                    </div>
                  ))}
                </div>

                <AdminPagination
                  page={page}
                  totalItems={filteredLinks.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
              </>
            )}
          </AdminCard>
        </div>
      </section>

      <AdminConfirmDialog
        open={!!removeTarget}
        title="Remove user assignment?"
        description={`Are you sure you want to remove this user from ${
          removeTarget?.businesses?.name || "this business"
        }? They will lose access to that business CMS.`}
        confirmLabel="Remove"
        loading={removing}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={removeLink}
      />
    </main>
  );
}
