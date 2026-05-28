import { supabase } from "@/lib/supabase";

export async function getBusinessProducts(businessId) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (
        id,
        name,
        slug
      )
    `
    )
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return {
    products: data || [],
    error: error?.message || null,
  };
}

export async function getFeaturedProducts(businessId, limit = 6) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (
        id,
        name,
        slug
      )
    `
    )
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    products: data || [],
    error: error?.message || null,
  };
}

export async function getProductBySlug(businessId, productSlug) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (
        id,
        name,
        slug
      )
    `
    )
    .eq("business_id", businessId)
    .eq("slug", productSlug)
    .eq("is_active", true)
    .maybeSingle();

  return {
    product: data || null,
    error: error?.message || null,
  };
}

export async function getBusinessCategories(businessId) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  return {
    categories: data || [],
    error: error?.message || null,
  };
}