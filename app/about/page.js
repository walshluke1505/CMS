import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f7] text-slate-900">
      <Header />

      <section className="bg-[#101820] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[#f2a900]">
            About Us
          </p>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
            Engineering supply with reliability, stock availability and service.
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="mb-5 text-3xl font-black text-[#1f5f8b]">
            Who We Are
          </h2>
          <p className="text-lg leading-8 text-slate-600">
            CU AL Engineering supplies transmission and distribution line
            products to customers throughout South Africa and international
            markets. The company focuses on stock availability, technical
            products and reliable service.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="mb-5 text-3xl font-black text-[#1f5f8b]">
            What We Supply
          </h2>
          <p className="text-lg leading-8 text-slate-600">
            Product areas include overhead line materials, conductors,
            insulators, ABC cable accessories, earthing material, stay material
            and OPGW / ADSS fittings.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}