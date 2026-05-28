import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBusinessBySlug } from "@/lib/business";
import { getBusinessTheme } from "@/lib/theme";
import { getWebsiteTheme } from "@/lib/websiteTheme";
import PublicButton from "@/components/public/PublicButton";
import PublicProductCard from "@/components/public/PublicProductCard";

function whatsappUrl(phone) {
  if (!phone) return "";

  const number = phone.replace(/\D/g, "").replace(/^0/, "27");
  const message = encodeURIComponent(
    "Hi, I need help with products from your catalogue."
  );

  return `https://wa.me/${number}?text=${message}`;
}

export async function generateMetadata({ params }) {
  const { businessSlug } = await params;

  const { business } = await getBusinessBySlug(businessSlug);

  if (!business) {
    return {
      title: "Products Not Found",
    };
  }

  const { data: content } = await supabase
    .from("business_content")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  const title = content?.products_meta_title || `Products | ${business.name}`;

  const description =
    content?.products_meta_description ||
    `Browse products and contact ${business.name} for product information.`;

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

export default async function BusinessProductsPage({ params, searchParams }) {
  const { businessSlug } = await params;
  const queryParams = await searchParams;

  const selectedCategory = queryParams?.category || "all";
  const search = queryParams?.search || "";

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

  let productsQuery = supabase
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
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (selectedCategory !== "all") {
    productsQuery = productsQuery.eq("category_id", selectedCategory);
  }

  if (search) {
    productsQuery = productsQuery.or(
      `name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data: products } = await productsQuery;

  function categoryLink(categoryId) {
    const query = new URLSearchParams();

    if (categoryId !== "all") {
      query.set("category", categoryId);
    }

    if (search) {
      query.set("search", search);
    }

    const queryString = query.toString();

    return queryString
      ? `/${business.slug}/products?${queryString}#product-results`
      : `/${business.slug}/products#product-results`;
  }

  const selectedCategoryName =
    selectedCategory === "all"
      ? "Product Range"
      : categories?.find((category) => category.id === selectedCategory)?.name ||
        "Product Range";

  return (
    <main className={websiteTheme.pageBg || "bg-white"}>
      <section
        className="relative overflow-hidden bg-[#101820] px-6 py-20 text-white md:py-24"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,24,32,0.94),rgba(16,24,32,0.7)),radial-gradient(circle_at_top_right,rgba(242,169,0,0.2),transparent_34%)]" />

        <div className={`relative mx-auto ${websiteTheme.container}`}>
          <p
            className="mb-4 text-sm font-bold uppercase tracking-[0.25em]"
            style={{ color: theme.accent }}
          >
            Product Catalogue
          </p>

          <h1
            className="mb-6 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl"
          >
            Product Catalogue
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-slate-200">
            Search products, filter by category and open product detail pages
            for images, descriptions and datasheets.
          </p>
        </div>
      </section>

      <section
        className={`mx-auto grid ${websiteTheme.container} gap-8 px-6 ${websiteTheme.sectionSpacing} lg:grid-cols-[280px_1fr]`}
      >
        <aside
          className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28"
        >
          <h2
            className="mb-5 text-lg font-black tracking-tight"
            style={{ color: theme.primary }}
          >
            Categories
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-semibold text-slate-600 lg:block lg:space-y-3 lg:overflow-visible lg:pb-0">
            <Link
              href={categoryLink("all")}
              className={`${websiteTheme.radius} whitespace-nowrap px-4 py-3 transition hover:opacity-90 lg:block`}
              style={{
                backgroundColor:
                  selectedCategory === "all" ? theme.accent : "#f1f5f9",
                color: selectedCategory === "all" ? "#101820" : "#475569",
              }}
            >
              All Products
            </Link>

            {categories?.map((category) => (
              <Link
                key={category.id}
                href={categoryLink(category.id)}
                className={`${websiteTheme.radius} whitespace-nowrap px-4 py-3 transition hover:opacity-90 lg:block`}
                style={{
                  backgroundColor:
                    selectedCategory === category.id
                      ? theme.accent
                      : "#f1f5f9",
                  color:
                    selectedCategory === category.id ? "#101820" : "#475569",
                }}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className={`mt-8 ${websiteTheme.radius} bg-slate-100 p-4`}>
            <h3 className="mb-2 font-black text-slate-950">Need help?</h3>

            <p className="mb-4 text-sm leading-6 text-slate-600">
              Contact {business.name} for pricing, availability or help choosing
              the right product.
            </p>

            <PublicButton
              href={`/${business.slug}/contact`}
              theme={theme}
              variant="accent"
              className="w-full"
            >
              Contact the Team
            </PublicButton>

            <div className="mt-3 grid gap-2">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-slate-800 ring-1 ring-slate-200"
                >
                  Call Now
                </a>
              )}

              {business.phone && (
                <a
                  href={whatsappUrl(business.phone)}
                  target="_blank"
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  WhatsApp
                </a>
              )}

              {business.contact_email && (
                <a
                  href={`mailto:${business.contact_email}`}
                  className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-slate-800 ring-1 ring-slate-200"
                >
                  Email
                </a>
              )}
            </div>
          </div>
        </aside>

        <div id="product-results">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
              <h2
                className="text-3xl font-black tracking-tight text-slate-950"
              >
                {selectedCategoryName}
              </h2>

              <p className={`mt-2 ${websiteTheme.subheading}`}>
                {products?.length || 0} product
                {(products?.length || 0) === 1 ? "" : "s"} found.
              </p>
            </div>

            <form
              action={`/${business.slug}/products#product-results`}
              className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row"
            >
              {selectedCategory !== "all" && (
                <input type="hidden" name="category" value={selectedCategory} />
              )}

              <input
                name="search"
                defaultValue={search}
                placeholder="Search all products..."
                className="rounded-2xl border border-transparent bg-slate-50 px-5 py-3 text-sm outline-none transition focus:border-slate-300 md:w-72"
              />

              <button
                className="rounded-2xl px-5 py-3 text-sm font-black transition hover:opacity-90"
                style={{
                  backgroundColor: theme.accent,
                  color: "#101820",
                }}
              >
                Search
              </button>
            </form>
          </div>

          {(search || selectedCategory !== "all") && (
            <div className="mb-6">
              <Link
                href={`/${business.slug}/products#product-results`}
                className="text-sm font-bold"
                style={{ color: theme.primary }}
              >
                Clear filters
              </Link>
            </div>
          )}

          {products?.length === 0 ? (
            <div
              className={`${websiteTheme.radius} ${websiteTheme.cardStyle} p-10 text-center ${websiteTheme.shadow}`}
            >
              <h3 className="text-xl font-black text-slate-950">
                No products found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try another category or search term.
              </p>

              <Link
                href={`/${business.slug}/products#product-results`}
                className={`${websiteTheme.radius} mt-6 inline-flex items-center justify-center px-5 py-3 text-sm font-bold transition hover:opacity-90`}
                style={{
                  backgroundColor: theme.accent,
                  color: "#101820",
                }}
              >
                View All Products
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
        </div>
      </section>
    </main>
  );
}
