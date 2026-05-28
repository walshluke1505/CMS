import Link from "next/link";

export default function PublicProductCard({ business, product, theme }) {
  const categoryName = product.categories?.name || product.category || "Product";

  return (
    <Link
      href={`/${business.slug}/products/${product.slug}`}
      className="group h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="mb-5 flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-semibold text-slate-400">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          "Product Image"
        )}
      </div>

      <div
        className="mb-2 text-xs font-bold uppercase tracking-[0.18em]"
        style={{ color: theme.accent }}
      >
        {categoryName}
      </div>

      <h3 className="mb-2 text-xl font-black text-slate-950">
        {product.name}
      </h3>

      <p className="mb-5 text-sm text-slate-500">
        Product Code: {product.code || "No code"}
      </p>

      <div
        className="w-full rounded-xl px-4 py-3 text-center text-sm font-bold"
        style={{
          backgroundColor: theme.accent,
          color: "#101820",
        }}
      >
        View Product Details
      </div>
    </Link>
  );
}