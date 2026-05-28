import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RequestQuoteForm from "@/components/RequestQuoteForm";

export default function RequestQuotePage() {
  return (
    <main className="min-h-screen bg-[#f3f5f7] text-slate-900">
      <Header />

      <section className="bg-[#101820] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[#f2a900]">
            Request Quote
          </p>

          <h1 className="text-5xl font-black tracking-tight md:text-6xl">
            Submit your product enquiry.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Complete the form below and the business will respond with pricing
            and availability.
          </p>
        </div>
      </section>

      <RequestQuoteForm />

      <Footer />
    </main>
  );
}