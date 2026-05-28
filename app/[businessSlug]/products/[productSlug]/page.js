import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AddToCartButton from "@/components/AddToCartButton";
import ProductEnquiryCard from "@/components/public/ProductEnquiryCard";
import PublicProductCard from "@/components/public/PublicProductCard";
import ProductViewTracker from "@/components/public/ProductViewTracker";
import { getBusinessBySlug } from "@/lib/business";
import { getBusinessTheme } from "@/lib/theme";
import { getWebsiteTheme } from "@/lib/websiteTheme";
import { getProductBySlug, getBusinessProducts } from "@/lib/products";

function whatsappUrl(phone, productName) {
  if (!phone) return "";

  const number = phone.replace(/\D/g, "").replace(/^0/, "27");
  const message = encodeURIComponent(`Hi, I'm interested in ${productName}.`);

  return `https://wa.me/${number}?text=${message}`;
}

export async function generateMetadata({ params }) {
  const { businessSlug, productSlug } = await params;

  const { business } = await getBusinessBySlug(businessSlug);

  if (!business) {
    return {
      title: "Product Not Found",
    };
  }

  const { product } = await getProductBySlug(business.id, productSlug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.meta_title || `${product.name} | ${business.name}`,
    description:
      product.meta_description ||
      product.description ||
      `View ${product.name} and request a quote from ${business.name}.`,
  };
}

