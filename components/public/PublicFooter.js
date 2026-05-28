export default function PublicFooter({
  business,
  theme,
  content,
  websiteTheme,
}) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div
        className={`mx-auto grid ${websiteTheme?.container} gap-8 px-6 py-12 md:grid-cols-3`}
      >
        <div>
          <h3
            className={`text-2xl font-black ${websiteTheme?.heading}`}
            style={{
              color: theme.primary,
            }}
          >
            {business.name}
          </h3>

          <p
            className={`mt-4 text-sm leading-7 ${websiteTheme?.subheading}`}
          >
            {content?.footer_tagline ||
              "Browse products and submit quote enquiries directly through the online catalogue."}
          </p>
        </div>

        <div>
          <h4 className="text-lg font-black text-slate-950">
            Contact
          </h4>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>
              {business.contact_email || "No email added"}
            </p>

            <p>
              {business.phone || "No phone added"}
            </p>

            {content?.business_hours && (
              <p>
                {content.business_hours}
              </p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-black text-slate-950">
            Service Area
          </h4>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            {content?.footer_service_area ||
              business.address ||
              "No address added"}
          </p>

          {content?.footer_note && (
            <div
              className={`mt-5 ${websiteTheme?.radius} ${websiteTheme?.shadow} bg-slate-100 p-4`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Note
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {content.footer_note}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50">
        <div
          className={`mx-auto flex ${websiteTheme?.container} flex-col gap-3 px-6 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between`}
        >
          <p>
            © {new Date().getFullYear()} {business.name}. All rights reserved.
          </p>

          <p>
            Powered by the CMS platform.
          </p>
        </div>
      </div>
    </footer>
  );
}