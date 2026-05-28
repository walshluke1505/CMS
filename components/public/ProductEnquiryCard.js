"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function ProductEnquiryCard({
  business,
  product,
  theme,
  websiteTheme,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    message: "",
  });

  async function submitEnquiry(e) {
    e.preventDefault();

    if (!form.customer_name || (!form.email && !form.phone)) {
      toast.error("Please add your name and either email or phone.");
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
          email: form.email,
          phone: form.phone,
          message:
            form.message ||
            `I'm interested in this product: ${product.name}.`,
          products: [
            {
              id: product.id,
              name: product.name,
              slug: product.slug,
              code: product.code,
              category: product.categories?.name || product.category || "",
              quantity: 1,
            },
          ],
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

      toast.success("Product enquiry sent");
      setSubmitted(true);
      setForm({
        customer_name: "",
        email: "",
        phone: "",
        message: "",
      });
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
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-xl font-black text-slate-950">Enquiry sent</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {business.name} has received your product enquiry and will respond
          directly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">
        Enquire about this product
      </h2>
      <p className={`mt-2 text-sm leading-6 ${websiteTheme?.subheading || "text-slate-600"}`}>
        Send a quick message and the team will contact you with pricing,
        availability or product information.
      </p>

      <form onSubmit={submitEnquiry} className="mt-5 space-y-4">
        <Input
          required
          label="Name"
          value={form.customer_name}
          onChange={(e) =>
            setForm({ ...form, customer_name: e.target.value })
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            type="email"
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Message
          </label>
          <textarea
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={`I'm interested in ${product.name}.`}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: theme.accent,
            color: "#101820",
          }}
        >
          {submitting ? "Sending..." : "Submit Enquiry"}
        </button>
      </form>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}