export default async function BusinessProductDetailPage({ params }) {
  const { businessSlug, productSlug } = await params;

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

  const { product } = await getProductBySlug(business.id, productSlug);

  if (!product) {
    return (
      <main
        className={`min-h-screen ${websiteTheme.pageBg || "bg-[#f3f5f7]"} text-slate-950`}
      >
        <section className={`mx-auto ${websiteTheme.container} px-6 py-20`}>
          <h1 className={`text-4xl font-black ${websiteTheme.heading}`}>
            Product Not Found
          </h1>

          <p className="mt-3 text-slate-600">Slug: {productSlug}</p>

          <Link
            href={`/${business.slug}/products`}
            className="mt-6 inline-block font-bold"
            style={{ color: theme.accent }}
          >
            ← Back to Products
          </Link>
        </section>
      </main>
    );
  }

  const categoryName = product.categories?.name || product.category || "Product";
  const productEmailSubject = encodeURIComponent(`Product enquiry: ${product.name}`);
  const productEmailBody = encodeURIComponent(
    `Hi, I'm interested in ${product.name}.\n\nPlease send me more information, pricing or availability.`
  );

  const { products: relatedProducts } = await getBusinessProducts(business.id);

  const filteredRelatedProducts = relatedProducts
    .filter((item) => item.id !== product.id)
    .filter((item) => {
      if (product.category_id && item.category_id) {
        return item.category_id === product.category_id;
      }

      return (item.category || "") === (product.category || "");
    })
    .slice(0, 3);

  return (
    <main
      className={`min-h-screen ${websiteTheme.pageBg || "bg-[#f3f5f7]"} text-slate-950`}
    >
      <ProductViewTracker businessId={business.id} productId={product.id} />

      <section className="relative overflow-hidden bg-[#101820] px-6 py-10 text-white md:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,24,32,0.96),rgba(16,24,32,0.78)),radial-gradient(circle_at_top_right,rgba(242,169,0,0.2),transparent_34%)]" />
        <div className={`relative mx-auto ${websiteTheme.container}`}>
          <Link
            href={`/${business.slug}/products`}
            className="mb-8 inline-flex items-center font-bold text-[#f2a900] transition hover:opacity-80"
          >
            ← Back to Catalogue
          </Link>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#f2a900]">
            Product Detail
          </p>
          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            {product.name}
          </h1>
        </div>
      </section>

      <section className={`mx-auto ${websiteTheme.container} px-6 py-12 md:py-16`}>
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div
            className={`${websiteTheme.radius} ${websiteTheme.cardStyle} p-3 ${websiteTheme.shadow}`}
          >
            <div
              className={`flex aspect-[4/3] min-h-[280px] items-center justify-center overflow-hidden ${websiteTheme.radius} bg-slate-100 text-sm font-semibold text-slate-400`}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className={`h-full w-full object-cover ${websiteTheme.imageStyle || ""}`}
                />
              ) : (
                "Product Image"
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase shadow-sm"
                style={{ color: theme.primary }}
              >
                {categoryName}
              </span>
              {product.pdf_url && (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase text-white shadow-sm">
                  Datasheet available
                </span>
              )}
            </div>

            <h1
              className="text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl"
            >
              {product.name}
            </h1>

            <p className={`mt-4 text-sm font-bold ${websiteTheme.subheading}`}>
              Product Code: {product.code || "N/A"}
            </p>

            <p className={`mt-8 text-base leading-8 md:text-lg ${websiteTheme.subheading}`}>
              {product.description || "No product description added yet."}
            </p>

            <div
              className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Need pricing or availability?
              </h2>
              <p className={`mt-2 text-sm leading-6 ${websiteTheme.subheading}`}>
                Send this product through the quote enquiry flow and the team
                will respond with pricing, stock or next steps.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Call Now
                  </a>
                )}

                {business.phone && (
                  <a
                    href={whatsappUrl(business.phone, product.name)}
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    WhatsApp
                  </a>
                )}

                {business.contact_email && (
                  <a
                    href={`mailto:${business.contact_email}?subject=${productEmailSubject}&body=${productEmailBody}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    Email
                  </a>
                )}

                <a
                  href="#product-enquiry"
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
                  style={{
                    backgroundColor: theme.accent,
                    color: "#101820",
                  }}
                >
                  Enquire About Product
                </a>
              </div>
            </div>

            <div id="product-enquiry" className="mt-6">
              <ProductEnquiryCard
                business={business}
                product={product}
                theme={theme}
                websiteTheme={websiteTheme}
              />
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">
                Building a product list?
              </h2>
              <p className={`mt-2 text-sm leading-6 ${websiteTheme.subheading}`}>
                Add this item to a multi-product enquiry if you want the team to
                review several products at once.
              </p>
              <div className="mt-4">
                <AddToCartButton
                  product={product}
                  quoteHref={`/${business.slug}/request-quote`}
                  compact
                />
              </div>
            </div>

            <div
              className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-5 text-xl font-black tracking-tight text-slate-950">
                Product Specifications
              </h2>

              <div className="space-y-4 text-sm">
                <SpecRow label="Category" value={categoryName} />
                <SpecRow label="Product Code" value={product.code || "N/A"} />
                <SpecRow label="Availability" value="On Enquiry" />
                <SpecRow label="Business" value={business.name} />
              </div>
            </div>

            {product.pdf_url && (
              <a
                href={product.pdf_url}
                target="_blank"
                className="mt-5 inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
                style={{ backgroundColor: theme.primary }}
              >
                Download Datasheet
              </a>
            )}
          </div>
        </div>
      </section>

      {filteredRelatedProducts.length > 0 && (
        <section className={`mx-auto ${websiteTheme.container} px-6 pb-16`}>
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
            <h2
              className={`text-3xl font-black text-slate-950 ${websiteTheme.heading}`}
            >
              Related Products
            </h2>

            <p className={`mt-2 text-sm ${websiteTheme.subheading}`}>
              Similar products from the same category.
            </p>
            </div>

            <Link
              href={`/${business.slug}/products`}
              className={`${websiteTheme.radius} inline-flex items-center justify-center border border-slate-300 bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-slate-50`}
              style={{ color: theme.primary }}
            >
              View Catalogue
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRelatedProducts.map((relatedProduct) => (
              <PublicProductCard
                key={relatedProduct.id}
                business={business}
                product={relatedProduct}
                theme={theme}
                websiteTheme={websiteTheme}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function SpecRow({ label, value }) {
  return (
    <div className="flex justify-between gap-6 border-b border-slate-100 pb-3">
      <span className="font-semibold text-slate-800">{label}</span>
      <span className="text-right text-slate-600">{value}</span>
    </div>
  );
}
