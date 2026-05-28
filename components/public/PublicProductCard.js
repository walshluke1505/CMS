import Link from "next/link";

export default function PublicProductCard({
  business,
  product,
  theme,
  websiteTheme,
}) {
  const categoryName = product.categories?.name || product.category || "Product";
  const description =
    product.description?.length > 120
      ? `${product.description.slice(0, 120)}...`
      : product.description;

  return (
    <Link
      href={`/${business.slug}/products/${product.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl`}
    >
      <div
        className="mb-5 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-semibold text-slate-400"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
              websiteTheme?.imageStyle || ""
            }`}
          />
        ) : (
          "Product Image"
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full bg-[#101820] px-3 py-1 text-xs font-black text-white"
        >
          {categoryName}
        </span>

        {product.pdf_url && (
          <span
            className="rounded-full px-3 py-1 text-xs font-black"
            style={{ backgroundColor: theme.accent, color: "#101820" }}
          >
            Datasheet
          </span>
        )}
      </div>

      <h3
        className={`text-xl font-black leading-snug text-slate-950 ${
          websiteTheme?.heading || ""
        }`}
      >
        {product.name}
      </h3>

      <p className={`mt-2 text-sm font-semibold ${websiteTheme?.subheading || "text-slate-500"}`}>
        Product Code: {product.code || "No code"}
      </p>

      <p className={`mt-4 line-clamp-3 text-sm leading-6 ${websiteTheme?.subheading || "text-slate-600"}`}>
        {description || "View product details, datasheets and contact options."}
      </p>

      <div
        className="mt-auto w-full rounded-2xl px-4 py-3 text-center text-sm font-black transition group-hover:opacity-95"
        style={{
          backgroundColor: theme.accent,
          color: "#101820",
        }}
      >
        View Product
      </div>
    </Link>
  );
}
