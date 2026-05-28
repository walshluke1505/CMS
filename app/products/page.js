import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { getPublicBusiness } from "@/lib/getPublicBusiness";

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;

  const business = await getPublicBusiness();

  const selectedCategory = params?.category || "all";
  const search = params?.search || "";

  let productsQuery = supabase
    .from("products")
    .select("*")
    .eq("business_id", business?.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (selectedCategory !== "all") {
    productsQuery = productsQuery.eq("category", selectedCategory);
  }

  if (search) {
    productsQuery = productsQuery.or(
      `name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data: products } = await productsQuery;

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", business?.id)
    .order("name", { ascending: true });

  function categoryLink(categoryName) {
    const query = new URLSearchParams();

    if (categoryName !== "all") {
      query.set("category", categoryName);
    }

    if (search) {
      query.set("search", search);
    }

    const queryString = query.toString();
    return queryString ? `/products?${queryString}` : "/products";
  }

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-[#1F2933]">
      <Header />

      <section className="bg-[#101820] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[#f2a900]">
            Product Catalogue
          </p>

          <h1 className="mb-6 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
            Browse technical products and request a quote.
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-slate-300">
            Search products, filter by category and open product detail pages.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-black text-[#1f5f8b]">
            Categories
          </h2>

          <div className="space-y-3 text-sm font-semibold text-slate-600">
            <Link
              href={categoryLink("all")}
              className={`block rounded-xl px-4 py-3 ${
                selectedCategory === "all"
                  ? "bg-[#f2a900] text-[#101820]"
                  : "bg-slate-100"
              }`}
            >
              All Products
            </Link>

            {categories?.map((category) => (
              <Link
                key={category.id}
                href={categoryLink(category.name)}
                className={`block rounded-xl px-4 py-3 ${
                  selectedCategory === category.name
                    ? "bg-[#f2a900] text-[#101820]"
                    : "bg-slate-100"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-100 p-4">
            <h3 className="mb-2 font-black text-[#101820]">Need help?</h3>

            <p className="mb-4 text-sm leading-6 text-slate-600">
              Add products to your enquiry cart and the business will respond
              with pricing and availability.
            </p>

            <Link
              href="/request-quote"
              className="block w-full rounded-full bg-[#f2a900] px-4 py-3 text-center text-sm font-bold text-[#101820]"
            >
              Request Quote
            </Link>
          </div>
        </aside>

        <div id="product-results">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                {selectedCategory === "all"
                  ? "Product Range"
                  : selectedCategory}
              </h2>

              <p className="mt-2 text-slate-600">
                {products?.length || 0} product
                {(products?.length || 0) === 1 ? "" : "s"} found.
              </p>
            </div>

            <form action="/products#product-results" className="flex gap-2">
              <input
                name="search"
                defaultValue={search}
                placeholder="Search all products..."
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm shadow-sm md:w-72"
              />

              <button className="rounded-full bg-[#f2a900] px-5 py-3 text-sm font-bold text-[#101820]">
                Search
              </button>
            </form>
          </div>

          {(search || selectedCategory !== "all") && (
            <div className="mb-6">
              <Link href="/products" className="font-bold text-[#d99a1e]">
                Clear filters
              </Link>
            </div>
          )}

          {products?.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <p className="text-slate-600">
                No products found. Try another category or search term.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {products?.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="h-full cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#f2a900] hover:shadow-lg">
                    <div className="mb-5 flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-semibold text-slate-400">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "Product Image"
                      )}
                    </div>

                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#d99a1e]">
                      {product.category}
                    </div>

                    <h3 className="mb-2 text-xl font-black">
                      {product.name}
                    </h3>

                    <p className="mb-5 text-sm text-slate-500">
                      Product Code: {product.code}
                    </p>

                    <div className="w-full rounded-full bg-[#f2a900] px-4 py-3 text-center text-sm font-bold text-[#101820]">
                      View Product Details
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}