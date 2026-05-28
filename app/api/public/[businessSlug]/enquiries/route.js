import { supabase } from "@/lib/supabase";
import { getPublicBusiness } from "../_helpers";

export async function POST(request, { params }) {
  const { businessSlug } = await params;
  const { business, error, status } = await getPublicBusiness(businessSlug);

  if (error) {
    return Response.json({ error }, { status: status || 404 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    customer_name,
    company_name,
    email,
    phone,
    message,
    products = [],
  } = body || {};

  if (!customer_name && !email && !phone && !message) {
    return Response.json(
      { error: "Please provide contact details or a message." },
      { status: 400 }
    );
  }

  if (!customer_name || !email) {
    return Response.json(
      { error: "Customer name and email are required." },
      { status: 400 }
    );
  }

  const payload = {
    business_id: business.id,
    customer_name,
    company_name: company_name || "",
    email,
    phone: phone || "",
    message: message || "",
    products: Array.isArray(products) ? products : [],
    status: "new",
    source: "custom_frontend",
  };

  let result = await supabase.from("enquiries").insert(payload).select("id").single();

  if (result.error?.message?.includes("source")) {
    const payloadWithoutSource = { ...payload };
    delete payloadWithoutSource.source;

    result = await supabase
      .from("enquiries")
      .insert(payloadWithoutSource)
      .select("id")
      .single();
  }

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    enquiry_id: result.data?.id,
  });
}
