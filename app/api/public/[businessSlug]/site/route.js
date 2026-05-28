import { supabase } from "@/lib/supabase";
import {
  getActiveProducts,
  getBusinessContent,
  getPublicBusiness,
  publicBusinessFields,
  publicContentFields,
  publicProductFields,
} from "../_helpers";

export async function GET(_request, { params }) {
  const { businessSlug } = await params;
  const { business, error, status } = await getPublicBusiness(businessSlug);

  if (error) {
    return Response.json({ error }, { status: status || 404 });
  }

  const content = await getBusinessContent(business.id);
  const { products, error: productsError } = await getActiveProducts(
    business.id,
    6
  );

  if (productsError) {
    return Response.json({ error: productsError.message }, { status: 500 });
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug, description, created_at")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (categoriesError) {
    return Response.json({ error: categoriesError.message }, { status: 500 });
  }

  return Response.json({
    business: publicBusinessFields(business),
    content: publicContentFields(content),
    categories: categories || [],
    featured_products: products.map(publicProductFields),
  });
}
