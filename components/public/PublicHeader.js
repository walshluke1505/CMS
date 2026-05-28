"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuoteCart } from "@/context/QuoteCartContext";

export default function PublicHeader({
  business,
  theme,
  content,
  websiteTheme,
}) {
  const { totalItems } = useQuoteCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const enquiryLabel =
    content?.nav_quote_label === "Quote Cart"
      ? "Enquiry"
      : content?.nav_quote_label || "Enquiry";

  const navItems = [
    {
      label: content?.nav_home_label || "Home",
      href: `/${business.slug}`,
      show: true,
    },
    {
      label: content?.nav_about_label || "About",
      href: `/${business.slug}/about`,
      show: content?.show_about_page ?? true,
    },
    {
      label: content?.nav_products_label || "Products",
      href: `/${business.slug}/products`,
      show: true,
    },
    {
      label: content?.nav_gallery_label || "Gallery",
      href: `/${business.slug}/gallery`,
      show: content?.show_gallery_page ?? true,
    },
    {
      label: content?.nav_contact_label || "Contact",
      href: `/${business.slug}/contact`,
      show: content?.show_contact_page ?? true,
    },
  ].filter((item) => item.show);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-slate-200 ${
        websiteTheme?.navStyle || "bg-white/95 backdrop-blur"
      }`}
    >
      <div
        className={`mx-auto flex ${
          websiteTheme?.container || "max-w-7xl"
        } items-center justify-between px-6 py-5`}
      >
        <Link href={`/${business.slug}`} className="flex items-center gap-3">
          {theme.logo ? (
            <img
              src={theme.logo}
              alt={business.name}
              className="h-12 max-w-[160px] object-contain"
            />
          ) : (
            <div
              className={`flex h-12 w-12 items-center justify-center ${
                websiteTheme?.radius || "rounded-xl"
              } text-lg font-black text-white`}
              style={{
                backgroundColor: theme.primary,
              }}
            >
              {business.name?.charAt(0)}
            </div>
          )}

          <div>
            <p
              className={`text-lg font-black ${websiteTheme?.heading || ""}`}
              style={{
                color: theme.primary,
              }}
            >
              {business.name}
            </p>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              {content?.hero_label || "Product Catalogue"}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-slate-700 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:opacity-70">
              {item.label}
            </Link>
          ))}

            <QuoteLink
            business={business}
            theme={theme}
            websiteTheme={websiteTheme}
            totalItems={totalItems}
            label={enquiryLabel}
          />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href={`/${business.slug}/request-quote`}
            className={`relative ${
              websiteTheme?.radius || "rounded-xl"
            } px-4 py-2 text-sm font-bold`}
            style={{
              backgroundColor: theme.accent,
              color: "#101820",
            }}
          >
            Enquiry

            {totalItems > 0 && (
              <CartBadge totalItems={totalItems} theme={theme} />
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`${
              websiteTheme?.radius || "rounded-xl"
            } border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm`}
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 shadow-lg md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`${
                  websiteTheme?.radius || "rounded-xl"
                } bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700`}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href={`/${business.slug}/request-quote`}
              onClick={() => setMobileOpen(false)}
              className={`relative ${
                websiteTheme?.radius || "rounded-xl"
              } px-4 py-3 text-center text-sm font-black`}
              style={{
                backgroundColor: theme.accent,
                color: "#101820",
              }}
            >
              {enquiryLabel}

              {totalItems > 0 && (
                <CartBadge totalItems={totalItems} theme={theme} />
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function QuoteLink({ business, theme, websiteTheme, totalItems, label }) {
  return (
    <Link
      href={`/${business.slug}/request-quote`}
      className={`relative ${
        websiteTheme?.radius || "rounded-xl"
      } px-4 py-2 transition hover:opacity-90`}
      style={{
        backgroundColor: theme.accent,
        color: "#101820",
      }}
    >
      {label}

      {totalItems > 0 && <CartBadge totalItems={totalItems} theme={theme} />}
    </Link>
  );
}

function CartBadge({ totalItems, theme }) {
  return (
    <span
      className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-black text-white"
      style={{
        backgroundColor: theme.primary,
      }}
    >
      {totalItems}
    </span>
  );
}
