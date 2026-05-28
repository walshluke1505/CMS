import { supabase } from "@/lib/supabase";
import {
  getPublicBusiness,
  publicProductFields,
} from "../../_helpers";

export async function GET(_request, { params }) {
  const { businessSlug, productSlug } = await params;
  const { business, error, status } = await getPublicBusiness(businessSlug);

  if (error) {
    return Response.json({ error }, { status: status || 404 });
  }

  const { data: product, error: productError } = await supabase
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
    .eq("business_id", business.id)
    .eq("slug", productSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (productError) {
    return Response.json({ error: productError.message }, { status: 500 });
  }

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  const { data: related } = await supabase
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
    .eq("business_id", business.id)
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(4);

  return Response.json({
    product: publicProductFields(product),
    related_products: (related || []).map(publicProductFields),
  });
}
