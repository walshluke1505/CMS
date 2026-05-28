"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { getUserBusiness } from "@/lib/auth";

export default function AdminQuotePage() {
  const params = useParams();
  const enquiryId = params.id;

  const [loading, setLoading] = useState(true);
  const [enquiry, setEnquiry] = useState(null);
  const [business, setBusiness] = useState(null);

  async function loadQuote() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error) {
        toast.error("Unable to load business.");
        return;
      }

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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuote();
  }, []);

  const quoteItems = useMemo(() => {
    if (!enquiry) return [];

    if (enquiry.quote_items?.length > 0) {
      return enquiry.quote_items;
    }

    return (enquiry.products || []).map((item) => ({
      ...item,
      unit_price: 0,
    }));
  }, [enquiry]);

  const totals = useMemo(() => {
    const subtotal =
      Number(enquiry?.quote_subtotal) ||
      quoteItems.reduce((sum, item) => {
        return sum + Number(item.quantity || 0) * Number(item.unit_price || 0);
      }, 0);

    const vat = Number(enquiry?.quote_vat) || subtotal * 0.15;
    const total = Number(enquiry?.quote_total) || subtotal + vat;

    return { subtotal, vat, total };
  }, [enquiry, quoteItems]);

  function formatDate(date) {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatCurrency(value) {
    return `R ${Number(value || 0).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function shortRef(id) {
    if (!id) return "QUOTE";
    return `Q-${id.slice(0, 8).toUpperCase()}`;
  }

  function getQuoteUrl() {
    if (typeof window === "undefined" || !enquiry?.id) return "";

    return `${window.location.origin}/admin/enquiries/${enquiry.id}/quote`;
  }

  function getQuoteEmailSubject() {
    return `Quote from ${business?.name || "our team"}`;
  }

  function getQuoteEmailBody() {
    return `Hi ${enquiry?.customer_name || "there"},

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

Kind regards,
${business?.name || ""}`;
  }

  function getMailtoHref() {
    if (!enquiry?.email) return "";

    return `mailto:${enquiry.email}?subject=${encodeURIComponent(
      getQuoteEmailSubject()
    )}&body=${encodeURIComponent(getQuoteEmailBody())}`;
  }

  async function markQuoteEmailed() {
    if (!enquiry?.email) {
      toast.error("No customer email available.");
      return;
    }

    if (enquiry.status === "quoted") return;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("enquiries")
      .update({
        status: "quoted",
        quoted_at: enquiry.quoted_at || now,
        updated_at: now,
        last_activity: "Quote email opened",
      })
      .eq("id", enquiry.id)
      .eq("business_id", business.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setEnquiry((prev) => ({
      ...prev,
      status: "quoted",
      quoted_at: prev.quoted_at || now,
      updated_at: now,
      last_activity: "Quote email opened",
    }));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">
            Loading quote...
          </p>
        </div>
      </main>
    );
  }

  if (!enquiry) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">
            Enquiry not found
          </h1>

          <p className="mt-3 text-sm text-slate-600">ID: {enquiryId}</p>

          <Link
            href="/admin/enquiries"
            className="mt-6 inline-block font-bold text-[#d99a1e]"
          >
            ← Back to Enquiries
          </Link>
        </div>
      </main>
    );
  }

  const quoteRef = shortRef(enquiry.id);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm print:hidden md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <Link
            href={`/admin/enquiries/${enquiry.id}`}
            className="inline-flex items-center font-bold text-[#d99a1e]"
          >
            ← Back to Enquiry
          </Link>

          {enquiry.email ? (
            <a
              href={getMailtoHref()}
              onClick={markQuoteEmailed}
              className="inline-flex items-center justify-center rounded-xl bg-[#1f5f8b] px-5 py-3 text-sm font-bold text-white"
            >
              Email Quote
            </a>
          ) : (
            <button
              type="button"
              onClick={() => toast.error("No customer email available.")}
              className="rounded-xl bg-slate-200 px-5 py-3 text-sm font-bold text-slate-500"
            >
              Email Quote
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              window.print();
            }}
            className="rounded-xl bg-[#101820] px-5 py-3 text-sm font-bold text-white"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm print:rounded-none print:shadow-none">
          <div className="bg-[#101820] px-10 py-8 text-white print:px-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f2a900]">
                  Official Quotation
                </p>

                <h1 className="mt-3 text-5xl font-black tracking-tight">
                  Quotation
                </h1>

                <p className="mt-4 text-sm text-white/70">
                  Reference: {quoteRef}
                </p>
              </div>

              <div className="text-left md:text-right">
                {business?.logo_url ? (
                  <div className="mb-4 rounded-xl bg-white p-3 md:ml-auto">
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="max-h-16 max-w-[180px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white text-2xl font-black text-[#101820] md:ml-auto">
                    {business?.name?.charAt(0) || "B"}
                  </div>
                )}

                <h2 className="text-2xl font-black">
                  {business?.name || "Business"}
                </h2>

                <div className="mt-3 space-y-1 text-sm text-white/70">
                  {business?.contact_email && <p>{business.contact_email}</p>}
                  {business?.phone && <p>{business.phone}</p>}
                  {business?.address && <p>{business.address}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 print:p-8">
            <div className="grid gap-6 md:grid-cols-3">
              <QuoteInfoCard
                label="Quote Ref"
                value={quoteRef}
                subValue="Internal quotation reference"
              />

              <QuoteInfoCard
                label="Date Generated"
                value={formatDate(new Date())}
                subValue="Document creation date"
              />

              <QuoteInfoCard
                label="Lead Status"
                value={enquiry.status || "new"}
                subValue="Current enquiry stage"
              />
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
                  Prepared For
                </p>

                <h3 className="mt-4 text-2xl font-black text-slate-950">
                  {enquiry.customer_name || "Customer"}
                </h3>

                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <p>
                    <span className="font-black text-slate-950">Company:</span>{" "}
                    {enquiry.company_name || "N/A"}
                  </p>

                  <p>
                    <span className="font-black text-slate-950">Email:</span>{" "}
                    {enquiry.email || "N/A"}
                  </p>

                  <p>
                    <span className="font-black text-slate-950">Phone:</span>{" "}
                    {enquiry.phone || "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
                  Prepared By
                </p>

                <h3 className="mt-4 text-2xl font-black text-slate-950">
                  {business?.name || "Business"}
                </h3>

                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <p>
                    <span className="font-black text-slate-950">Email:</span>{" "}
                    {business?.contact_email || "N/A"}
                  </p>

                  <p>
                    <span className="font-black text-slate-950">Phone:</span>{" "}
                    {business?.phone || "N/A"}
                  </p>

                  <p>
                    <span className="font-black text-slate-950">Address:</span>{" "}
                    {business?.address || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
                    Quoted Items
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Products & Pricing
                  </h2>
                </div>

                <p className="text-sm font-bold text-slate-500">
                  {quoteItems.length} item{quoteItems.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-950">
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-white">
                      <th className="px-5 py-4 font-bold">#</th>
                      <th className="px-5 py-4 font-bold">Product</th>
                      <th className="px-5 py-4 font-bold">Code</th>
                      <th className="px-5 py-4 text-right font-bold">Qty</th>
                      <th className="px-5 py-4 text-right font-bold">
                        Unit Price
                      </th>
                      <th className="px-5 py-4 text-right font-bold">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {quoteItems.length > 0 ? (
                      quoteItems.map((item, index) => {
                        const lineTotal =
                          Number(item.quantity || 0) *
                          Number(item.unit_price || 0);

                        return (
                          <tr
                            key={index}
                            className="border-t border-slate-200 even:bg-slate-50"
                          >
                            <td className="px-5 py-5 text-sm font-black text-slate-400">
                              {index + 1}
                            </td>

                            <td className="px-5 py-5">
                              <p className="font-black text-slate-950">
                                {item.name}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {item.category || "Product"}
                              </p>
                            </td>

                            <td className="px-5 py-5 text-sm font-semibold text-slate-600">
                              {item.code || "N/A"}
                            </td>

                            <td className="px-5 py-5 text-right text-sm font-black text-slate-950">
                              {item.quantity || 1}
                            </td>

                            <td className="px-5 py-5 text-right text-sm font-semibold text-slate-600">
                              {formatCurrency(item.unit_price || 0)}
                            </td>

                            <td className="px-5 py-5 text-right text-sm font-black text-slate-950">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-5 py-6 text-center text-sm text-slate-500"
                        >
                          No products selected.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-sm rounded-2xl bg-slate-100 p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-black text-slate-950">
                        {formatCurrency(totals.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600">VAT 15%</span>
                      <span className="font-black text-slate-950">
                        {formatCurrency(totals.vat)}
                      </span>
                    </div>

                    <div className="border-t border-slate-300 pt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-black text-slate-950">
                          Grand Total
                        </span>

                        <span className="font-black text-[#1f5f8b]">
                          {formatCurrency(totals.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {(enquiry.quote_notes || enquiry.message) && (
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {enquiry.quote_notes && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
                      Quote Notes
                    </p>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {enquiry.quote_notes}
                    </p>
                  </div>
                )}

                {enquiry.message && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
                      Customer Notes
                    </p>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {enquiry.message}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-100 p-6">
                <h3 className="text-lg font-black text-slate-950">
                  Important Note
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Pricing, VAT, delivery, stock availability and lead times are
                  subject to final confirmation by {business?.name || "the business"}.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-6">
                <h3 className="text-lg font-black text-slate-950">
                  Acceptance
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  To accept this quotation, please reply by email or contact the
                  business directly using the details provided above.
                </p>
              </div>
            </div>

            <div className="mt-12 border-t border-slate-200 pt-8 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Generated through Platform CMS
              </p>

              <p className="mt-3 text-sm text-slate-500">
                {business?.name || "Business"} · {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          table,
          tr,
          .rounded-2xl,
          .rounded-3xl {
            break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}

function QuoteInfoCard({ label, value, subValue }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-lg font-black capitalize text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{subValue}</p>
    </div>
  );
}
