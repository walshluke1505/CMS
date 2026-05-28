import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function BrochurePage() {
  return (
    <main className="min-h-screen bg-[#f3f5f7] text-slate-900">
      <Header />

      <section className="bg-[#101820] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[#f2a900]">
            Downloads
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-6xl">
            Product Brochure
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Download the CU AL product brochure or request more information
            about specific product ranges.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-4xl font-black">CU AL Product Catalogue</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Placeholder area for the official brochure PDF. Once the final
                brochure is available, a downloadable file can be added here.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 p-8 text-center">
              <div className="mb-5 text-6xl">📄</div>
              <button className="rounded-full bg-[#f2a900] px-7 py-3 font-bold text-[#101820]">
                Download Brochure
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}