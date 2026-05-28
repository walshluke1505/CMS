import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function getPublicBusiness() {
  const headersList = await headers();
  const host = headersList.get("host");

  let query = supabase.from("businesses").select("*");

  if (host?.includes("localhost")) {
    query = query.eq("slug", "cual");
  } else {
    query = query.eq("domain", host);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}