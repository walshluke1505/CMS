import { supabase } from "@/lib/supabase";

export async function getLoggedInUser() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  return session.user;
}

export async function getUserBusiness() {
  const user = await getLoggedInUser();

  if (!user) {
    return {
      user: null,
      business: null,
      role: null,
      error: "not_logged_in",
    };
  }

  const { data, error } = await supabase
    .from("business_users")
    .select(`
      role,
      created_at,
      businesses (
        id,
        name,
        slug,
        domain,
        logo_url,
        primary_color,
        accent_color,
        contact_email,
        phone,
        address
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const link = data?.[0];

  if (error || !link?.businesses) {
    return {
      user,
      business: null,
      role: null,
      error: "no_business_linked",
    };
  }

  return {
    user,
    business: link.businesses,
    role: link.role,
    error: null,
  };
}

export function canManageSettings(role) {
  return role === "admin";
}

export function canDelete(role) {
  return role === "admin";
}

export function canEdit(role) {
  return role === "admin" || role === "editor";
}