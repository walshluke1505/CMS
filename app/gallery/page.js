import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f7] text-slate-900">
      <Header />

      <section className="bg-[#101820] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[#f2a900]">
            Gallery
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-6xl">
            Project and Product Gallery
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            A visual gallery for product images, stock images, project photos
            and engineering supply examples.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-400 shadow-sm"
            >
              Gallery Image {index + 1}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}