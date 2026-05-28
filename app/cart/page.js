import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartContent from "@/components/CartContent";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f7] text-slate-900">
      <Header />

      <section className="bg-[#101820] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[#f2a900]">
            Enquiry Cart
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-6xl">
            Review products before requesting a quote.
          </h1>
        </div>
      </section>

      <CartContent />

      <Footer />
    </main>
  );
}