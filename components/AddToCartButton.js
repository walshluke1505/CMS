"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useQuoteCart } from "@/context/QuoteCartContext";

export default function AddToCartButton({
  product,
  quoteHref = "../request-quote",
  compact = false,
}) {
  const { addItem } = useQuoteCart();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    for (let i = 0; i < safeQuantity; i++) {
      addItem(product);
    }

    setAdded(true);
    toast.success("Added to product enquiry");

    setTimeout(() => {
      setAdded(false);
    }, 3000);
  }

  return (
    <div
      className={
        compact
          ? "rounded-2xl bg-slate-50 p-4"
          : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      }
    >
      {!compact && (
        <>
          <h3 className="mb-3 text-lg font-black text-slate-950">
            Add to product enquiry
          </h3>

          <p className="mb-5 text-sm leading-6 text-slate-600">
            Add this product to your enquiry list before contacting the team.
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold"
        />

        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-100"
        >
          Add to Product Enquiry
        </button>

        {added && (
          <Link href={quoteHref} className="font-bold text-[#1f5f8b]">
            View Product Enquiry →
          </Link>
        )}
      </div>
    </div>
  );
}
