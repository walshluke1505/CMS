import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f7] text-slate-900">
      <Header />

      <section className="bg-[#101820] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[#f2a900]">
            Contact Us
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-6xl">
            Get in touch with CU AL Engineering.
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="mb-5 text-3xl font-black text-[#1f5f8b]">
            Contact Details
          </h2>
          <div className="space-y-4 text-slate-600">
            <p><strong>Email:</strong> info@cual.co.za</p>
            <p><strong>Phone:</strong> To be confirmed</p>
            <p><strong>Address:</strong> To be confirmed</p>
            <p><strong>Trading Area:</strong> Southern and Central Africa</p>
          </div>
        </div>

        <form className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="mb-5 text-3xl font-black text-[#1f5f8b]">
            Send Enquiry
          </h2>

          <div className="space-y-4">
            <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Name" />
            <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Email" />
            <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Phone" />
            <textarea className="h-36 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Message" />
            <button className="rounded-full bg-[#f2a900] px-7 py-3 font-bold text-[#101820]">
              Send Message
            </button>
          </div>
        </form>
      </section>

      <Footer />
    </main>
  );
}