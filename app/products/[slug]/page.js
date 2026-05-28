import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import { supabase } from "@/lib/supabase";
import { getPublicBusiness } from "@/lib/getPublicBusiness";

export default async function ProductPage({ params }) {
  const { slug } = await params;

  const business = await getPublicBusiness();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business?.id)
    .eq("slug", slug)
    .single();

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#f3f5f7] text-[#1F2933]">
        <Header />
        <section className="mx-auto max-w-7xl px-6 py-20">
          <h1 className="text-4xl font-black">Product Not Found</h1>
          <p className="mt-3 text-slate-600">Slug: {slug}</p>
          <Link
            href="/products"
            className="mt-6 inline-block font-bold text-[#d99a1e]"
          >
            ← Back to Products
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  const accentColor = business?.accent_color || "#f2a900";

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-[#1F2933]">
      <Header />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <Link
          href="/products"
          className="mb-8 inline-block font-bold"
          style={{ color: accentColor }}
        >
          ← Back to Products
        </Link>

        <div className="grid gap-12 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400">
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
          </div>

          <div>
            <p
              className="mb-3 text-sm font-bold uppercase tracking-[0.22em]"
              style={{ color: accentColor }}
            >
              {product.category}
            </p>

            <h1 className="text-5xl font-black tracking-tight">
              {product.name}
            </h1>

            <p className="mt-3 text-sm font-bold text-slate-500">
              Product Code: {product.code || "N/A"}
            </p>

            <p className="mt-8 text-lg leading-8 text-slate-600">
              {product.description}
            </p>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-black">
                Product Specifications
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="font-semibold">Category</span>
                  <span className="text-slate-600">{product.category}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="font-semibold">Product Code</span>
                  <span className="text-slate-600">
                    {product.code || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="font-semibold">Availability</span>
                  <span className="text-slate-600">On Enquiry</span>
                </div>
              </div>
            </div>

            {product.pdf_url && (
              <div className="mt-6">
                <a
                  href={product.pdf_url}
                  target="_blank"
                  className="inline-block rounded-full bg-[#1f5f8b] px-6 py-3 font-bold text-white"
                >
                  Download Datasheet PDF
                </a>
              </div>
            )}

            <AddToCartButton product={product} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}