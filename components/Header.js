import Link from "next/link";
import CartBadge from "@/components/CartBadge";
import { getPublicBusiness } from "@/lib/getPublicBusiness";

export default async function Header() {
  const business = await getPublicBusiness();

  const primaryColor = business?.primary_color || "#1f5f8b";
  const accentColor = business?.accent_color || "#f2a900";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/">
          <div className="flex items-center gap-3">
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-12 w-auto rounded-lg bg-white object-contain"
              />
            )}

            <div>
              <div
                className="text-2xl font-black tracking-tight"
                style={{ color: primaryColor }}
              >
                {business?.name || "Business Website"}
              </div>

              <div
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: accentColor }}
              >
                Transmission & Distribution Lines
              </div>
            </div>
          </div>
        </Link>

        <nav className="hidden gap-8 text-sm font-semibold text-slate-700 md:flex">
          <Link href="/">Home</Link>
          <Link href="/about">About Us</Link>
          <Link href="/products">Products</Link>
          <Link href="/brochure">Brochure</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/contact">Contact Us</Link>
        </nav>

        <CartBadge />
      </div>
    </header>
  );
}