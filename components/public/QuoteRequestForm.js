"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useQuoteCart } from "@/context/QuoteCartContext";

export default function QuoteRequestForm({ business, theme, websiteTheme }) {
  const { items, updateQuantity, removeItem, clearCart } = useQuoteCart();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    company_name: "",
    email: "",
    phone: "",
    message: "",
  });

  async function submitEnquiry(e) {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Please add at least one product to your enquiry.");
      return;
    }

    if (!form.customer_name || !form.email) {
      toast.error("Name and email are required.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/send-enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_id: business.id,
          customer_name: form.customer_name,
          company_name: form.company_name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          products: items,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : result.error?.message ||
              result.message ||
              "Unable to submit enquiry.";

        toast.error(errorMessage);
        return;
      }

      toast.success("Enquiry submitted successfully.");
      setSubmitted(true);

      setForm({
        customer_name: "",
        company_name: "",
        email: "",
        phone: "",
        message: "",
      });

      clearCart();
    } catch (error) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || "Something went wrong.";

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className={`${websiteTheme?.radius || "rounded-3xl"} ${
          websiteTheme?.cardStyle || "bg-white"
        } p-10 text-center ${websiteTheme?.shadow || "shadow-sm"}`}
      >
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black"
          style={{
            backgroundColor: theme.accent,
            color: "#101820",
          }}
        >
          ✓
        </div>

        <h2
          className={`text-3xl font-black text-slate-950 ${
            websiteTheme?.heading || ""
          }`}
        >
          Enquiry submitted
        </h2>

        <p
          className={`mx-auto mt-4 max-w-xl text-sm leading-6 ${
            websiteTheme?.subheading || "text-slate-600"
          }`}
        >
          Your enquiry has been sent to {business.name}. They will respond with
          product information, pricing or availability.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${business.slug}/products`}
            className={`${websiteTheme?.radius || "rounded-xl"} px-6 py-3 text-sm font-bold transition hover:opacity-90`}
            style={{
              backgroundColor: theme.accent,
              color: "#101820",
            }}
          >
            Browse More Products
          </Link>

          <Link
            href={`/${business.slug}`}
            className={`${websiteTheme?.radius || "rounded-xl"} px-6 py-3 text-sm font-bold text-white transition hover:opacity-90`}
            style={{ backgroundColor: theme.primary }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
      <div
        className={`${websiteTheme?.radius || "rounded-3xl"} ${
          websiteTheme?.cardStyle || "bg-white"
        } p-6 md:p-8 ${websiteTheme?.shadow || "shadow-sm"}`}
      >
        <h2
          className={`text-2xl font-black text-slate-950 ${
            websiteTheme?.heading || ""
          }`}
        >
          Your Quote Details
        </h2>

        <p
          className={`mt-2 text-sm leading-6 ${
            websiteTheme?.subheading || "text-slate-600"
          }`}
        >
          Fill in your contact details and {business.name} will respond with
          product information, pricing or availability.
        </p>

        <form onSubmit={submitEnquiry} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              required
              label="Your Name"
              websiteTheme={websiteTheme}
              value={form.customer_name}
              onChange={(e) =>
                setForm({ ...form, customer_name: e.target.value })
              }
            />

            <Input
              label="Company Name"
              websiteTheme={websiteTheme}
              value={form.company_name}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
            />

            <Input
              required
              type="email"
              label="Email Address"
              websiteTheme={websiteTheme}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              label="Phone Number"
              websiteTheme={websiteTheme}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">
              Message
            </label>

            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Add any notes, required quantities, delivery location or special requirements..."
              className={`w-full ${
                websiteTheme?.radius || "rounded-xl"
              } border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200`}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className={`w-full ${
              websiteTheme?.radius || "rounded-xl"
            } px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0`}
            style={{
              backgroundColor: theme.accent,
              color: "#101820",
            }}
          >
            {submitting ? "Submitting Enquiry..." : "Submit Enquiry"}
          </button>
        </form>
      </div>

      <div
        className={`${websiteTheme?.radius || "rounded-3xl"} ${
          websiteTheme?.cardStyle || "bg-white"
        } h-fit p-6 md:p-8 ${websiteTheme?.shadow || "shadow-sm"}`}
      >
        <h2
          className={`text-2xl font-black text-slate-950 ${
            websiteTheme?.heading || ""
          }`}
        >
          Selected Products
        </h2>

        <p
          className={`mt-2 text-sm ${
            websiteTheme?.subheading || "text-slate-600"
          }`}
        >
          {items.length} product{items.length === 1 ? "" : "s"} selected for enquiry.
        </p>

        {items.length === 0 ? (
          <div
            className={`mt-6 ${
              websiteTheme?.radius || "rounded-2xl"
            } border border-dashed border-slate-300 p-8 text-center`}
          >
            <h3 className="font-black text-slate-950">
              Your product enquiry is empty
            </h3>

            <p
              className={`mt-2 text-sm ${
                websiteTheme?.subheading || "text-slate-600"
              }`}
            >
              Browse products and add items you want information, pricing or availability for.
            </p>

            <Link
              href={`/${business.slug}/products`}
              className={`${websiteTheme?.radius || "rounded-xl"} mt-5 inline-block px-5 py-3 text-sm font-bold transition hover:opacity-90`}
              style={{
                backgroundColor: theme.accent,
                color: "#101820",
              }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`${websiteTheme?.radius || "rounded-2xl"} border border-slate-200 bg-slate-50 p-4`}
              >
                <div className="flex gap-4">
                  <div
                    className={`h-16 w-16 shrink-0 overflow-hidden ${
                      websiteTheme?.radius || "rounded-xl"
                    } bg-white`}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className={`h-full w-full object-cover ${
                          websiteTheme?.imageStyle || ""
                        }`}
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      className={`truncate font-black text-slate-950 ${
                        websiteTheme?.heading || ""
                      }`}
                    >
                      {item.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.code || "No code"} · {item.category || "Product"}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, e.target.value)
                        }
                        className={`w-20 ${
                          websiteTheme?.radius || "rounded-xl"
                        } border border-slate-300 px-3 py-2 text-sm font-semibold`}
                      />

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-sm font-bold text-red-600 transition hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={clearCart}
              className="text-sm font-bold text-slate-500 transition hover:text-slate-800"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, websiteTheme, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      <input
        {...props}
        className={`w-full ${
          websiteTheme?.radius || "rounded-xl"
        } border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200`}
      />
    </div>
  );
}
