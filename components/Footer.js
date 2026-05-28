import { getPublicBusiness } from "@/lib/getPublicBusiness";

export default async function Footer() {
  const business = await getPublicBusiness();

  return (
    <footer className="bg-[#101820] px-6 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        <div>
          <div className="text-xl font-black">
            {business?.name || "Business Website"}
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Transmission & Distribution Lines
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-black">Contact</h3>

          <div className="space-y-2 text-sm text-slate-400">
            <p>{business?.contact_email || "Email to be confirmed"}</p>
            <p>{business?.phone || "Phone to be confirmed"}</p>
            <p>{business?.address || "Address to be confirmed"}</p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-black">Website</h3>

          <p className="text-sm text-slate-400">
            Website powered by the Platform CMS.
          </p>
        </div>
      </div>
    </footer>
  );
}