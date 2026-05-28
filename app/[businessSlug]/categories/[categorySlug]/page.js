import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBusinessBySlug } from "@/lib/business";
import { getBusinessTheme } from "@/lib/theme";
import { getWebsiteTheme } from "@/lib/websiteTheme";
import PublicProductCard from "@/components/public/PublicProductCard";

export async function generateMetadata({ params }) {
  const { businessSlug, categorySlug } = await params;
  const { business } = await getBusinessBySlug(businessSlug);

  if (!business) {
    return {
      title: "Category Not Found",
    };
  }

  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("business_id", business.id)
    .eq("slug", categorySlug)
    .maybeSingle();

  return {
    title: `${category?.name || "Category"} | ${business.name}`,
    description: `Browse ${category?.name || "category"} products from ${
      business.name
    }.`,
  };
}

export default async function BusinessCategoryPage({ params }) {
  const { businessSlug, categorySlug } = await params;
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

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", business.id)
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (
        id,
        name,
        slug
      )
    `
    )
    .eq("business_id", business.id)
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <main className={websiteTheme.pageBg || "bg-white"}>
      <section
        className="relative overflow-hidden bg-[#101820] px-6 py-20 text-white md:py-24"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,24,32,0.94),rgba(16,24,32,0.72)),radial-gradient(circle_at_top_right,rgba(242,169,0,0.2),transparent_34%)]" />

        <div className={`relative mx-auto ${websiteTheme.container}`}>
          <Link
            href={`/${business.slug}/products`}
            className="mb-8 inline-flex font-bold transition hover:opacity-70"
            style={{ color: theme.accent }}
          >
            ← Back to Products
          </Link>

          <p
            className="mb-4 text-sm font-bold uppercase tracking-[0.25em]"
            style={{ color: theme.accent }}
          >
            Product Category
          </p>

          <h1
            className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl"
          >
            {category.name}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Browse active products in this category and request product pricing
            or datasheets.
          </p>
        </div>
      </section>

      <section className={`mx-auto ${websiteTheme.container} px-6 ${websiteTheme.sectionSpacing}`}>
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2
              className="text-3xl font-black tracking-tight text-slate-950"
            >
              {products?.length || 0} product
              {(products?.length || 0) === 1 ? "" : "s"} found
            </h2>
            <p className={`mt-2 text-sm ${websiteTheme.subheading}`}>
              Only active public catalogue products are shown.
            </p>
          </div>

          <Link
            href={`/${business.slug}/categories`}
            className={`${websiteTheme.radius} inline-flex items-center justify-center border border-slate-300 bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-slate-50`}
            style={{ color: theme.primary }}
          >
            All Categories
          </Link>
        </div>

        {products?.length === 0 ? (
          <div
            className={`${websiteTheme.radius} ${websiteTheme.cardStyle} p-10 text-center ${websiteTheme.shadow}`}
          >
            <h2 className="text-2xl font-black text-slate-950">
              No active products in this category
            </h2>
            <p className={`mt-3 text-sm leading-6 ${websiteTheme.subheading}`}>
              Try another category or browse the full product catalogue.
            </p>
            <Link
              href={`/${business.slug}/products`}
              className={`${websiteTheme.radius} mt-6 inline-flex items-center justify-center px-5 py-3 text-sm font-bold transition hover:opacity-90`}
              style={{
                backgroundColor: theme.accent,
                color: "#101820",
              }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products?.map((product) => (
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
