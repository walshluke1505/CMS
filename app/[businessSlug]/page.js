import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBusinessBySlug } from "@/lib/business";
import { getBusinessCategories, getFeaturedProducts } from "@/lib/products";
import { getBusinessTheme } from "@/lib/theme";
import { getWebsiteTheme } from "@/lib/websiteTheme";
import PublicButton from "@/components/public/PublicButton";
import PublicProductCard from "@/components/public/PublicProductCard";
import DynamicHeroSection from "@/components/website/sections/HeroSection";

function normalizeLayout(value) {
  if (value === "corporate-premium") return "modern-catalogue";
  if (value === "visual-showcase") return "industrial-classic";
  if (value === "modern-catalogue") return "modern-catalogue";
  if (value === "minimal-b2b") return "minimal-b2b";
  return "industrial-classic";
}

export async function generateMetadata({ params }) {
  const { businessSlug } = await params;

  const { business } = await getBusinessBySlug(businessSlug);

  if (!business) {
    return {
      title: "Business Not Found",
    };
  }

  const { data: content } = await supabase
    .from("business_content")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  const title =
    content?.home_meta_title ||
    `${content?.hero_title || business.name} | ${business.name}`;

  const description =
    content?.home_meta_description ||
    content?.hero_subtitle ||
    `Browse products and request a quote from ${business.name}.`;

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

export default async function BusinessHomePage({ params }) {
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
  const { products } = await getFeaturedProducts(business.id, 6);
  const { categories } = await getBusinessCategories(business.id);

  const { data: websiteSections } = await supabase
    .from("website_sections")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true });

  const heroSection = websiteSections?.find(
    (section) => section.section_type === "hero"
  );

  const data = {
    business,
    theme,
    websiteTheme,
    products,
    categories,
    content,
    heroSection,
    heroLabel: content?.hero_label || "Online Product Catalogue",
    heroTitle: content?.hero_title || business.name,
    heroSubtitle:
      content?.hero_subtitle ||
      "Browse products, view datasheets and request a quote directly from the catalogue.",
    aboutTitle: content?.about_title || `About ${business.name}`,
    aboutText:
      content?.about_text ||
      "This business has not added homepage content yet.",
    primaryCta: content?.primary_cta_label || "View Products",
    secondaryCta: content?.secondary_cta_label || "Contact Us",
  };

  const layout = normalizeLayout(content?.website_layout);

  if (layout === "modern-catalogue") return <ModernCatalogueHome {...data} />;
  if (layout === "minimal-b2b") return <MinimalB2BHome {...data} />;

  return <IndustrialClassicHome {...data} />;
}

function IndustrialClassicHome(props) {
  return (
    <main className={props.websiteTheme.pageBg || "bg-white"}>
      <DarkHero {...props} />
      <IndustrialTrustStrip {...props} />
      <AboutBand {...props} />
      <FeaturedProducts {...props} title="Featured Products" industrial />
      <QuoteCta {...props} />
    </main>
  );
}

