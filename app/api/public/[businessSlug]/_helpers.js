import { supabase } from "@/lib/supabase";

export async function getPublicBusiness(businessSlug) {
  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", businessSlug)
    .maybeSingle();

  if (error || !business) {
    return { business: null, error: "Business not found" };
  }

  if (business.api_enabled === false) {
    return { business: null, error: "Public API disabled", status: 403 };
  }

  return { business, error: null };
}

export function publicBusinessFields(business) {
  return {
    name: business.name,
    slug: business.slug,
    logo_url: business.logo_url,
    primary_color: business.primary_color,
    accent_color: business.accent_color,
    contact_email: business.contact_email,
    phone: business.phone,
    address: business.address,
    domain: business.domain,
    website_mode: business.website_mode || "starter",
    custom_frontend_url: business.custom_frontend_url || null,
  };
}

export function publicContentFields(content) {
  if (!content) return null;

  return {
    website_layout: normalizeLayout(content.website_layout),
    website_theme: content.website_theme,
    hero_label: content.hero_label,
    hero_title: content.hero_title,
    hero_subtitle: content.hero_subtitle,
    primary_cta_label: content.primary_cta_label,
    secondary_cta_label: content.secondary_cta_label,
    about_title: content.about_title,
    about_text: content.about_text,
    hero_image_url: content.hero_image_url,
    contact_page_title: content.contact_page_title,
    contact_page_subtitle: content.contact_page_subtitle,
    contact_extra_text: content.contact_extra_text,
    business_hours: content.business_hours,
    footer_tagline: content.footer_tagline,
    footer_service_area: content.footer_service_area,
    footer_note: content.footer_note,
    home_meta_title: content.home_meta_title,
    home_meta_description: content.home_meta_description,
    products_meta_title: content.products_meta_title,
    products_meta_description: content.products_meta_description,
    og_image_url: content.og_image_url,
  };
}

export function publicProductFields(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.categories
      ? {
          id: product.categories.id,
          name: product.categories.name,
          slug: product.categories.slug,
        }
      : product.category
        ? { name: product.category }
        : null,
    code: product.code,
    description: product.description,
    image_url: product.image_url,
    pdf_url: product.pdf_url,
    meta_title: product.meta_title,
    meta_description: product.meta_description,
    created_at: product.created_at,
  };
}

export function normalizeLayout(value) {
  if (value === "corporate-premium") return "modern-catalogue";
  if (value === "visual-showcase") return "industrial-classic";
  if (value === "modern-catalogue") return "modern-catalogue";
  if (value === "minimal-b2b") return "minimal-b2b";
  return "industrial-classic";
}

export async function getBusinessContent(businessId) {
  const { data } = await supabase
    .from("business_content")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  return data || null;
}

export async function getActiveProducts(businessId, limit) {
  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      category,
      category_id,
      code,
      description,
      image_url,
      pdf_url,
      meta_title,
      meta_description,
      created_at,
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

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  return { products: data || [], error };
}
