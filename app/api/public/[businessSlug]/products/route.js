import {
  getActiveProducts,
  getPublicBusiness,
  publicProductFields,
} from "../_helpers";

export async function GET(_request, { params }) {
  const { businessSlug } = await params;
  const { business, error, status } = await getPublicBusiness(businessSlug);

  if (error) {
    return Response.json({ error }, { status: status || 404 });
  }

  const { products, error: productsError } = await getActiveProducts(
    business.id
  );

  if (productsError) {
    return Response.json({ error: productsError.message }, { status: 500 });
  }

  return Response.json({
    products: products.map(publicProductFields),
  });
}
