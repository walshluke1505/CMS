"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart } from "@/lib/cart";

export default function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function updateCount() {
      const cart = getCart();
      const total = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
      setCount(total);
    }

    updateCount();

    window.addEventListener("storage", updateCount);
    window.addEventListener("cartUpdated", updateCount);

    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("cartUpdated", updateCount);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className="rounded-full bg-[#f2a900] px-5 py-2.5 text-sm font-bold text-[#101820] shadow-sm"
    >
      Enquiry Cart {count > 0 ? `(${count})` : ""}
    </Link>
  );
}