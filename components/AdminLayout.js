"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserBusiness, canManageSettings } from "@/lib/auth";

export default function AdminLayout({ children, title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState(null);

  useEffect(() => {
    async function loadRole() {
      const result = await getUserBusiness();

      if (!result.error) {
        setRole(result.role);
      }
    }

    loadRole();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Enquiries", href: "/admin/enquiries" },
];

  if (canManageSettings(role)) {
    navItems.push({ label: "Website", href: "/admin/website" });
    navItems.push({ label: "Settings", href: "/admin/settings" });
    navItems.push({ label: "Users", href: "/admin/users" });
  }

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-[#101820]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-black text-[#1f5f8b]">
              Platform CMS
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
              Client Admin Portal
            </p>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
            {navItems.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition hover:text-[#1f5f8b] ${
                    active ? "text-[#1f5f8b]" : ""
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="rounded-full bg-[#101820] px-5 py-2.5 text-sm font-bold text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-[#1f5f8b]">{title}</h2>
          {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
        </div>

        {children}
      </section>
    </main>
  );
}
