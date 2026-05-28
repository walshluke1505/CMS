import { supabase } from "@/lib/supabase";

export async function getBusinessBySlug(slug) {
  if (!slug) {
    return {
      business: null,
      error: "Missing business slug",
    };
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return {
      business: null,
      error: error.message,
    };
  }

  if (!data) {
    return {
      business: null,
      error: "Business not found",
    };
  }

  return {
    business: data,
    error: null,
  };
}