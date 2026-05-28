# Custom Frontend API

This CMS can power a separate custom website by business slug. All endpoints return JSON and only expose public catalogue, branding and content data.

Replace `{businessSlug}` with the public business slug.

## Endpoints

### Site

`GET /api/public/{businessSlug}/site`

Returns public business profile fields, public website content, categories and featured active products.

```json
{
  "business": {
    "name": "Example Supplier",
    "slug": "example-supplier",
    "logo_url": "https://...",
    "primary_color": "#101820",
    "accent_color": "#f2a900",
    "contact_email": "sales@example.co.za",
    "phone": "0310000000",
    "address": "Durban",
    "website_mode": "custom",
    "custom_frontend_url": "https://www.example.co.za"
  },
  "content": {
    "website_layout": "industrial-classic",
    "hero_title": "Example Supplier",
    "hero_subtitle": "Browse products and contact our team."
  },
  "categories": [],
  "featured_products": []
}
```

### Products

`GET /api/public/{businessSlug}/products`

Returns active products only.

```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "slug": "product-name",
      "category": {
        "id": "uuid",
        "name": "Category",
        "slug": "category"
      },
      "code": "ABC-001",
      "description": "Public product description",
      "image_url": "https://...",
      "pdf_url": "https://...",
      "meta_title": "Product SEO title",
      "meta_description": "Product SEO description",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Product Detail

`GET /api/public/{businessSlug}/products/{productSlug}`

Returns one active product and a small related active product list.

```json
{
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "slug": "product-name"
  },
  "related_products": []
}
```

### Categories

`GET /api/public/{businessSlug}/categories`

Returns public categories with active product counts.

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Category",
      "slug": "category",
      "description": "Category description",
      "created_at": "2026-01-01T00:00:00Z",
      "active_product_count": 4
    }
  ]
}
```

### Submit Enquiry

`POST /api/public/{businessSlug}/enquiries`

Creates an enquiry for the business. This endpoint does not expose enquiries publicly.

```json
{
  "customer_name": "Jane Customer",
  "company_name": "Customer Company",
  "email": "jane@example.co.za",
  "phone": "0310000000",
  "message": "Please send pricing and availability.",
  "products": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "code": "ABC-001",
      "quantity": 1
    }
  ]
}
```

Successful response:

```json
{
  "success": true,
  "enquiry_id": "uuid"
}
```

## Safety Notes

These endpoints do not expose business users, auth/session data, internal notes, quote pricing, hidden products or admin-only enquiry records. Product APIs filter by `is_active = true`.

If `businesses.api_enabled` is set to `false`, public API requests return a disabled error.
