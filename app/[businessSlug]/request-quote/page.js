import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getBusinessBySlug } from "@/lib/business";
import { getBusinessTheme } from "@/lib/theme";
import { getWebsiteTheme } from "@/lib/websiteTheme";
import QuoteRequestForm from "@/components/public/QuoteRequestForm";

export async function generateMetadata({ params }) {
  const { businessSlug } = await params;

  const { business } = await getBusinessBySlug(businessSlug);

  if (!business) {
    return {
      title: "Enquiry Not Found",
    };
  }

  return {
    title: `Product Enquiry | ${business.name}`,
    description: `Submit a product enquiry to ${business.name}.`,
  };
}

export default async function RequestQuotePage({ params }) {
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
    <main className={websiteTheme.pageBg || "bg-white"}>
      <section
        className={`relative overflow-hidden text-white ${websiteTheme.heroSpacing} ${websiteTheme.heroBg}`}
      >
        <div className={`absolute inset-0 ${websiteTheme.heroOverlay || ""}`} />

        <div className={`relative mx-auto ${websiteTheme.container} px-6`}>
          <p
            className="mb-4 text-sm font-bold uppercase tracking-[0.25em]"
            style={{ color: theme.accent }}
          >
            Product Enquiry
          </p>

          <h1
            className={`max-w-4xl text-5xl font-black tracking-tight md:text-6xl ${websiteTheme.heading}`}
          >
            Send a product enquiry.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
            Review selected products, add your contact details and send your
            enquiry directly to {business.name}.
          </p>

          <Link
            href={`/${business.slug}/products`}
            className={`${websiteTheme.radius} mt-8 inline-block border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10`}
          >
            ← Continue Browsing Products
          </Link>
        </div>
      </section>

      <section className={`mx-auto ${websiteTheme.container} px-6 ${websiteTheme.sectionSpacing}`}>
        <QuoteRequestForm
          business={business}
          theme={theme}
          websiteTheme={websiteTheme}
        />
      </section>
    </main>
  );
}
