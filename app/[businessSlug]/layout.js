import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBusinessBySlug } from "@/lib/business";
import { getBusinessTheme } from "@/lib/theme";
import { getWebsiteTheme } from "@/lib/websiteTheme";

import { QuoteCartProvider } from "@/context/QuoteCartContext";

import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

export default async function BusinessPublicLayout({
  children,
  params,
}) {
  const { businessSlug } = await params;

  const { business } = await getBusinessBySlug(businessSlug);

  if (!business) {
    notFound();
  }

  const theme = getBusinessTheme(business);

  const { data: content } = await supabase
    .from("business_content")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  const websiteTheme = getWebsiteTheme(content);

  return (
    <QuoteCartProvider businessSlug={business.slug}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-950">
        <PublicHeader
          business={business}
          theme={theme}
          content={content}
          websiteTheme={websiteTheme}
        />

        <main>{children}</main>

        <PublicFooter
          business={business}
          theme={theme}
          content={content}
          websiteTheme={websiteTheme}
        />
      </div>
    </QuoteCartProvider>
  );
}