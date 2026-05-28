"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const QuoteCartContext = createContext(null);

export function QuoteCartProvider({ businessSlug, children }) {
  const storageKey = `quote-cart-${businessSlug}`;
  const [items, setItems] = useState([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedCart = localStorage.getItem(storageKey);

      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch {
          setItems([]);
        }
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  function addItem(product) {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentItems,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          code: product.code,
          image_url: product.image_url,
          category: product.categories?.name || product.category || "",
          quantity: 1,
        },
      ];
    });
  }

  function removeItem(productId) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId)
    );
  }

  function updateQuantity(productId, quantity) {
    const safeQuantity = Number(quantity);

    if (safeQuantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId ? { ...item, quantity: safeQuantity } : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  return (
    <QuoteCartContext.Provider
      value={{
        items,
        totalItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </QuoteCartContext.Provider>
  );
}

export function useQuoteCart() {
  const context = useContext(QuoteCartContext);

  if (!context) {
    throw new Error("useQuoteCart must be used inside QuoteCartProvider");
  }

  return context;
}
