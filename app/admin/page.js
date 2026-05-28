"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserBusiness, canManageSettings } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

function formatCurrency(value) {
  return `R ${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [role, setRole] = useState(null);
  const [setupError, setSetupError] = useState(null);
  const [websiteContent, setWebsiteContent] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);

  const [stats, setStats] = useState({
    products: 0,
    activeProducts: 0,
    categories: 0,
    enquiries: 0,
    enquiriesThisMonth: 0,
    newEnquiries: 0,
    quotedEnquiries: 0,
    wonEnquiries: 0,
    quoteValue: 0,
  });

  const [recentEnquiries, setRecentEnquiries] = useState([]);

  async function getCount(table, businessId, extraFilter) {
    let query = supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId);

    if (extraFilter) {
      query = extraFilter(query);
    }

    const { count } = await query;

    return count || 0;
  }

  async function loadDashboardData(businessId) {
    const productCount = await getCount("products", businessId);

    const activeProductCount = await getCount("products", businessId, (query) =>
      query.eq("is_active", true)
    );

    const categoryCount = await getCount("categories", businessId);

    const enquiryCount = await getCount("enquiries", businessId);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const enquiriesThisMonth = await getCount("enquiries", businessId, (query) =>
      query.gte("created_at", monthStart.toISOString())
    );

    const newEnquiryCount = await getCount("enquiries", businessId, (query) =>
      query.eq("status", "new")
    );

    const quotedEnquiryCount = await getCount("enquiries", businessId, (query) =>
      query.eq("status", "quoted")
    );

    const wonEnquiryCount = await getCount("enquiries", businessId, (query) =>
      query.eq("status", "won")
    );

    const { data: enquiries } = await supabase
      .from("enquiries")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: quoteRows } = await supabase
      .from("enquiries")
      .select("quote_total")
      .eq("business_id", businessId)
      .not("quote_total", "is", null);

    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, is_active, created_at, image_url")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(4);

    const { data: content } = await supabase
      .from("business_content")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();

    setStats({
      products: productCount,
      activeProducts: activeProductCount,
      categories: categoryCount,
      enquiries: enquiryCount,
      enquiriesThisMonth,
      newEnquiries: newEnquiryCount,
      quotedEnquiries: quotedEnquiryCount,
      wonEnquiries: wonEnquiryCount,
      quoteValue: (quoteRows || []).reduce(
        (total, enquiry) => total + Number(enquiry.quote_total || 0),
        0
      ),
    });

    setRecentEnquiries(enquiries || []);
    setRecentProducts(products || []);
    setWebsiteContent(content || null);
  }

  async function initialise() {
    const result = await getUserBusiness();

    if (result.error === "not_logged_in") {
      router.replace("/admin/login");
      return;
    }

    if (result.error === "no_business_linked") {
      setUser(result.user);
      setSetupError("no_business_linked");
      setLoading(false);
      return;
    }

    setUser(result.user);
    setBusiness(result.business);
    setRole(result.role);

    await loadDashboardData(result.business.id);

    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      initialise();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function getStatusBadge(status) {
    if (status === "new") return <AdminBadge variant="info">New</AdminBadge>;
    if (status === "contacted")
      return <AdminBadge variant="warning">Contacted</AdminBadge>;
    if (status === "quoted")
      return <AdminBadge variant="warning">Quoted</AdminBadge>;
    if (status === "won") return <AdminBadge variant="success">Won</AdminBadge>;
    if (status === "lost") return <AdminBadge variant="danger">Lost</AdminBadge>;

    return <AdminBadge>{status || "Unknown"}</AdminBadge>;
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  const websiteLayout =
    websiteContent?.website_layout || websiteContent?.website_theme || "industrial";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f5f7] p-6">
        <AdminLoader text="Loading dashboard..." />
      </main>
    );
  }

  if (setupError === "no_business_linked") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f5f7] px-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-black text-[#1f5f8b]">
            No Business Linked
          </h1>

          <p className="mt-4 text-slate-600">
            This user account is not linked to a business yet.
          </p>

          <p className="mt-4 text-sm font-semibold text-slate-500">User ID:</p>

          <p className="mt-2 break-all rounded-xl bg-slate-100 p-3 text-xs text-slate-500">
            {user?.id}
          </p>

          <AdminButton onClick={logout} className="mt-6">
            Logout
          </AdminButton>
        </div>
      </main>
    );
  }

  return (
    <AdminLayout
      title={`${business?.name || "Business"} Dashboard`}
      subtitle={`Logged in as ${user?.email} · Role: ${role}`}
    >
      <section className="mb-8 overflow-hidden rounded-3xl bg-[#101820] p-6 text-white shadow-xl md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-[#f2a900]">
              Business Overview
            </p>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Welcome back, {business?.name || "Business"}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Your website is live. Manage the catalogue, respond to enquiries
              and keep the public site looking sharp from one calm control
              centre.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <HeroMetric label="Website Status" value="Live" tone="success" />
            <HeroMetric label="Published Products" value={stats.activeProducts} />
            <HeroMetric
              label="Enquiries This Month"
              value={stats.enquiriesThisMonth}
            />
            <HeroMetric
              label={stats.quoteValue > 0 ? "Quote Value" : "Total Enquiries"}
              value={
                stats.quoteValue > 0
                  ? formatCurrency(stats.quoteValue)
                  : stats.enquiries
              }
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={`/${business?.slug}`}
            target="_blank"
            className="inline-flex items-center justify-center rounded-2xl bg-[#f2a900] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#d99800]"
          >
            View Public Site
          </a>
          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
          >
            Add Product
          </Link>
          <Link
            href="/admin/enquiries"
            className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
          >
            Manage Enquiries
          </Link>
        </div>
      </section>

      <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Published Products"
          value={stats.products}
          note={`${stats.activeProducts} active products`}
        />

        <StatCard
          label="Categories"
          value={stats.categories}
          note="Product groups"
        />

        <StatCard
          label="Total Leads"
          value={stats.enquiries}
          note={`${stats.quotedEnquiries} quoted · ${stats.wonEnquiries} won`}
        />

        <StatCard
          label="New Leads"
          value={stats.newEnquiries}
          note="Need attention"
          highlight
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.75fr_1.25fr]">
        <AdminCard>
          <h2 className="text-2xl font-black text-slate-950">
            Quick Actions
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Jump to the most important areas of the CMS.
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              href="/admin/products"
              className="block rounded-xl bg-[#f2a900] px-5 py-3 text-center text-sm font-bold text-slate-950"
            >
              Add Product
            </Link>

            <Link
              href="/admin/products"
              className="block rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-bold text-white"
            >
              Manage Products
            </Link>

            <Link
              href="/admin/enquiries"
              className="block rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-slate-800 ring-1 ring-slate-200"
            >
              View Enquiries
            </Link>

            <a
              href={`/${business?.slug}`}
              target="_blank"
              className="block rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-slate-800 ring-1 ring-slate-200"
            >
              View Public Website
            </a>

            <Link
              href="/admin/analytics"
              className="block rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-slate-800 ring-1 ring-slate-200"
            >
              Analytics
            </Link>

            {canManageSettings(role) && (
              <Link
                href="/admin/website"
                className="block rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-slate-800 ring-1 ring-slate-200"
              >
                Edit Website
              </Link>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Recent Leads
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Latest quote requests from the website.
              </p>
            </div>

            <Link
              href="/admin/enquiries"
              className="text-sm font-bold text-[#d99a1e]"
            >
              View all →
            </Link>
          </div>

          {recentEnquiries.length === 0 ? (
            <AdminEmptyState
              title="No leads yet"
              description="New customer quote requests will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentEnquiries.map((enquiry) => (
                <Link
                  key={enquiry.id}
                  href={`/admin/enquiries/${enquiry.id}`}
                  className="block rounded-2xl bg-slate-100 p-4 transition hover:bg-slate-200/70"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-black text-slate-950">
                        {enquiry.customer_name || "Unnamed Customer"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {enquiry.company_name || "No company"} ·{" "}
                        {enquiry.email || "No email"}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        {enquiry.created_at
                          ? new Date(enquiry.created_at).toLocaleString()
                          : "Unknown date"}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                      {getStatusBadge(enquiry.status)}

                      {Number(enquiry.quote_total || 0) > 0 && (
                        <p className="text-sm font-black text-slate-700">
                          R{" "}
                          {Number(enquiry.quote_total || 0).toLocaleString(
                            "en-ZA",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminCard>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Recent Products
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Latest catalogue updates for the public website.
              </p>
            </div>
            <Link href="/admin/products" className="text-sm font-bold text-[#d99a1e]">
              Manage →
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <AdminEmptyState
              title="No products yet"
              description="Add the first product to start building the public catalogue."
              actionLabel="Add Product"
              actionHref="/admin/products"
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recentProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}/edit`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xs font-bold text-slate-400">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "IMG"
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-black text-slate-950">
                      {product.name || "Untitled product"}
                    </h3>
                    <div className="mt-1">
                      <AdminBadge variant={product.is_active ? "success" : "warning"}>
                        {product.is_active ? "Published" : "Hidden"}
                      </AdminBadge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
            Public Site
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Website is live
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Current homepage layout:{" "}
            <span className="font-bold text-slate-900">{websiteLayout}</span>.
            Keep content, branding and contact details up to date before
            sharing the site with customers.
          </p>
          <div className="mt-5 grid gap-3">
            <a
              href={`/${business?.slug}`}
              target="_blank"
              className="inline-flex justify-center rounded-xl bg-[#101820] px-5 py-3 text-sm font-bold text-white"
            >
              Open Public Site
            </a>
            {canManageSettings(role) && (
              <Link
                href="/admin/website"
                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700"
              >
                Edit Website
              </Link>
            )}
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, note, highlight = false }) {
  return (
    <AdminCard className={highlight ? "border-2 border-[#f2a900]" : ""}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
        {label}
      </p>

      <h2 className="mt-3 text-4xl font-black text-slate-950">{value}</h2>

      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </AdminCard>
  );
}

function HeroMetric({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-black ${
          tone === "success" ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
