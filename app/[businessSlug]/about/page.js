import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBusinessBySlug } from "@/lib/business";
import { getBusinessTheme } from "@/lib/theme";
import { getWebsiteTheme } from "@/lib/websiteTheme";
import PublicButton from "@/components/public/PublicButton";

export async function generateMetadata({ params }) {
  const { businessSlug } = await params;

  const { business } = await getBusinessBySlug(businessSlug);

  if (!business) {
    return {
      title: "About Not Found",
    };
  }

  const { data: content } = await supabase
    .from("business_content")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  const title =
    content?.about_meta_title ||
    `${content?.about_page_title || `About ${business.name}`} | ${
      business.name
    }`;

  const description =
    content?.about_meta_description ||
    content?.about_page_subtitle ||
    `Learn more about ${business.name} and its product offering.`;

  const image =
    content?.og_image_url ||
    content?.about_image_url ||
    business.logo_url ||
    "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function BusinessAboutPage({ params }) {
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

  const title = content?.about_page_title || `About ${business.name}`;

  const subtitle =
    content?.about_page_subtitle ||
    "Learn more about the business, services and product offering.";

  const body =
    content?.about_page_body ||
    "This business has not added its about page content yet.";

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
            About
          </p>

          <h1
            className={`max-w-4xl text-5xl font-black tracking-tight md:text-6xl ${websiteTheme.heading}`}
          >
            {title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
            {subtitle}
          </p>
        </div>
      </section>

      <section
        className={`mx-auto grid ${websiteTheme.container} gap-10 px-6 ${websiteTheme.sectionSpacing} md:grid-cols-[0.9fr_1.1fr] md:items-start`}
      >
        <div
          className={`overflow-hidden ${websiteTheme.radius} ${websiteTheme.cardStyle} ${websiteTheme.shadow}`}
        >
          {content?.about_image_url ? (
            <img
              src={content.about_image_url}
              alt={title}
              className={`h-[420px] w-full object-cover ${websiteTheme.imageStyle || ""}`}
            />
          ) : (
            <div className="flex h-[420px] items-center justify-center bg-slate-100 text-sm font-semibold text-slate-400">
              About image
            </div>
          )}
        </div>

        <div
          className={`${websiteTheme.radius} ${websiteTheme.cardStyle} p-8 ${websiteTheme.shadow}`}
        >
          <h2
            className={`text-3xl font-black text-slate-950 ${websiteTheme.heading}`}
          >
            {title}
          </h2>

          <p
            className={`mt-6 whitespace-pre-wrap text-lg leading-8 ${websiteTheme.subheading}`}
          >
            {body}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <PublicButton
              href={`/${business.slug}/products`}
              theme={theme}
              variant="accent"
            >
              View Products
            </PublicButton>

            <PublicButton
              href={`/${business.slug}/request-quote`}
              theme={theme}
              variant="primary"
            >
              Request Quote
            </PublicButton>
          </div>
        </div>
      </section>

      <section
        className={`mx-auto ${websiteTheme.container} px-6 pb-14`}
      >
        <div className="grid gap-6 md:grid-cols-3">
          <InfoCard
            websiteTheme={websiteTheme}
            title="Product Catalogue"
            text="Browse active products and view product details."
          />

          <InfoCard
            websiteTheme={websiteTheme}
            title="Product Enquiries"
            text="Contact the team for product information, pricing and availability."
          />

          <InfoCard
            websiteTheme={websiteTheme}
            title="Business Contact"
            text="Use the contact page to reach the business directly."
          />
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, text, websiteTheme }) {
  return (
    <div
      className={`${websiteTheme.radius} ${websiteTheme.cardStyle} p-6 ${websiteTheme.shadow}`}
    >
      <h3
        className={`text-xl font-black text-slate-950 ${websiteTheme.heading}`}
      >
        {title}
      </h3>

      <p
        className={`mt-3 text-sm leading-6 ${websiteTheme.subheading}`}
      >
        {text}
      </p>
    </div>
  );
}
