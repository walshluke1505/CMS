import { supabase } from "@/lib/supabase";
import { getPublicBusiness } from "../_helpers";

export async function GET(_request, { params }) {
  const { businessSlug } = await params;
  const { business, error, status } = await getPublicBusiness(businessSlug);

  if (error) {
    return Response.json({ error }, { status: status || 404 });
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug, description, created_at")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (categoriesError) {
    return Response.json({ error: categoriesError.message }, { status: 500 });
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, category_id")
    .eq("business_id", business.id)
    .eq("is_active", true);

  const counts = (products || []).reduce((result, product) => {
    if (!product.category_id) return result;
    result[product.category_id] = (result[product.category_id] || 0) + 1;
    return result;
  }, {});

  return Response.json({
    categories: (categories || []).map((category) => ({
      ...category,
      active_product_count: counts[category.id] || 0,
    })),
  });
}
