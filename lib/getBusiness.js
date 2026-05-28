import { supabase } from "@/lib/supabase";

export async function getCurrentBusiness() {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("business_users")
    .select(`
      role,
      businesses (
        id,
        name,
        slug,
        domain,
        logo_url,
        primary_color,
        accent_color
      )
    `)
    .eq("user_id", userData.user.id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return {
    role: data.role,
    business: data.businesses,
  };
}