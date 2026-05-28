"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, removeFromCart } from "@/lib/cart";

export default function CartContent() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCart(getCart());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleRemove(id) {
    removeFromCart(id);
    setCart(getCart());
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-3xl font-black">Selected Products</h2>

        {cart.length === 0 ? (
          <p className="text-slate-600">Your enquiry cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 rounded-2xl bg-slate-100 p-5 font-semibold"
              >
                <div>
                  <p>{item.name}</p>
                  <p className="text-sm text-slate-500">
                    Code: {item.code || "N/A"} · Qty: {item.quantity}
                  </p>
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <Link
            href="/request-quote"
            className="mt-8 inline-block rounded-full bg-[#f2a900] px-8 py-3 font-bold text-[#101820]"
          >
            Continue to Request Quote
          </Link>
        )}
      </div>
    </section>
  );
}
