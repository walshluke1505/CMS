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
      title: "Categories Not Found",
    };
  }

  return {
    title: `Product Categories | ${business.name}`,
    description: `Browse product categories from ${business.name}.`,
  };
}

export default async function BusinessCategoriesPage({ params }) {
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

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  const { data: products } = await supabase
    .from("products")
    .select("id, category_id")
    .eq("business_id", business.id)
    .eq("is_active", true);

  const productCounts = (products || []).reduce((counts, product) => {
    if (!product.category_id) return counts;
    counts[product.category_id] = (counts[product.category_id] || 0) + 1;
    return counts;
  }, {});

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
            Categories
          </p>

          <h1
            className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl"
          >
            Browse product categories.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Explore the product range by category and open active catalogue
            products for details, datasheets and quote enquiries.
          </p>
        </div>
      </section>

      <section className={`mx-auto ${websiteTheme.container} px-6 ${websiteTheme.sectionSpacing}`}>
        {categories?.length === 0 ? (
          <div
            className={`${websiteTheme.radius} ${websiteTheme.cardStyle} p-10 text-center ${websiteTheme.shadow}`}
          >
            <h2 className="text-2xl font-black text-slate-950">
              No categories yet
            </h2>
            <p className={`mt-3 text-sm leading-6 ${websiteTheme.subheading}`}>
              Categories added in the CMS will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories?.map((category) => {
              const count = productCounts[category.id] || 0;

              return (
                <Link
                  key={category.id}
                  href={`/${business.slug}/categories/${category.slug}`}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <p
                    className="mb-4 text-sm font-bold uppercase tracking-[0.22em]"
                    style={{ color: theme.accent }}
                  >
                    {count} active product{count === 1 ? "" : "s"}
                  </p>
                  <h2
                    className="text-2xl font-black tracking-tight text-slate-950"
                  >
                    {category.name}
                  </h2>
                  <p className={`mt-3 text-sm leading-6 ${websiteTheme.subheading}`}>
                    View products, datasheets and quote options in this
                    category.
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
