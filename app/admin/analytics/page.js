"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/lib/supabase";
import { getUserBusiness } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

const monthFormatter = new Intl.DateTimeFormat("en-ZA", {
  month: "short",
});

const STATUS_COLORS = {
  new: "#3b82f6",
  contacted: "#f59e0b",
  quoted: "#f2a900",
  won: "#059669",
  lost: "#dc2626",
};

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const [viewTrackingAvailable, setViewTrackingAvailable] = useState(false);

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    hiddenProducts: 0,
    productsWithPdfs: 0,
    totalCategories: 0,
    totalEnquiries: 0,
    newEnquiries: 0,
    contactedEnquiries: 0,
    quotedEnquiries: 0,
    wonEnquiries: 0,
    lostEnquiries: 0,
    enquiriesThisMonth: 0,
    estimatedQuoteValue: 0,
  });

  const [products, setProducts] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  async function initialise() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error || !result.business?.id) {
        toast.error("Unable to load analytics.");
        return;
      }

      setBusinessId(result.business.id);

      const [
        productsResult,
        categoriesResult,
        enquiriesResult,
        viewCounts,
      ] = await Promise.all([
        loadProducts(result.business.id),
        loadCategories(result.business.id),
        loadEnquiries(result.business.id),
        loadProductViews(result.business.id),
      ]);

      const currentProducts = productsResult.products;
      const currentEnquiries = enquiriesResult.enquiries;

      setProducts(currentProducts);
      setRecentEnquiries(currentEnquiries.slice(0, 6));

      setStats({
        totalProducts: currentProducts.length,
        activeProducts: currentProducts.filter((product) => product.is_active)
          .length,
        hiddenProducts: currentProducts.filter((product) => !product.is_active)
          .length,
        productsWithPdfs: currentProducts.filter((product) => product.pdf_url)
          .length,
        totalCategories: categoriesResult.count,
        totalEnquiries: currentEnquiries.length,
        newEnquiries: countStatus(currentEnquiries, "new"),
        contactedEnquiries: countStatus(currentEnquiries, "contacted"),
        quotedEnquiries: countStatus(currentEnquiries, "quoted"),
        wonEnquiries: countStatus(currentEnquiries, "won"),
        lostEnquiries: countStatus(currentEnquiries, "lost"),
        enquiriesThisMonth: countThisMonth(currentEnquiries),
        estimatedQuoteValue: sumQuoteValue(currentEnquiries),
      });

      setTopProducts(
        buildTopProducts(currentProducts, currentEnquiries, viewCounts)
      );
      setMonthlyData(buildMonthlyData(currentEnquiries));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialise();
  }, []);

  async function loadProducts(currentBusinessId) {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        code,
        category,
        image_url,
        pdf_url,
        is_active,
        created_at,
        categories (
          id,
          name,
          slug
        )
      `
      )
      .eq("business_id", currentBusinessId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return { products: [] };
    }

    return { products: data || [] };
  }

  async function loadCategories(currentBusinessId) {
    const { count, error } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("business_id", currentBusinessId);

    if (error) {
      toast.error(error.message);
      return { count: 0 };
    }

    return { count: count || 0 };
  }

  async function loadEnquiries(currentBusinessId) {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .eq("business_id", currentBusinessId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return { enquiries: [] };
    }

    return { enquiries: data || [] };
  }

  async function loadProductViews(currentBusinessId) {
    const { data, error } = await supabase
      .from("product_views")
      .select("product_id")
      .eq("business_id", currentBusinessId);

    if (error) {
      setViewTrackingAvailable(false);
      return {};
    }

    setViewTrackingAvailable(true);

    return (data || []).reduce((counts, view) => {
      if (!view.product_id) return counts;
      counts[view.product_id] = (counts[view.product_id] || 0) + 1;
      return counts;
    }, {});
  }

  function countStatus(enquiries, status) {
    return enquiries.filter((enquiry) => enquiry.status === status).length;
  }

  function countThisMonth(enquiries) {
    const now = new Date();

    return enquiries.filter((enquiry) => {
      if (!enquiry.created_at) return false;

      const createdAt = new Date(enquiry.created_at);
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth()
      );
    }).length;
  }

  function sumQuoteValue(enquiries) {
    return enquiries.reduce((total, enquiry) => {
      return total + Number(enquiry.quote_total || 0);
    }, 0);
  }

  function buildTopProducts(currentProducts, enquiries, viewCounts) {
    const requestCounts = {};
    const hasViews = Object.keys(viewCounts || {}).length > 0;

    enquiries.forEach((enquiry) => {
      (enquiry.products || []).forEach((product) => {
        const key = product.id || product.product_id || product.name;

        if (!key) return;

        requestCounts[key] = {
          requests: (requestCounts[key]?.requests || 0) + 1,
          quantity:
            (requestCounts[key]?.quantity || 0) + Number(product.quantity || 1),
        };
      });
    });

    const productsWithMetrics = currentProducts.map((product) => {
      const requestMetric =
        requestCounts[product.id] || requestCounts[product.name] || {};

      return {
        ...product,
        categoryName: product.categories?.name || product.category || "Product",
        views: viewCounts?.[product.id] || 0,
        requests: requestMetric.requests || 0,
        requestedQuantity: requestMetric.quantity || 0,
      };
    });

    if (hasViews) {
      return productsWithMetrics
        .sort((a, b) => b.views - a.views)
        .slice(0, 6)
        .map((product) => ({ ...product, metricLabel: `${product.views} views` }));
    }

    const hasRequests = productsWithMetrics.some(
      (product) => product.requests > 0
    );

    if (hasRequests) {
      return productsWithMetrics
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 6)
        .map((product) => ({
          ...product,
          metricLabel: `${product.requests} request${
            product.requests === 1 ? "" : "s"
          }`,
        }));
    }

    return productsWithMetrics.slice(0, 6).map((product) => ({
      ...product,
      metricLabel: "Recently added",
    }));
  }

  function buildMonthlyData(enquiries) {
    const now = new Date();
    const months = [];

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);

      months.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: monthFormatter.format(date),
        enquiries: 0,
      });
    }

    enquiries.forEach((enquiry) => {
      if (!enquiry.created_at) return;

      const createdAt = new Date(enquiry.created_at);
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      const month = months.find((item) => item.key === key);

      if (month) {
        month.enquiries += 1;
      }
    });

    return months;
  }

  function formatCurrency(value) {
    return `R ${Number(value || 0).toLocaleString("en-ZA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  function formatDate(value) {
    if (!value) return "Unknown date";

    return new Date(value).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

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

  const activePercentage =
    stats.totalProducts > 0
      ? Math.round((stats.activeProducts / stats.totalProducts) * 100)
      : 0;
  const pdfPercentage =
    stats.totalProducts > 0
      ? Math.round((stats.productsWithPdfs / stats.totalProducts) * 100)
      : 0;
  const hiddenPercentage =
    stats.totalProducts > 0
      ? Math.round((stats.hiddenProducts / stats.totalProducts) * 100)
      : 0;
  const statusBreakdownData = [
    { label: "New", key: "new", value: stats.newEnquiries },
    { label: "Contacted", key: "contacted", value: stats.contactedEnquiries },
    { label: "Quoted", key: "quoted", value: stats.quotedEnquiries },
    { label: "Won", key: "won", value: stats.wonEnquiries },
    { label: "Lost", key: "lost", value: stats.lostEnquiries },
  ].filter((item) => item.value > 0);
  const heroValue =
    stats.estimatedQuoteValue > 0
      ? formatCurrency(stats.estimatedQuoteValue)
      : stats.totalEnquiries;
  const heroValueLabel =
    stats.estimatedQuoteValue > 0 ? "Estimated Quote Value" : "Total Enquiries";
  const catalogueHealthMessage =
    stats.totalProducts === 0
      ? "Add products to start building a useful catalogue."
      : activePercentage >= 80 && pdfPercentage >= 50
        ? "Your catalogue is mostly ready. Keep product details and PDFs up to date."
        : activePercentage >= 80
          ? "Your catalogue is visible. Add PDFs to improve buyer confidence."
          : "Publish more products so customers can browse a fuller catalogue.";

  if (loading) {
    return (
      <AdminLayout
        title="Analytics"
        subtitle="Track enquiries, products and website performance."
      >
        <AdminLoader text="Loading analytics..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Analytics"
      subtitle="Track enquiries, products and website performance."
    >
      <section className="mb-8 overflow-hidden rounded-3xl bg-[#101820] p-6 text-white shadow-sm md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f2a900]">
              Executive Overview
            </p>
            <h2 className="mt-4 text-3xl font-black md:text-4xl">
              Business Performance Overview
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              A simple view of your catalogue, enquiries and website activity.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroMetric label="Total Products" value={stats.totalProducts} />
            <HeroMetric
              label="Enquiries This Month"
              value={stats.enquiriesThisMonth}
            />
            <HeroMetric label={heroValueLabel} value={heroValue} accent />
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PrimaryKpiCard
          label="Active Products"
          value={stats.activeProducts}
          helper="Visible on the public website"
          badge={`${activePercentage}% active`}
        />
        <PrimaryKpiCard
          label="Total Enquiries"
          value={stats.totalEnquiries}
          helper="All submitted quote requests"
        />
        <PrimaryKpiCard
          label="New Leads"
          value={stats.newEnquiries}
          helper="Need follow-up"
          badge="Action"
          highlight
        />
        <PrimaryKpiCard
          label="Won Leads"
          value={stats.wonEnquiries}
          helper="Marked as successful"
        />
      </section>

      <section className="mb-8 grid gap-8 xl:grid-cols-[1fr_0.8fr]">
        <AdminCard>
          <SectionHeader
            title="Enquiries Over Time"
            description="Quote enquiry volume over the last six months."
          />

          {monthlyData.every((month) => month.enquiries === 0) ? (
            <AdminEmptyState
              title="No enquiry trend yet"
              description="This chart will populate once quote enquiries are submitted."
            />
          ) : (
            <div className="mt-6 h-[300px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="enquiryTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f2a900" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f2a900" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ stroke: "#f2a900", strokeWidth: 1 }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="enquiries"
                    stroke="#f2a900"
                    strokeWidth={3}
                    fill="url(#enquiryTrend)"
                    activeDot={{ r: 5, fill: "#101820", stroke: "#f2a900" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <SectionHeader
            title="Enquiry Status Breakdown"
            description="A quick view of where leads currently sit."
          />

          {statusBreakdownData.length === 0 ? (
            <AdminEmptyState
              title="No status data yet"
              description="Lead status analytics will appear once enquiries come in."
            />
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-[180px_1fr] lg:items-center xl:grid-cols-1">
              <div className="h-[200px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdownData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {statusBreakdownData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={STATUS_COLORS[entry.key] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {statusBreakdownData.map((item) => (
                  <StatusLegendRow
                    key={item.key}
                    label={item.label}
                    value={item.value}
                    color={STATUS_COLORS[item.key]}
                  />
                ))}
              </div>
            </div>
          )}
        </AdminCard>
      </section>

      <div className="mb-8 grid gap-8 xl:grid-cols-[1fr_0.95fr]">
        <AdminCard>
          <SectionHeader
            title="Recent Enquiries"
            description="A compact CRM-style view of the newest quote requests."
          />

          {recentEnquiries.length === 0 ? (
            <AdminEmptyState
              title="No enquiries yet"
              description="When customers submit quote requests, they will appear here."
            />
          ) : (
            <div className="mt-6 space-y-3">
              {recentEnquiries.map((enquiry) => (
                <RecentEnquiryCard
                  key={enquiry.id}
                  enquiry={enquiry}
                  statusBadge={getStatusBadge(enquiry.status)}
                  formattedDate={formatDate(enquiry.created_at)}
                />
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <SectionHeader
              title="Top Products"
              description={
                viewTrackingAvailable
                  ? "Products with the most public page views."
                  : "Requested or recently added products."
              }
            />

            {!viewTrackingAvailable && (
              <AdminBadge variant="warning">Views off</AdminBadge>
            )}
          </div>

          {topProducts.length === 0 ? (
            <AdminEmptyState
              title="No product data yet"
              description="Add products to build out this performance view."
            />
          ) : (
            <div className="space-y-3">
              {topProducts.map((product) => (
                <ProductAnalyticsRow key={product.id} product={product} />
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <div className="mb-8 grid gap-8 xl:grid-cols-[0.95fr_1fr]">
        <AdminCard>
            <SectionHeader
              title="Product Catalogue Health"
              description="A simple readiness check for buyer confidence."
            />

            {products.length === 0 ? (
              <AdminEmptyState
                title="No catalogue health yet"
                description="Add products to start measuring catalogue readiness."
              />
            ) : (
              <div className="mt-6 space-y-5">
                <HealthMetric
                  label="Active products"
                  value={`${activePercentage}%`}
                  progress={activePercentage}
                />
                <HealthMetric
                  label="Products with PDFs"
                  value={`${pdfPercentage}%`}
                  progress={pdfPercentage}
                />
                <HealthMetric
                  label="Hidden products"
                  value={`${hiddenPercentage}%`}
                  progress={hiddenPercentage}
                  tone="slate"
                />

                <div className="rounded-2xl bg-slate-100 p-5">
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {catalogueHealthMessage}
                  </p>
                </div>
              </div>
            )}
        </AdminCard>

        <AdminCard>
          <SectionHeader
            title="Secondary Metrics"
            description="Useful supporting signals without crowding the main view."
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SecondaryMetric label="Hidden Products" value={stats.hiddenProducts} />
            <SecondaryMetric
              label="Products With PDFs"
              value={stats.productsWithPdfs}
            />
            <SecondaryMetric label="Categories" value={stats.totalCategories} />
            <SecondaryMetric label="Quoted Leads" value={stats.quotedEnquiries} />
            <SecondaryMetric label="Lost Leads" value={stats.lostEnquiries} />
          </div>
        </AdminCard>
      </div>

      {!viewTrackingAvailable && businessId && (
        <AdminCard className="border border-amber-200 bg-amber-50">
          <h2 className="text-xl font-black text-slate-950">
            Website view tracking is ready to enable
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            The dashboard currently falls back to enquiry and product data. Add
            the `product_views` SQL table from the launch notes to start
            recording public product page views.
          </p>
        </AdminCard>
      )}
    </AdminLayout>
  );
}

function HeroMetric({ label, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
        {label}
      </p>
      <p
        className={`mt-3 text-3xl font-black ${
          accent ? "text-[#f2a900]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PrimaryKpiCard({ label, value, helper, badge, highlight = false }) {
  return (
    <AdminCard
      className={`border ${
        highlight ? "border-[#f2a900]" : "border-transparent"
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
          {label}
        </p>
        {badge && <AdminBadge variant={highlight ? "warning" : "info"}>{badge}</AdminBadge>}
      </div>
      <h3 className="text-4xl font-black text-slate-950">{value}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{helper}</p>
    </AdminCard>
  );
}

function SecondaryMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function StatusLegendRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-100 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-sm font-bold text-slate-700">
          {label}
        </span>
      </div>
      <p className="text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function HealthMetric({ label, value, progress, tone = "accent" }) {
  const barColor = tone === "slate" ? "bg-slate-500" : "bg-[#f2a900]";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="text-sm font-black text-slate-950">{value}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RecentEnquiryCard({ enquiry, statusBadge, formattedDate }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-black text-slate-950">
            {enquiry.company_name || enquiry.customer_name || "Unnamed enquiry"}
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Submitted {formattedDate}
          </p>
        </div>

        {statusBadge}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="truncate text-sm text-slate-600">
          {enquiry.customer_name || enquiry.email || "Customer details pending"}
        </p>

        <Link
          href={`/admin/enquiries/${enquiry.id}`}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          Open
        </Link>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      )}
    </div>
  );
}

function ProductAnalyticsRow({ product }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-20 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:w-20">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="truncate font-black text-slate-950">
              {product.name}
            </h3>
            {product.is_active ? (
              <AdminBadge variant="success">Active</AdminBadge>
            ) : (
              <AdminBadge variant="warning">Hidden</AdminBadge>
            )}
            {product.pdf_url && <AdminBadge variant="info">PDF</AdminBadge>}
          </div>

          <p className="text-sm text-slate-600">
            {product.categoryName} · {product.code || "No code"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {product.metricLabel}
          </p>
        </div>

        <Link
          href={`/admin/products/${product.id}/edit`}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
