export default function HeroSection({ section }) {
  const heading = section?.heading || section?.title || "Online Catalogue";
  const content =
    section?.content ||
    section?.subtitle ||
    "Browse products, view datasheets and request a quote online.";

  return (
    <section className="relative overflow-hidden bg-[#101820] px-6 py-24 text-white md:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,24,32,0.94),rgba(16,24,32,0.72)),radial-gradient(circle_at_top_right,rgba(242,169,0,0.24),transparent_34%)]" />
      <div className="mx-auto max-w-7xl">
        <div className="relative max-w-3xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#f2a900]">
            Industrial Solutions
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-7xl">
            {heading}
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            {content}
          </p>

          {section?.button_text && (
            <a
              href={section.button_link || "/contact"}
              className="mt-10 inline-flex rounded-2xl bg-[#f2a900] px-8 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#d99800]"
            >
              {section.button_text}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
