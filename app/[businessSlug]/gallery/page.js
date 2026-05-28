import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBusinessBySlug } from "@/lib/business";
import { getBusinessProducts } from "@/lib/products";
import { getBusinessTheme } from "@/lib/theme";
import { getWebsiteTheme } from "@/lib/websiteTheme";
import PublicProductCard from "@/components/public/PublicProductCard";

export async function generateMetadata({ params }) {
  const { businessSlug } = await params;

  const { business } = await getBusinessBySlug(businessSlug);

  if (!business) {
    return {
      title: "Gallery Not Found",
    };
  }

  return {
    title: `Gallery | ${business.name}`,
    description: `View product images and catalogue items from ${business.name}.`,
  };
}

export default async function BusinessGalleryPage({ params }) {
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

  const { products } = await getBusinessProducts(business.id);

  const productsWithImages = products.filter((product) => product.image_url);

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
            Gallery
          </p>

          <h1
            className={`max-w-4xl text-5xl font-black tracking-tight md:text-6xl ${websiteTheme.heading}`}
          >
            Product gallery for {business.name}.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
            Browse product images from the active public catalogue.
          </p>
        </div>
      </section>

      <section
        className={`mx-auto ${websiteTheme.container} px-6 ${websiteTheme.sectionSpacing}`}
      >
        {productsWithImages.length === 0 ? (
          <div
            className={`${websiteTheme.radius} border border-dashed border-slate-300 bg-white p-10 text-center ${websiteTheme.shadow}`}
          >
            <h2
              className={`text-2xl font-black text-slate-950 ${websiteTheme.heading}`}
            >
              No gallery images yet
            </h2>

            <p className={`mt-3 text-sm ${websiteTheme.subheading}`}>
              Product images uploaded in the CMS will appear here.
            </p>

            <Link
              href={`/${business.slug}/products`}
              className={`${websiteTheme.radius} mt-6 inline-block px-6 py-3 text-sm font-bold transition hover:opacity-90`}
              style={{
                backgroundColor: theme.accent,
                color: "#101820",
              }}
            >
              View Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {productsWithImages.map((product) => (
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
    </main>
  );
}