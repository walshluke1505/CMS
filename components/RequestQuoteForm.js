"use client";

import { useState } from "react";
import { getCart, clearCart } from "@/lib/cart";

export default function RequestQuoteForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch("/api/send-enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          products: getCart(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Something went wrong.");
        return;
      }

      setSuccess(true);
      clearCart();

      setForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        message: "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-3xl font-black text-[#1f5f8b]">
          Customer Details
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            required
            className="rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Company Name"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />

          <input
            required
            type="email"
            className="rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            className="rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <textarea
          className="mt-4 h-40 w-full rounded-xl border border-slate-300 px-4 py-3"
          placeholder="Additional requirements or message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />

        <button
          disabled={loading}
          className="mt-6 rounded-full bg-[#f2a900] px-8 py-3 font-bold text-[#101820]"
        >
          {loading ? "Sending..." : "Submit Quote Request"}
        </button>

        {success && (
          <p className="mt-6 font-bold text-green-600">
            Quote request sent successfully.
          </p>
        )}
      </form>
    </section>
  );
}