import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBusinessBySlug } from "@/lib/business";
import { getBusinessTheme } from "@/lib/theme";
import { getWebsiteTheme } from "@/lib/websiteTheme";

export async function generateMetadata({ params }) {
  const { businessSlug } = await params;

  const { business } = await getBusinessBySlug(businessSlug);

  if (!business) {
    return {
      title: "Contact Not Found",
    };
  }

  const { data: content } = await supabase
    .from("business_content")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  const title =
    content?.contact_meta_title ||
    `${content?.contact_page_title || `Contact ${business.name}`} | ${
      business.name
    }`;

  const description =
    content?.contact_meta_description ||
    content?.contact_page_subtitle ||
    `Contact ${business.name} or submit a product quote enquiry.`;

  const image =
    content?.og_image_url ||
    content?.hero_image_url ||
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

export default async function BusinessContactPage({ params }) {
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

  const title =
    content?.contact_page_title || `Get in touch with ${business.name}.`;

  const subtitle =
    content?.contact_page_subtitle ||
    "Contact the business directly for product information, pricing or availability.";

  return (
    <main className={websiteTheme.pageBg || "bg-white"}>
      <section
        className="relative overflow-hidden bg-[#101820] px-6 py-20 text-white md:py-24"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,24,32,0.94),rgba(16,24,32,0.72)),radial-gradient(circle_at_top_right,rgba(242,169,0,0.2),transparent_34%)]" />

        <div className={`relative mx-auto ${websiteTheme.container}`}>
          <p
            className="mb-4 text-sm font-bold uppercase tracking-[0.25em]"
            style={{ color: theme.accent }}
          >
            Contact
          </p>

          <h1
            className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl"
          >
            {title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            {subtitle}
          </p>
        </div>
      </section>

      <section
        className={`mx-auto grid ${websiteTheme.container} gap-8 px-6 ${websiteTheme.sectionSpacing} lg:grid-cols-[0.9fr_1.1fr]`}
      >
        <div className="space-y-8">
          <div
            className={`${websiteTheme.radius} ${websiteTheme.cardStyle} p-8 ${websiteTheme.shadow}`}
          >
            <h2
              className="text-3xl font-black tracking-tight text-slate-950"
            >
              Contact Details
            </h2>

            <div className="mt-8 space-y-6">
              <ContactItem
                websiteTheme={websiteTheme}
                label="Business"
                value={business.name}
              />

              <ContactItem
                websiteTheme={websiteTheme}
                label="Email"
                value={business.contact_email || "No email added"}
              />

              <ContactItem
                websiteTheme={websiteTheme}
                label="Phone"
                value={business.phone || "No phone added"}
              />

              <ContactItem
                websiteTheme={websiteTheme}
                label="Address"
                value={business.address || "No address added"}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {business.contact_email && (
                <a
                  href={`mailto:${business.contact_email}`}
                  className={`${websiteTheme.radius} inline-flex items-center justify-center px-5 py-3 text-sm font-bold transition hover:opacity-90`}
                  style={{
                    backgroundColor: theme.accent,
                    color: "#101820",
                  }}
                >
                  Email Business
                </a>
              )}

              <Link
                href={`/${business.slug}/request-quote`}
                className={`${websiteTheme.radius} inline-flex items-center justify-center px-5 py-3 text-sm font-bold text-white transition hover:opacity-90`}
                style={{ backgroundColor: theme.primary }}
              >
                Request Quote
              </Link>
            </div>
          </div>

          {content?.business_hours && (
            <div
              className={`${websiteTheme.radius} ${websiteTheme.cardStyle} p-8 ${websiteTheme.shadow}`}
            >
              <h2
                className={`text-2xl font-black text-slate-950 ${websiteTheme.heading}`}
              >
                Business Hours
              </h2>

              <p
                className={`mt-4 whitespace-pre-wrap text-sm leading-7 ${websiteTheme.subheading}`}
              >
                {content.business_hours}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div
            className={`${websiteTheme.radius} ${websiteTheme.cardStyle} p-8 ${websiteTheme.shadow}`}
          >
            <h2
              className="text-3xl font-black tracking-tight text-slate-950"
            >
              Request product pricing
            </h2>

            <p
              className={`mt-4 text-lg leading-8 ${websiteTheme.subheading}`}
            >
              The fastest way to get pricing and availability is to contact the
              team with the products you are interested in.
            </p>

            {content?.contact_extra_text && (
              <div
                className={`mt-6 ${websiteTheme.radius} bg-slate-100 p-5`}
              >
                <p
                  className={`whitespace-pre-wrap text-sm leading-7 ${websiteTheme.subheading}`}
                >
                  {content.contact_extra_text}
                </p>
              </div>
            )}

            <div
              className={`mt-8 ${websiteTheme.radius} bg-slate-100 p-6`}
            >
              <h3
                className={`text-xl font-black text-slate-950 ${websiteTheme.heading}`}
              >
                How it works
              </h3>

              <div className="mt-5 grid gap-3">
                <StepItem number="1" text="Browse the product catalogue." />
                <StepItem number="2" text="Tell us which products you need." />
                <StepItem number="3" text="Submit your details and the business will respond." />
              </div>
            </div>

            <Link
              href={`/${business.slug}/products`}
              className={`${websiteTheme.radius} mt-8 inline-flex items-center justify-center px-6 py-3 text-sm font-bold transition hover:opacity-90`}
              style={{
                backgroundColor: theme.accent,
                color: "#101820",
              }}
            >
              Browse Products
            </Link>
          </div>

          {content?.map_embed_url && (
            <div
              className={`overflow-hidden ${websiteTheme.radius} ${websiteTheme.cardStyle} p-3 ${websiteTheme.shadow}`}
            >
              <iframe
                src={content.map_embed_url}
                className={`h-80 w-full border-0 ${websiteTheme.radius}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ContactItem({ label, value, websiteTheme }) {
  return (
    <div className="border-b border-slate-100 pb-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-base font-semibold leading-7 ${websiteTheme.subheading}`}
      >
        {value}
      </p>
    </div>
  );
}

function StepItem({ number, text }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-600">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
        {number}
      </span>
      <span className="font-semibold">{text}</span>
    </div>
  );
}
