import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();
    const { business_id, product_id, session_id } = body;

    if (!business_id || !product_id) {
      return Response.json({ tracked: false }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", product_id)
      .eq("business_id", business_id)
      .eq("is_active", true)
      .maybeSingle();

    if (productError || !product) {
      return Response.json({ tracked: false }, { status: 200 });
    }

    const { error } = await supabase.from("product_views").insert({
      business_id,
      product_id,
      session_id: session_id || null,
    });

    if (error) {
      return Response.json({ tracked: false }, { status: 200 });
    }

    return Response.json({ tracked: true });
  } catch {
    return Response.json({ tracked: false }, { status: 200 });
  }
}