function ModernCatalogueHome(props) {
  const { business, theme, categories, products, websiteTheme, aboutTitle, aboutText } = props;

  return (
    <main className="bg-white">
      <LightHero {...props} />
      <CatalogueSearchIntro {...props} />

      <section className={`mx-auto ${websiteTheme.container} px-6 py-16`}>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: theme.accent }}>
              Browse by category
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Product Catalogue
            </h2>
          </div>
          <Link href={`/${business.slug}/products`} className="font-bold" style={{ color: theme.primary }}>
            View all products
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              href={`/${business.slug}/categories/${category.slug}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Category
              </p>
              <h3 className="mt-3 text-lg font-black text-slate-950">
                {category.name}
              </h3>
            </Link>
          ))}
          {categories.length === 0 && (
            <EmptyPublicCard title="No categories yet" text="Categories added in the CMS will appear here." />
          )}
        </div>
      </section>

      <ModernProductGrid {...props} title="Catalogue Highlights" />
      <section className={`mx-auto ${websiteTheme.container} px-6 pb-16`}>
        <div className="border-t border-slate-200 pt-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: theme.accent }}>
            About
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black text-slate-950">
            {aboutTitle}
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
            {aboutText}
          </p>
        </div>
      </section>
      {products.length > 0 && <QuoteCta {...props} />}
    </main>
  );
}

function MinimalB2BHome(props) {
  const { business, theme, websiteTheme, heroLabel, heroTitle, heroSubtitle, aboutText, primaryCta } = props;

  return (
    <main className="bg-white">
      <section className={`mx-auto ${websiteTheme.container} px-6 py-16 md:py-24`}>
        <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: theme.accent }}>
          {heroLabel}
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
          {heroTitle}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          {heroSubtitle}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <PublicButton href={`/${business.slug}/products`} theme={theme} variant="accent">
            {primaryCta}
          </PublicButton>
          <Link href={`/${business.slug}/contact`} className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-3 text-sm font-black text-slate-900">
            Request a Quote
          </Link>
        </div>
      </section>

      <section className={`mx-auto ${websiteTheme.container} border-t border-slate-200 px-6 py-12`}>
        <p className="max-w-4xl text-xl leading-9 text-slate-700">{aboutText}</p>
      </section>

      <MinimalProductList {...props} />
      <ContactStrip {...props} />
    </main>
  );
}

function DarkHero(props) {
  const { websiteTheme, heroSection } = props;

  if (heroSection) return <DynamicHeroSection section={heroSection} />;

  return (
    <section className="relative overflow-hidden bg-[#101820] px-6 py-24 text-white md:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,24,32,0.94),rgba(16,24,32,0.72)),radial-gradient(circle_at_top_right,rgba(242,169,0,0.22),transparent_34%)]" />
      <div className={`relative mx-auto ${websiteTheme.container}`}>
        <div className="max-w-4xl">
          <HeroCopy {...props} light noWrapper />
        </div>
      </div>
    </section>
  );
}

function LightHero(props) {
  const { business, theme, websiteTheme, heroSection } = props;

  if (heroSection) return <DynamicHeroSection section={heroSection} />;

  return (
    <section className="border-b border-slate-200 bg-white px-6 py-20">
      <div className={`mx-auto grid ${websiteTheme.container} gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center`}>
        <HeroCopy {...props} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TrustCard label="Products" value="Active catalogue" />
          <TrustCard label="PDFs" value="Datasheet support" />
          <TrustCard label="Quotes" value="Easy enquiries" />
          <Link href={`/${business.slug}/products`} className="rounded-3xl p-6 text-sm font-black text-slate-950" style={{ backgroundColor: theme.accent }}>
            Browse catalogue
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroCopy({ business, theme, heroLabel, heroTitle, heroSubtitle, primaryCta, secondaryCta, light = false, noWrapper = false }) {
  const content = (
    <>
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em]" style={{ color: theme.accent }}>
        {heroLabel}
      </p>
      <h1 className={`max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl ${light ? "text-white" : "text-slate-950"}`}>
        {heroTitle}
      </h1>
      <p className={`mt-6 max-w-2xl text-lg leading-8 ${light ? "text-slate-200" : "text-slate-600"}`}>
        {heroSubtitle}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <PublicButton href={`/${business.slug}/products`} theme={theme} variant="accent" className="w-full px-7 py-4 sm:w-auto">
          {primaryCta}
        </PublicButton>
        <Link
          href={`/${business.slug}/contact`}
          className={`inline-flex w-full items-center justify-center rounded-2xl border px-6 py-3 text-sm font-black transition sm:w-auto ${
            light
              ? "border-white/30 text-white hover:bg-white/10"
              : "border-slate-300 text-slate-900 hover:bg-slate-100"
          }`}
        >
          {secondaryCta}
        </Link>
      </div>
    </>
  );

  if (noWrapper) return content;
  return <div>{content}</div>;
}

function AboutBand({ theme, websiteTheme, aboutTitle, aboutText, imageUrl }) {
  return (
    <section className={`mx-auto ${websiteTheme.container} px-6 py-16`}>
      <div className="grid gap-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em]" style={{ color: theme.accent }}>
            About
          </p>
          <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
            {aboutTitle}
          </h2>
        </div>
        <div>
          <p className="text-base leading-8 text-slate-600 md:text-lg">{aboutText}</p>
          {imageUrl && (
            <img src={imageUrl} alt={aboutTitle} className="mt-6 h-56 w-full rounded-2xl object-cover" />
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedProducts({ business, theme, websiteTheme, products, title, compact = false }) {
  return (
    <section className={`mx-auto ${websiteTheme.container} px-6 ${compact ? "pb-16" : "py-16"}`}>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Active products from this business catalogue.
          </p>
        </div>
        <Link href={`/${business.slug}/products`} className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ color: theme.primary }}>
          View All Products
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyPublicCard title="No products yet" text="Products added in the CMS will appear here." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <PublicProductCard
              key={product.id}
              business={business}
              product={product}
              theme={theme}
              websiteTheme={websiteTheme}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function IndustrialTrustStrip({ websiteTheme, products, categories }) {
  return (
    <section className="bg-[#101820] px-6 pb-10">
      <div className={`mx-auto ${websiteTheme.container}`}>
        <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur md:grid-cols-3">
          <IndustrialStat label="Published Products" value={products.length} />
          <IndustrialStat label="Catalogue Categories" value={categories.length} />
          <IndustrialStat label="Enquiry Ready" value="Quote Requests" />
        </div>
      </div>
    </section>
  );
}

function IndustrialStat({ label, value }) {
  return (
    <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r last:md:border-r-0">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </div>
  );
}

function CatalogueSearchIntro({ business, theme, websiteTheme }) {
  return (
    <section className={`mx-auto ${websiteTheme.container} px-6 pt-10`}>
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Catalogue quick start
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Find products by category, code or product name.
          </h2>
        </div>
        <Link
          href={`/${business.slug}/products`}
          className="inline-flex justify-center rounded-2xl px-5 py-3 text-sm font-black text-slate-950"
          style={{ backgroundColor: theme.accent }}
        >
          Search Catalogue
        </Link>
      </div>
    </section>
  );
}

function ModernProductGrid({ business, theme, websiteTheme, products, title }) {
  return (
    <section className={`mx-auto ${websiteTheme.container} px-6 py-16`}>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Product-first cards for fast browsing.
          </p>
        </div>
      </div>
      {products.length === 0 ? (
        <EmptyPublicCard title="No products yet" text="Products added in the CMS will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/${business.slug}/products/${product.slug}`}
              className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:grid-cols-[120px_1fr]"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>
                  {product.categories?.name || product.category || "Product"}
                </p>
                <h3 className="mt-2 text-lg font-black text-slate-950">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {product.code || "Catalogue item"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function MinimalProductList({ business, products, websiteTheme }) {
  return (
    <section className={`mx-auto ${websiteTheme.container} px-6 py-10`}>
      <div className="border-y border-slate-200">
        {products.length === 0 ? (
          <div className="py-10">
            <EmptyPublicCard title="No products yet" text="Products added in the CMS will appear here." />
          </div>
        ) : (
          products.map((product) => (
            <Link
              key={product.id}
              href={`/${business.slug}/products/${product.slug}`}
              className="grid gap-2 border-b border-slate-200 py-5 last:border-b-0 md:grid-cols-[1fr_180px_120px]"
            >
              <h3 className="font-black text-slate-950">{product.name}</h3>
              <p className="text-sm text-slate-500">
                {product.categories?.name || product.category || "Product"}
              </p>
              <p className="text-sm font-bold text-slate-700">
                {product.code || "View"}
              </p>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function ContactStrip({ business, theme, websiteTheme }) {
  return (
    <section className={`mx-auto ${websiteTheme.container} px-6 pb-16`}>
      <div className="flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-black text-slate-950">
          Need pricing or availability?
        </p>
        <Link
          href={`/${business.slug}/contact`}
          className="inline-flex justify-center rounded-2xl px-5 py-3 text-sm font-black text-slate-950"
          style={{ backgroundColor: theme.accent }}
        >
          Contact the team
        </Link>
      </div>
    </section>
  );
}

function QuoteCta({ business, theme }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="grid gap-6 overflow-hidden rounded-3xl bg-[#101820] p-6 text-white shadow-xl md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em]" style={{ color: theme.accent }}>
            Need product information or pricing?
          </p>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Speak to the team about pricing or availability.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Share product requirements so the team can respond with pricing,
            availability and next steps.
          </p>
        </div>

        <PublicButton href={`/${business.slug}/contact`} theme={theme} variant="accent" className="w-full md:w-auto">
          Contact the Team
        </PublicButton>
      </div>
    </section>
  );
}

function TrustCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function EmptyPublicCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </div>
  );
}
