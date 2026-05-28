"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUserBusiness } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminInput from "@/components/admin/AdminInput";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminButton from "@/components/admin/AdminButton";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPagination from "@/components/admin/AdminPagination";

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const statusOptions = [
    { label: "New", value: "new" },
    { label: "Contacted", value: "contacted" },
    { label: "Quoted", value: "quoted" },
    { label: "Won", value: "won" },
    { label: "Lost", value: "lost" },
  ];

  async function loadEnquiries() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error) {
        toast.error("Unable to load enquiries.");
        return;
      }

      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .eq("business_id", result.business.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEnquiries(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEnquiries();
  }, []);

  function updateSearch(value) {
    setSearch(value);
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

  async function updateStatus(id, status) {
    try {
      setUpdatingId(id);

      const result = await getUserBusiness();

      if (result.error) {
        toast.error("Unable to verify business permissions.");
        return;
      }

      const { error } = await supabase
        .from("enquiries")
        .update({ status })
        .eq("id", id)
        .eq("business_id", result.business.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setEnquiries((prev) =>
        prev.map((enquiry) =>
          enquiry.id === id ? { ...enquiry, status } : enquiry
        )
      );

      toast.success("Enquiry status updated");
    } finally {
      setUpdatingId(null);
    }
  }

  function cleanCsvValue(value) {
    if (value === null || value === undefined) return "";

    return `"${String(value).replace(/"/g, '""')}"`;
  }

  function formatProducts(products) {
    if (!products || products.length === 0) return "No products selected";

    return products
      .map((item) => {
        return `${item.name || "Unnamed Product"} | Code: ${
          item.code || "N/A"
        } | Qty: ${item.quantity || 1}`;
      })
      .join(" ; ");
  }

  function exportCsv() {
    if (filteredEnquiries.length === 0) {
      toast.error("No enquiries to export.");
      return;
    }

    const headers = [
      "Submitted Date",
      "Status",
      "Customer Name",
      "Company",
      "Email",
      "Phone",
      "Products",
      "Quote Total",
      "Message",
    ];

    const rows = filteredEnquiries.map((enquiry) => [
      enquiry.created_at
        ? new Date(enquiry.created_at).toLocaleString()
        : "Unknown date",
      enquiry.status || "new",
      enquiry.customer_name || "",
      enquiry.company_name || "",
      enquiry.email || "",
      enquiry.phone || "",
      formatProducts(enquiry.products),
      enquiry.quote_total || "",
      enquiry.message || "",
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
    link.download = `enquiries-${date}.csv`;
    link.click();

    URL.revokeObjectURL(url);

    toast.success("Enquiries exported");
  }

  function getStatusBadge(status) {
    if (status === "new") return <AdminBadge variant="info">New</AdminBadge>;

    if (status === "contacted") {
      return <AdminBadge variant="warning">Contacted</AdminBadge>;
    }

    if (status === "quoted") {
      return <AdminBadge variant="warning">Quoted</AdminBadge>;
    }

    if (status === "won") {
      return <AdminBadge variant="success">Won</AdminBadge>;
    }

    if (status === "lost") {
      return <AdminBadge variant="danger">Lost</AdminBadge>;
    }

    return <AdminBadge>{status || "Unknown"}</AdminBadge>;
  }

  let filteredEnquiries = [...enquiries];

  if (search.trim()) {
    const query = search.toLowerCase();

    filteredEnquiries = filteredEnquiries.filter((enquiry) => {
      const productText = enquiry.products
        ?.map((item) => `${item.name || ""} ${item.code || ""}`)
        .join(" ")
        .toLowerCase();

      return (
        enquiry.customer_name?.toLowerCase().includes(query) ||
        enquiry.company_name?.toLowerCase().includes(query) ||
        enquiry.email?.toLowerCase().includes(query) ||
        enquiry.phone?.toLowerCase().includes(query) ||
        enquiry.message?.toLowerCase().includes(query) ||
        productText?.includes(query)
      );
    });
  }

  if (statusFilter) {
    filteredEnquiries = filteredEnquiries.filter(
      (enquiry) => enquiry.status === statusFilter
    );
  }

  if (sortBy === "newest") {
    filteredEnquiries.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }

  if (sortBy === "oldest") {
    filteredEnquiries.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
  }

  if (sortBy === "customer") {
    filteredEnquiries.sort((a, b) =>
      (a.customer_name || "").localeCompare(b.customer_name || "")
    );
  }

  const start = (page - 1) * pageSize;
  const paginatedEnquiries = filteredEnquiries.slice(start, start + pageSize);

  return (
    <AdminLayout
      title="Quote Enquiries"
      subtitle="View, export and manage website quote leads."
    >
      <AdminCard>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Enquiry Inbox
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Track customer quote requests, requested products and lead
              pipeline status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminBadge variant="info">
              {enquiries.filter((item) => item.status === "new").length} New
            </AdminBadge>

            <AdminBadge variant="warning">
              {
                enquiries.filter((item) => item.status === "contacted").length
              }{" "}
              Contacted
            </AdminBadge>

            <AdminBadge variant="warning">
              {enquiries.filter((item) => item.status === "quoted").length}{" "}
              Quoted
            </AdminBadge>

            <AdminBadge variant="success">
              {enquiries.filter((item) => item.status === "won").length} Won
            </AdminBadge>

            <AdminBadge variant="danger">
              {enquiries.filter((item) => item.status === "lost").length} Lost
            </AdminBadge>
          </div>
        </div>

        <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_180px_160px_160px]">
          <AdminInput
            placeholder="Search customer, company, email, product..."
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
          />

          <AdminSelect
            value={statusFilter}
            onChange={(e) => updateStatusFilter(e.target.value)}
            placeholder="All statuses"
            options={statusOptions}
          />

          <AdminSelect
            value={sortBy}
            onChange={(e) => updateSortBy(e.target.value)}
            placeholder="Sort by"
            options={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
              { label: "Customer", value: "customer" },
            ]}
          />

          <AdminButton type="button" variant="secondary" onClick={exportCsv}>
            Export CSV
          </AdminButton>
        </div>

        {loading ? (
          <AdminLoader text="Loading enquiries..." />
        ) : filteredEnquiries.length === 0 ? (
          <AdminEmptyState
            title="No enquiries found"
            description="Try changing your search or status filter. New quote requests from the public website will appear here."
          />
        ) : (
          <>
            <div className="space-y-5">
              {paginatedEnquiries.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-slate-950">
                          {enquiry.customer_name || "Unnamed Customer"}
                        </h3>

                        {getStatusBadge(enquiry.status)}
                      </div>

                      <p className="text-sm leading-6 text-slate-600">
                        {enquiry.company_name || "No company"} ·{" "}
                        {enquiry.email || "No email"} ·{" "}
                        {enquiry.phone || "No phone"}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        Submitted:{" "}
                        {enquiry.created_at
                          ? new Date(enquiry.created_at).toLocaleString()
                          : "Unknown date"}
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 md:w-44">
                      <AdminSelect
                        value={enquiry.status || "new"}
                        onChange={(e) =>
                          updateStatus(enquiry.id, e.target.value)
                        }
                        disabled={updatingId === enquiry.id}
                        options={statusOptions}
                      />

                      <Link
                        href={`/admin/enquiries/${enquiry.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-[#1f5f8b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#174b70]"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-5">
                    <h4 className="mb-3 font-black text-slate-950">
                      Products Requested
                    </h4>

                    {enquiry.products?.length > 0 ? (
                      <div className="space-y-2">
                        {enquiry.products.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="flex flex-col gap-2 rounded-xl bg-white p-3 text-sm font-semibold md:flex-row md:items-center md:justify-between"
                          >
                            <span>
                              {item.name}{" "}
                              <span className="text-slate-500">
                                ({item.code || "No code"})
                              </span>
                            </span>

                            <span className="text-slate-600">
                              Qty: {item.quantity || 1}
                            </span>
                          </div>
                        ))}

                        {enquiry.products.length > 3 && (
                          <p className="text-sm font-semibold text-slate-500">
                            + {enquiry.products.length - 3} more product
                            {enquiry.products.length - 3 === 1 ? "" : "s"}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">
                        No products selected.
                      </p>
                    )}
                  </div>

                  {enquiry.message && (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                      <h4 className="mb-2 font-black text-slate-950">
                        Message
                      </h4>

                      <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                        {enquiry.message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <AdminPagination
              page={page}
              totalItems={filteredEnquiries.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
