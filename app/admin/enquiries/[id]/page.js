"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUserBusiness } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminInput from "@/components/admin/AdminInput";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminTextarea from "@/components/admin/AdminTextarea";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminLoader from "@/components/admin/AdminLoader";

export default function AdminEnquiryDetailPage() {
  const params = useParams();
  const enquiryId = params.id;

  const [businessId, setBusinessId] = useState(null);
  const [business, setBusiness] = useState(null);
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [quoteItems, setQuoteItems] = useState([]);
  const [quoteNotes, setQuoteNotes] = useState("");

  const statusOptions = [
    { label: "New", value: "new" },
    { label: "Contacted", value: "contacted" },
    { label: "Quoted", value: "quoted" },
    { label: "Won", value: "won" },
    { label: "Lost", value: "lost" },
  ];

  async function loadEnquiry() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error) {
        toast.error("Unable to load enquiry.");
        return;
      }

      setBusinessId(result.business.id);
      setBusiness(result.business);

      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .eq("id", enquiryId)
        .eq("business_id", result.business.id)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        return;
      }

      setEnquiry(data);
      setInternalNotes(data?.internal_notes || "");
      setQuoteNotes(data?.quote_notes || "");

      const initialQuoteItems =
        data?.quote_items?.length > 0
          ? data.quote_items
          : (data?.products || []).map((item) => ({
              id: item.id || crypto.randomUUID(),
              name: item.name || "Product",
              code: item.code || "",
              category: item.category || "Product",
              quantity: Number(item.quantity || 1),
              unit_price: 0,
            }));

      setQuoteItems(initialQuoteItems);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEnquiry();
  }, []);

  const totals = useMemo(() => {
    const subtotal = quoteItems.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.unit_price || 0);
    }, 0);

    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    return { subtotal, vat, total };
  }, [quoteItems]);

  function formatCurrency(value) {
    return `R ${Number(value || 0).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function updateQuoteItem(index, field, value) {
    setQuoteItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "quantity" || field === "unit_price"
                  ? Number(value)
                  : value,
            }
          : item
      )
    );
  }

  async function saveQuotePricing() {
    if (!enquiry) return;

    try {
      setSavingQuote(true);

      const now = new Date().toISOString();

      const updates = {
        quote_items: quoteItems,
        quote_notes: quoteNotes,
        quote_subtotal: totals.subtotal,
        quote_vat: totals.vat,
        quote_total: totals.total,
        status: "quoted",
        quoted_at: enquiry.quoted_at || now,
        updated_at: now,
        last_activity: "Quote pricing updated and marked as quoted",
      };

      const { error } = await supabase
        .from("enquiries")
        .update(updates)
        .eq("id", enquiry.id)
        .eq("business_id", businessId);

      if (error) {
        toast.error(error.message);
        return;
      }

      setEnquiry((prev) => ({
        ...prev,
        ...updates,
      }));

      toast.success("Quote pricing saved");
    } finally {
      setSavingQuote(false);
    }
  }
  async function updateStatus(status) {
    if (!enquiry) return;

    try {
      setUpdatingStatus(true);

      const updates = {
        status,
        updated_at: new Date().toISOString(),
        last_activity: `Status changed to ${getStatusLabel(status)}`,
      };

      if (status === "contacted") updates.contacted_at = new Date().toISOString();
      if (status === "quoted") updates.quoted_at = new Date().toISOString();
      if (status === "won") updates.won_at = new Date().toISOString();
      if (status === "lost") updates.lost_at = new Date().toISOString();

      const { error } = await supabase
        .from("enquiries")
        .update(updates)
        .eq("id", enquiry.id)
        .eq("business_id", businessId);

      if (error) {
        toast.error(error.message);
        return;
      }

      setEnquiry((prev) => ({ ...prev, ...updates }));
      toast.success("Enquiry status updated");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function saveInternalNotes() {
    if (!enquiry) return;

    try {
      setSavingNotes(true);

      const updates = {
        internal_notes: internalNotes,
        updated_at: new Date().toISOString(),
        last_activity: "Internal notes updated",
      };

      const { error } = await supabase
        .from("enquiries")
        .update(updates)
        .eq("id", enquiry.id)
        .eq("business_id", businessId);

      if (error) {
        toast.error(error.message);
        return;
      }

      setEnquiry((prev) => ({ ...prev, ...updates }));
      toast.success("Internal notes saved");
    } finally {
      setSavingNotes(false);
    }
  }

  function getStatusLabel(status) {
    const found = statusOptions.find((item) => item.value === status);
    return found?.label || status || "Unknown";
  }

  function getStatusBadge(status) {
    if (status === "new") return <AdminBadge variant="info">New</AdminBadge>;
    if (status === "contacted") return <AdminBadge variant="warning">Contacted</AdminBadge>;
    if (status === "quoted") return <AdminBadge variant="warning">Quoted</AdminBadge>;
    if (status === "won") return <AdminBadge variant="success">Won</AdminBadge>;
    if (status === "lost") return <AdminBadge variant="danger">Lost</AdminBadge>;

    return <AdminBadge>{status || "Unknown"}</AdminBadge>;
  }

  function getQuoteEmailSubject() {
    return `Quote from ${business?.name || "our team"}`;
  }

  function getQuoteUrl() {
    if (typeof window === "undefined" || !enquiry?.id) return "";

    return `${window.location.origin}/admin/enquiries/${enquiry.id}/quote`;
  }

  function getQuoteEmailBody() {
    return `Hi ${enquiry.customer_name || "there"},

Thank you for your enquiry. Your quote is ready to view here:
${getQuoteUrl()}

Quote total: ${formatCurrency(totals.total)}

Products quoted:
${quoteItems
  .map(
    (item) =>
      `- ${item.name} | Qty: ${item.quantity || 1} | Unit Price: ${formatCurrency(
        item.unit_price || 0
      )}`
  )
  .join("\n")}

${quoteNotes ? `Notes:\n${quoteNotes}\n\n` : ""}Kind regards,
${business?.name || ""}`;
  }

  function getMailtoHref() {
    if (!enquiry.email) return "";

    return `mailto:${enquiry.email}?subject=${encodeURIComponent(
      getQuoteEmailSubject()
    )}&body=${encodeURIComponent(getQuoteEmailBody())}`;
  }

  async function copyQuoteEmail() {
    try {
      await navigator.clipboard.writeText(getQuoteEmailBody());

      toast.success("Quote email copied");
    } catch (error) {
      toast.error("Unable to copy email");
    }
  }

  async function markQuoteEmailed() {
    if (!enquiry?.email) {
      toast.error("No customer email available.");
      return;
    }

    if (enquiry.status === "quoted") return;

    await updateStatus("quoted");
  }

  if (loading) {
    return (
      <AdminLayout title="Enquiry Details" subtitle="Loading enquiry...">
        <AdminLoader text="Loading enquiry details..." />
      </AdminLayout>
    );
  }

  if (!enquiry) {
    return (
      <AdminLayout title="Enquiry Not Found" subtitle="This enquiry does not exist.">
        <AdminCard>
          <p className="text-sm text-slate-600">
            This enquiry could not be found or does not belong to this business.
          </p>

          <Link href="/admin/enquiries" className="mt-6 inline-block font-bold text-[#d99a1e]">
            ← Back to Enquiries
          </Link>
        </AdminCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Enquiry Details"
      subtitle="Review customer details, requested products, lead status and quote pricing."
    >
      <div className="mb-6">
        <Link href="/admin/enquiries" className="font-bold text-[#d99a1e]">
          ← Back to Enquiries
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <AdminCard>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black text-slate-950">
                    {enquiry.customer_name || "Unnamed Customer"}
                  </h2>
                  {getStatusBadge(enquiry.status)}
                </div>

                <p className="text-sm text-slate-500">
                  Submitted:{" "}
                  {enquiry.created_at
                    ? new Date(enquiry.created_at).toLocaleString()
                    : "Unknown date"}
                </p>
              </div>

              <div className="w-full md:w-48">
                <AdminSelect
                  label="Lead Status"
                  value={enquiry.status || "new"}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={updatingStatus}
                  options={statusOptions}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoBox label="Customer" value={enquiry.customer_name} />
              <InfoBox label="Company" value={enquiry.company_name || "N/A"} />
              <InfoBox label="Email" value={enquiry.email || "N/A"} />
              <InfoBox label="Phone" value={enquiry.phone || "N/A"} />
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-5 text-2xl font-black text-slate-950">
              Products Requested
            </h2>

            {enquiry.products?.length > 0 ? (
              <div className="space-y-3">
                {enquiry.products.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-4 rounded-2xl bg-slate-100 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h3 className="font-black text-slate-950">{item.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.code || "No code"} · {item.category || "Product"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-700">
                      Qty: {item.quantity || 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No products selected.</p>
            )}
          </AdminCard>

          <AdminCard>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">
                Quote Pricing
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add unit prices here before opening the quote page.
              </p>
            </div>

            <div className="space-y-4">
              {quoteItems.map((item, index) => {
                const lineTotal =
                  Number(item.quantity || 0) * Number(item.unit_price || 0);

                return (
                  <div key={index} className="rounded-2xl bg-slate-100 p-4">
                    <div className="mb-4">
                      <h3 className="font-black text-slate-950">{item.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.code || "No code"} · {item.category || "Product"}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <AdminInput
                        label="Quantity"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuoteItem(index, "quantity", e.target.value)
                        }
                      />

                      <AdminInput
                        label="Unit Price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateQuoteItem(index, "unit_price", e.target.value)
                        }
                      />

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Line Total
                        </p>
                        <p className="mt-2 text-lg font-black text-slate-950">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-black">{formatCurrency(totals.subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>VAT 15%</span>
                  <span className="font-black">{formatCurrency(totals.vat)}</span>
                </div>

                <div className="border-t border-white/20 pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-black">Total</span>
                    <span className="font-black text-[#f2a900]">
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <AdminTextarea
                label="Quote Notes"
                rows={4}
                placeholder="Example: Prices valid for 7 days. Delivery excluded. Subject to stock availability."
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <AdminButton
                type="button"
                className="w-full bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
                onClick={saveQuotePricing}
                disabled={savingQuote}
              >
                {savingQuote ? "Saving Pricing..." : "Save Quote Pricing"}
              </AdminButton>

              <Link
                href={`/admin/enquiries/${enquiry.id}/quote`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1f5f8b] px-5 py-3 text-sm font-bold text-white"
              >
                Open Quote Page
              </Link>

              {enquiry.email ? (
                <a
                  href={getMailtoHref()}
                  onClick={markQuoteEmailed}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
                >
                  Email Quote
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => toast.error("No customer email available.")}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-200 px-5 py-3 text-sm font-bold text-slate-500"
                >
                  Email Quote
                </button>
              )}
            </div>
          </AdminCard>

          {enquiry.message && (
            <AdminCard>
              <h2 className="mb-3 text-2xl font-black text-slate-950">
                Customer Message
              </h2>

              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {enquiry.message}
              </p>
            </AdminCard>
          )}

          <AdminCard>
            <h2 className="text-2xl font-black text-slate-950">
              Internal Notes
            </h2>

            <div className="mt-5 space-y-4">
              <AdminTextarea
                rows={7}
                placeholder="Example: Called customer, waiting for specs."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />

              <AdminButton
                type="button"
                className="bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
                onClick={saveInternalNotes}
                disabled={savingNotes}
              >
                {savingNotes ? "Saving Notes..." : "Save Notes"}
              </AdminButton>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard>
            <h2 className="text-2xl font-black text-slate-950">Lead Pipeline</h2>

            <div className="mt-6 grid gap-3">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => updateStatus(status.value)}
                  disabled={updatingStatus}
                  className={`rounded-xl px-5 py-3 text-left text-sm font-bold transition ${
                    enquiry.status === status.value
                      ? "bg-[#f2a900] text-slate-950"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-xl font-black text-slate-950">CRM Timeline</h2>

              <div className="mb-5 rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Last Activity
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {enquiry.last_activity || "No activity recorded yet."}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {enquiry.updated_at
                    ? new Date(enquiry.updated_at).toLocaleString()
                    : "Not updated yet"}
                </p>
              </div>

            <div className="mt-5 space-y-4">
              <TimelineItem label="Enquiry Submitted" value={enquiry.created_at} />
              <TimelineItem label="Customer Contacted" value={enquiry.contacted_at} />
              <TimelineItem label="Quote Sent" value={enquiry.quoted_at} />
              <TimelineItem label="Lead Won" value={enquiry.won_at} />
              <TimelineItem label="Lead Lost" value={enquiry.lost_at} />
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-2xl font-black text-slate-950">
              Quote Email Draft
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Copy the email body if you prefer to paste it into your own email
              thread.
            </p>

            <AdminButton
              type="button"
              className="mt-5 w-full bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
              onClick={copyQuoteEmail}
            >
              Copy Quote Email
            </AdminButton>
          </AdminCard>
        </div>
      </div>
    </AdminLayout>
      

    
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-bold text-slate-700">
        {value || "N/A"}
      </p>
    </div>
  );
}

function TimelineItem({ label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-100 p-4">
      <div className="mt-1 h-3 w-3 rounded-full bg-[#f2a900]" />

      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>

        <p className="mt-1 text-xs text-slate-500">
          {value ? new Date(value).toLocaleString() : "Not completed yet"}
        </p>
      </div>
    </div>
  );
}
