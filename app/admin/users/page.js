"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUserBusiness, canManageSettings } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [business, setBusiness] = useState(null);
  const [users, setUsers] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error) {
        toast.error("Unable to load business users.");
        return;
      }

      setRole(result.role);
      setBusiness(result.business);

      if (!canManageSettings(result.role)) {
        setAccessDenied(true);
        return;
      }

      const { data, error } = await supabase
        .from("business_users")
        .select("id, user_id, business_id, role, created_at")
        .eq("business_id", result.business.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
        return;
      }

      setUsers(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function roleBadge(userRole) {
    if (userRole === "admin") return <AdminBadge variant="dark">Admin</AdminBadge>;
    if (userRole === "editor") return <AdminBadge variant="info">Editor</AdminBadge>;

    return <AdminBadge>{userRole || "Unknown"}</AdminBadge>;
  }

  if (loading) {
    return (
      <AdminLayout title="Business Users" subtitle="Loading users...">
        <AdminLoader text="Loading business users..." />
      </AdminLayout>
    );
  }

  if (accessDenied) {
    return (
      <AdminLayout title="Business Users" subtitle={`Role: ${role || "unknown"}`}>
        <AdminCard>
          <h2 className="text-2xl font-black text-slate-950">
            Admin access required
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            User assignments are visible to business admins only. Platform admin
            manages adding and removing users.
          </p>
        </AdminCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Business Users"
      subtitle={`Users linked to ${business?.name || "this business"}.`}
    >
      <div className="mb-8 rounded-3xl bg-[#101820] p-6 text-white">
        <h2 className="text-2xl font-black">User access overview</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          This page shows who is linked to the business CMS. User assignment is
          managed by platform admin to keep access controlled and secure.
        </p>
      </div>

      <AdminCard>
        {users.length === 0 ? (
          <AdminEmptyState
            title="No users linked"
            description="Platform admin can assign users to this business from the platform users page."
          />
        ) : (
          <div className="space-y-4">
            {users.map((userLink) => (
              <div
                key={userLink.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950">User ID</h3>
                      {roleBadge(userLink.role)}
                    </div>

                    <p className="break-all rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-600">
                      {userLink.user_id}
                    </p>
                  </div>

                  <div className="text-sm text-slate-500 md:text-right">
                    <p className="font-bold text-slate-700">Linked</p>
                    <p className="mt-1">
                      {userLink.created_at
                        ? new Date(userLink.created_at).toLocaleString()
                        : "Unknown date"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
