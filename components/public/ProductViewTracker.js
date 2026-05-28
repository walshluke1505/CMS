"use client";

import { useEffect } from "react";

export default function ProductViewTracker({ businessId, productId }) {
  useEffect(() => {
    if (!businessId || !productId) return;

    const storageKey = "cms_public_session_id";
    let sessionId = window.localStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
      window.localStorage.setItem(storageKey, sessionId);
    }

    fetch("/api/product-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_id: businessId,
        product_id: productId,
        session_id: sessionId,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [businessId, productId]);

  return null;
}
