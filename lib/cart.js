export function getCart() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("enquiryCart") || "[]");
}

export function saveCart(cart) {
  localStorage.setItem("enquiryCart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      code: product.code,
      slug: product.slug,
      quantity,
    });
  }

  saveCart(cart);
}

export function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
}

export function clearCart() {
  localStorage.removeItem("enquiryCart");
}