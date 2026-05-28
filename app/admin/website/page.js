"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUserBusiness, canManageSettings } from "@/lib/auth";

import AdminLayout from "@/components/AdminLayout";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminInput from "@/components/admin/AdminInput";
import AdminTextarea from "@/components/admin/AdminTextarea";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminLoader from "@/components/admin/AdminLoader";

const WEBSITE_LAYOUTS = [
  {
    value: "industrial-classic",
    name: "Industrial Classic",
    description: "Dark hero, bold catalogue sections and a strong quote CTA.",
    bestFor: "Industrial suppliers and manufacturers",
    preview: "dark",
  },
  {
    value: "modern-catalogue",
    name: "Modern Catalogue",
    description: "Clean white homepage with products and categories up front.",
    bestFor: "Wholesalers and distributors",
    preview: "grid",
  },
  {
    value: "minimal-b2b",
    name: "Minimal Business",
    description: "Fast, text-first and direct with minimal decoration.",
    bestFor: "Practical B2B businesses",
    preview: "minimal",
  },
];

function normalizeLayout(value) {
  if (value === "corporate-premium") return "modern-catalogue";
  if (value === "visual-showcase") return "industrial-classic";
  if (value === "minimal-b2b") return "minimal-b2b";
  if (value === "modern-catalogue") return "modern-catalogue";
  return "industrial-classic";
}

const DEFAULT_FORM = {
  website_layout: "industrial-classic",
  hero_label: "Online Product Catalogue",
  hero_title: "",
  hero_subtitle: "",
  primary_cta_label: "View Products",
  secondary_cta_label: "Contact Us",
  about_title: "",
  about_text: "",
  hero_image_url: "",
  is_homepage_active: true,
  about_page_title: "",
  about_page_subtitle: "",
  about_page_body: "",
  about_image_url: "",
  contact_page_title: "",
  contact_page_subtitle: "",
  contact_extra_text: "",
  business_hours: "",
  map_embed_url: "",
  footer_tagline: "",
  footer_service_area: "",
  footer_note: "",
  nav_home_label: "Home",
  nav_about_label: "About",
  nav_products_label: "Products",
  nav_gallery_label: "Gallery",
  nav_contact_label: "Contact",
  nav_quote_label: "Enquiry",
  show_about_page: true,
  show_gallery_page: true,
  show_contact_page: true,
  website_theme: "industrial",
  website_radius: "rounded",
  website_shadow: "soft",
  home_meta_title: "",
  home_meta_description: "",
  about_meta_title: "",
  about_meta_description: "",
  contact_meta_title: "",
  contact_meta_description: "",
  products_meta_title: "",
  products_meta_description: "",
  og_image_url: "",
};

export default function AdminWebsitePage() {
  const router = useRouter();

  const [business, setBusiness] = useState(null);
  const [role, setRole] = useState(null);
  const [contentId, setContentId] = useState(null);
  const [layoutColumnAvailable, setLayoutColumnAvailable] = useState(true);
  const [websiteModeColumnsAvailable, setWebsiteModeColumnsAvailable] =
    useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [modeForm, setModeForm] = useState({
    website_mode: "starter",
    custom_frontend_url: "",
    api_enabled: true,
  });

  const saveDisabled = saving || uploadingHero || uploadingOg;

  async function loadWebsiteContent() {
    try {
      setLoading(true);

      const result = await getUserBusiness();

      if (result.error) {
        toast.error("Unable to load website editor.");
        return;
      }

      if (!canManageSettings(result.role)) {
        toast.error("You do not have permission to edit website content.");
        router.replace("/admin");
        return;
      }

      setRole(result.role);

      const { data: businessDetails } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", result.business.id)
        .maybeSingle();

      const currentBusiness = businessDetails || result.business;

      setBusiness(currentBusiness);
      setWebsiteModeColumnsAvailable(
        Object.prototype.hasOwnProperty.call(currentBusiness, "website_mode")
      );
      setModeForm({
        website_mode: currentBusiness.website_mode || "starter",
        custom_frontend_url: currentBusiness.custom_frontend_url || "",
        api_enabled: currentBusiness.api_enabled ?? true,
      });

      const { data, error } = await supabase
        .from("business_content")
        .select("*")
        .eq("business_id", result.business.id)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data) {
        const { data: createdContent, error: createError } = await supabase
          .from("business_content")
          .insert({
            business_id: result.business.id,
            hero_title: result.business.name || "",
            hero_subtitle:
              "Browse products, view datasheets and request a quote directly from the catalogue.",
            about_title: `About ${result.business.name}`,
            about_text:
              "Introduce the business, explain the product offering and describe what customers can expect.",
            contact_page_title: `Contact ${result.business.name}`,
            contact_page_subtitle:
              "Get in touch directly or submit a product quote enquiry.",
            business_hours: "Monday to Friday: 08:00 - 17:00",
            website_theme: "industrial",
            website_radius: "rounded",
            website_shadow: "soft",
            home_meta_title: result.business.name || "",
            home_meta_description: `Browse products and request a quote from ${result.business.name}.`,
            products_meta_title: `Products | ${result.business.name}`,
            products_meta_description: `Browse products and request a quote from ${result.business.name}.`,
            og_image_url: result.business.logo_url || "",
          })
          .select("*")
          .single();

        if (createError) {
          toast.error(createError.message);
          return;
        }

        applyContentToForm(createdContent);
        return;
      }

      applyContentToForm(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWebsiteContent();
  }, []);

  function applyContentToForm(content) {
    setContentId(content.id);
    setLayoutColumnAvailable(
      Object.prototype.hasOwnProperty.call(content, "website_layout")
    );

    setForm({
      ...DEFAULT_FORM,
      website_layout: normalizeLayout(content.website_layout),
      hero_label: content.hero_label || DEFAULT_FORM.hero_label,
      hero_title: content.hero_title || "",
      hero_subtitle: content.hero_subtitle || "",
      primary_cta_label:
        content.primary_cta_label || DEFAULT_FORM.primary_cta_label,
      secondary_cta_label:
        content.secondary_cta_label || DEFAULT_FORM.secondary_cta_label,
      about_title: content.about_title || "",
      about_text: content.about_text || "",
      hero_image_url: content.hero_image_url || "",
      is_homepage_active: content.is_homepage_active ?? true,
      about_page_title: content.about_page_title || "",
      about_page_subtitle: content.about_page_subtitle || "",
      about_page_body: content.about_page_body || "",
      about_image_url: content.about_image_url || "",
      contact_page_title: content.contact_page_title || "",
      contact_page_subtitle: content.contact_page_subtitle || "",
      contact_extra_text: content.contact_extra_text || "",
      business_hours: content.business_hours || "",
      map_embed_url: content.map_embed_url || "",
      footer_tagline: content.footer_tagline || "",
      footer_service_area: content.footer_service_area || "",
      footer_note: content.footer_note || "",
      nav_home_label: content.nav_home_label || DEFAULT_FORM.nav_home_label,
      nav_about_label: content.nav_about_label || DEFAULT_FORM.nav_about_label,
      nav_products_label:
        content.nav_products_label || DEFAULT_FORM.nav_products_label,
      nav_gallery_label:
        content.nav_gallery_label || DEFAULT_FORM.nav_gallery_label,
      nav_contact_label:
        content.nav_contact_label || DEFAULT_FORM.nav_contact_label,
      nav_quote_label: content.nav_quote_label || DEFAULT_FORM.nav_quote_label,
      show_about_page: content.show_about_page ?? true,
      show_gallery_page: content.show_gallery_page ?? true,
      show_contact_page: content.show_contact_page ?? true,
      website_theme: content.website_theme || DEFAULT_FORM.website_theme,
      website_radius: content.website_radius || DEFAULT_FORM.website_radius,
      website_shadow: content.website_shadow || DEFAULT_FORM.website_shadow,
      home_meta_title: content.home_meta_title || "",
      home_meta_description: content.home_meta_description || "",
      about_meta_title: content.about_meta_title || "",
      about_meta_description: content.about_meta_description || "",
      contact_meta_title: content.contact_meta_title || "",
      contact_meta_description: content.contact_meta_description || "",
      products_meta_title: content.products_meta_title || "",
      products_meta_description: content.products_meta_description || "",
      og_image_url: content.og_image_url || "",
    });
  }

  async function uploadImage(file, field, type) {
    if (!file || !business?.id) return;

    const setUploading = type === "og" ? setUploadingOg : setUploadingHero;

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${business.id}-${type}-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("business-logos")
        .upload(fileName, file);

      if (error) {
        toast.error(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("business-logos")
        .getPublicUrl(fileName);

      setForm((prev) => ({ ...prev, [field]: data.publicUrl }));
      toast.success("Image uploaded");
    } finally {
      setUploading(false);
    }
  }

  async function saveContent(e) {
    e.preventDefault();

    if (!business?.id) {
      toast.error("Business not loaded yet.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        business_id: business.id,
        ...(layoutColumnAvailable
          ? { website_layout: normalizeLayout(form.website_layout) }
          : {}),
        hero_label: form.hero_label,
        hero_title: form.hero_title,
        hero_subtitle: form.hero_subtitle,
        primary_cta_label: form.primary_cta_label,
        secondary_cta_label: form.secondary_cta_label,
        about_title: form.about_title,
        about_text: form.about_text,
        hero_image_url: form.hero_image_url,
        is_homepage_active: form.is_homepage_active,
        about_page_title: form.about_page_title,
        about_page_subtitle: form.about_page_subtitle,
        about_page_body: form.about_page_body,
        about_image_url: form.about_image_url,
        contact_page_title: form.contact_page_title,
        contact_page_subtitle: form.contact_page_subtitle,
        contact_extra_text: form.contact_extra_text,
        business_hours: form.business_hours,
        map_embed_url: form.map_embed_url,
        footer_tagline: form.footer_tagline,
        footer_service_area: form.footer_service_area,
        footer_note: form.footer_note,
        nav_home_label: form.nav_home_label,
        nav_about_label: form.nav_about_label,
        nav_products_label: form.nav_products_label,
        nav_gallery_label: form.nav_gallery_label,
        nav_contact_label: form.nav_contact_label,
        nav_quote_label: form.nav_quote_label,
        show_about_page: form.show_about_page,
        show_gallery_page: form.show_gallery_page,
        show_contact_page: form.show_contact_page,
        website_theme: form.website_theme,
        website_radius: form.website_radius,
        website_shadow: form.website_shadow,
        home_meta_title: form.home_meta_title,
        home_meta_description: form.home_meta_description,
        about_meta_title: form.about_meta_title,
        about_meta_description: form.about_meta_description,
        contact_meta_title: form.contact_meta_title,
        contact_meta_description: form.contact_meta_description,
        products_meta_title: form.products_meta_title,
        products_meta_description: form.products_meta_description,
        og_image_url: form.og_image_url,
        updated_at: new Date().toISOString(),
      };

      const result = contentId
        ? await supabase
            .from("business_content")
            .update(payload)
            .eq("id", contentId)
            .eq("business_id", business.id)
        : await supabase.from("business_content").insert(payload);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        layoutColumnAvailable
          ? "Website settings saved"
          : "Website content saved. Add the layout SQL to save layouts."
      );
      loadWebsiteContent();
    } finally {
      setSaving(false);
    }
  }

  async function saveWebsiteMode(e) {
    e.preventDefault();

    if (!business?.id || !websiteModeColumnsAvailable) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("businesses")
        .update({
          website_mode: modeForm.website_mode,
          custom_frontend_url: modeForm.custom_frontend_url,
          api_enabled: modeForm.api_enabled,
        })
        .eq("id", business.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Website mode saved");
      loadWebsiteContent();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Website Editor" subtitle="Loading website content...">
        <AdminLoader text="Loading website editor..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Website Editor"
      subtitle={`Choose layout and edit public website content. Role: ${role}`}
    >
      <div className="mb-8 overflow-hidden rounded-3xl bg-[#101820] p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-[#f2a900]">
              Website Settings
            </p>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Choose a professional layout. Keep content simple.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              This is a managed catalogue website, not a page builder. Select a
              structure, update the homepage message and keep the public site
              ready for customer enquiries.
            </p>
          </div>

          <a
            href={`/${business?.slug}`}
            target="_blank"
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#f2a900] px-5 py-3 text-sm font-black text-slate-950"
          >
            Preview Public Site
          </a>
        </div>
      </div>

      {!layoutColumnAvailable && (
        <AdminCard className="mb-8 border-2 border-amber-200 bg-amber-50">
          <h2 className="text-xl font-black text-slate-950">
            Layout selection needs a database column
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Existing content can still be saved. Add the SQL in the final notes
            to persist selected homepage layouts.
          </p>
        </AdminCard>
      )}

      <AdminCard className="mb-8">
        <form onSubmit={saveWebsiteMode} className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Website Mode
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use the built-in starter website for quick launches, or connect
                a custom frontend to this CMS for premium builds.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {modeForm.website_mode === "custom" ? "Custom" : "Starter"}
            </span>
          </div>

          {!websiteModeColumnsAvailable ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
              Add the website mode SQL from the final notes to enable custom
              frontend mode. Starter websites continue working as normal.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label
                  className={`rounded-3xl border p-5 ${
                    modeForm.website_mode === "starter"
                      ? "border-[#f2a900] bg-[#fff8e6]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="website_mode"
                    value="starter"
                    checked={modeForm.website_mode === "starter"}
                    onChange={(e) =>
                      setModeForm({
                        ...modeForm,
                        website_mode: e.target.value,
                      })
                    }
                  />
                  <h3 className="mt-3 font-black text-slate-950">
                    Starter Website
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use the built-in public website routes and starter layouts.
                  </p>
                </label>

                <label
                  className={`rounded-3xl border p-5 ${
                    modeForm.website_mode === "custom"
                      ? "border-[#f2a900] bg-[#fff8e6]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="website_mode"
                    value="custom"
                    checked={modeForm.website_mode === "custom"}
                    onChange={(e) =>
                      setModeForm({
                        ...modeForm,
                        website_mode: e.target.value,
                      })
                    }
                  />
                  <h3 className="mt-3 font-black text-slate-950">
                    Custom Website
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    A custom-built frontend can fetch safe catalogue data from
                    this CMS.
                  </p>
                </label>
              </div>

              {modeForm.website_mode === "custom" && (
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <AdminInput
                    label="Custom Frontend URL"
                    placeholder="https://www.clientwebsite.co.za"
                    value={modeForm.custom_frontend_url}
                    onChange={(e) =>
                      setModeForm({
                        ...modeForm,
                        custom_frontend_url: e.target.value,
                      })
                    }
                  />

                  {modeForm.custom_frontend_url && (
                    <a
                      href={modeForm.custom_frontend_url}
                      target="_blank"
                      className="inline-flex justify-center rounded-xl bg-[#101820] px-5 py-3 text-sm font-bold text-white"
                    >
                      View Custom Website
                    </a>
                  )}
                </div>
              )}

              <label className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={modeForm.api_enabled}
                  onChange={(e) =>
                    setModeForm({
                      ...modeForm,
                      api_enabled: e.target.checked,
                    })
                  }
                />
                Public CMS API enabled
              </label>

              <SaveSectionButton
                saving={saving}
                disabled={saveDisabled}
                label="Save Website Mode"
              />
            </>
          )}
        </form>
      </AdminCard>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminCard>
          <form onSubmit={saveContent} className="space-y-8">
            <SectionHeader
              title="Website Layout"
              description="Pick the homepage structure that best fits this business."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              {WEBSITE_LAYOUTS.map((layout) => (
                <LayoutCard
                  key={layout.value}
                  layout={layout}
                  selected={form.website_layout === layout.value}
                  disabled={!layoutColumnAvailable}
                  onSelect={() =>
                    setForm({ ...form, website_layout: layout.value })
                  }
                />
              ))}
            </div>

            <SaveSectionButton
              saving={saving}
              disabled={saveDisabled}
              label="Save Layout"
            />

            <SectionHeader
              title="Branding"
              description="Fine-tune the site feel. Logo and brand colours are managed in Business Settings."
            />

            <div className="grid gap-5 md:grid-cols-3">
              <AdminSelect
                label="Theme Style"
                value={form.website_theme}
                onChange={(e) =>
                  setForm({ ...form, website_theme: e.target.value })
                }
                options={[
                  { label: "Industrial", value: "industrial" },
                  { label: "Corporate", value: "corporate" },
                  { label: "Modern", value: "modern" },
                  { label: "Minimal", value: "minimal" },
                  { label: "Premium", value: "premium" },
                ]}
              />

              <AdminSelect
                label="Corner Style"
                value={form.website_radius}
                onChange={(e) =>
                  setForm({ ...form, website_radius: e.target.value })
                }
                options={[
                  { label: "Rounded", value: "rounded" },
                  { label: "Soft Rounded", value: "soft" },
                  { label: "Sharp", value: "sharp" },
                ]}
              />

              <AdminSelect
                label="Shadow Style"
                value={form.website_shadow}
                onChange={(e) =>
                  setForm({ ...form, website_shadow: e.target.value })
                }
                options={[
                  { label: "Soft", value: "soft" },
                  { label: "Medium", value: "medium" },
                  { label: "Strong", value: "strong" },
                ]}
              />
            </div>

            <SaveSectionButton
              saving={saving}
              disabled={saveDisabled}
              label="Save Branding"
            />

            <SectionHeader
              title="Hero"
              description="Keep this clear and customer-focused. The selected layout controls how it appears."
            />

            <AdminInput
              label="Hero Label"
              value={form.hero_label}
              onChange={(e) =>
                setForm({ ...form, hero_label: e.target.value })
              }
            />

            <AdminInput
              label="Hero Title"
              value={form.hero_title}
              onChange={(e) =>
                setForm({ ...form, hero_title: e.target.value })
              }
            />

            <AdminTextarea
              label="Hero Subtitle"
              rows={4}
              value={form.hero_subtitle}
              onChange={(e) =>
                setForm({ ...form, hero_subtitle: e.target.value })
              }
            />

            <div className="grid gap-5 md:grid-cols-2">
              <AdminInput
                label="Primary CTA Label"
                value={form.primary_cta_label}
                onChange={(e) =>
                  setForm({ ...form, primary_cta_label: e.target.value })
                }
              />

              <AdminInput
                label="Secondary CTA Label"
                value={form.secondary_cta_label}
                onChange={(e) =>
                  setForm({ ...form, secondary_cta_label: e.target.value })
                }
              />
            </div>

            <ImageUpload
              label="Hero Image"
              uploading={uploadingHero}
              imageUrl={form.hero_image_url}
              onChange={(file) => uploadImage(file, "hero_image_url", "hero")}
            />

            <SaveSectionButton
              saving={saving}
              disabled={saveDisabled}
              label="Save Hero"
            />

            <SectionHeader
              title="About"
              description="A short credibility section shown beneath the homepage hero."
            />

            <AdminInput
              label="About Title"
              value={form.about_title}
              onChange={(e) =>
                setForm({ ...form, about_title: e.target.value })
              }
            />

            <AdminTextarea
              label="About Text"
              rows={5}
              value={form.about_text}
              onChange={(e) =>
                setForm({ ...form, about_text: e.target.value })
              }
            />

            <SaveSectionButton
              saving={saving}
              disabled={saveDisabled}
              label="Save About"
            />

            <SectionHeader
              title="Contact / CTA"
              description="Keep the public contact page copy clear and enquiry-focused."
            />

            <AdminInput
              label="Contact Page Title"
              value={form.contact_page_title}
              onChange={(e) =>
                setForm({ ...form, contact_page_title: e.target.value })
              }
            />

            <AdminTextarea
              label="Contact Page Subtitle"
              rows={3}
              value={form.contact_page_subtitle}
              onChange={(e) =>
                setForm({ ...form, contact_page_subtitle: e.target.value })
              }
            />

            <SaveSectionButton
              saving={saving}
              disabled={saveDisabled}
              label="Save Contact"
            />

            <SectionHeader
              title="SEO Settings"
              description="Control the homepage browser title and Google description."
            />

            <AdminInput
              label="Home Meta Title"
              value={form.home_meta_title}
              onChange={(e) =>
                setForm({ ...form, home_meta_title: e.target.value })
              }
            />

            <AdminTextarea
              label="Home Meta Description"
              rows={3}
              value={form.home_meta_description}
              onChange={(e) =>
                setForm({ ...form, home_meta_description: e.target.value })
              }
            />

            <SaveSectionButton
              saving={saving}
              disabled={saveDisabled}
              label="Save SEO"
            />

            <SectionHeader
              title="Images / Media"
              description="Update the social sharing image shown when the website is shared."
            />

            <ImageUpload
              label="Social Sharing Image"
              uploading={uploadingOg}
              imageUrl={form.og_image_url}
              onChange={(file) => uploadImage(file, "og_image_url", "og")}
            />

            <SaveSectionButton
              saving={saving}
              disabled={saveDisabled}
              label="Save Media"
            />

            <SaveSectionButton
              saving={saving}
              disabled={saveDisabled}
              label="Save All Changes"
            />
          </form>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard>
            <h2 className="text-2xl font-black text-slate-950">Preview</h2>

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-[#101820] p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f2a900]">
                  {form.hero_label || "Online Product Catalogue"}
                </p>
                <h3 className="mt-3 text-2xl font-black">
                  {form.hero_title || business?.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {form.hero_subtitle ||
                    "Browse products, view datasheets and request a quote."}
                </p>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <PreviewStat
                  label="Layout"
                  value={
                    WEBSITE_LAYOUTS.find(
                      (layout) => layout.value === form.website_layout
                    )?.name || "Industrial Classic"
                  }
                />
                <PreviewStat
                  label="Style"
                  value={`${form.website_theme} · ${form.website_radius}`}
                />
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-2xl font-black text-slate-950">
              Social / SEO Preview
            </h2>

            <div className="mt-5 overflow-hidden rounded-2xl bg-slate-100">
              {form.og_image_url && (
                <img
                  src={form.og_image_url}
                  alt="OG preview"
                  className="h-44 w-full object-cover"
                />
              )}

              <div className="p-5">
                <p className="text-xs text-slate-500">
                  {business?.slug || "business"}.co.za
                </p>
                <h3 className="mt-2 text-lg font-bold text-blue-700">
                  {form.home_meta_title || form.hero_title || business?.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {form.home_meta_description ||
                    form.hero_subtitle ||
                    "Meta description preview..."}
                </p>
              </div>
            </div>
          </AdminCard>

          {modeForm.website_mode === "custom" && (
            <AdminCard>
              <h2 className="text-2xl font-black text-slate-950">
                Developer / Custom Frontend
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                These safe public endpoints can power a custom website while
                this CMS remains the backend.
              </p>

              <div className="mt-5 space-y-3">
                <ApiEndpoint
                  label="Base"
                  value={`/api/public/${business?.slug}`}
                />
                <ApiEndpoint label="Site" value={`/api/public/${business?.slug}/site`} />
                <ApiEndpoint
                  label="Products"
                  value={`/api/public/${business?.slug}/products`}
                />
                <ApiEndpoint
                  label="Product Detail"
                  value={`/api/public/${business?.slug}/products/{productSlug}`}
                />
                <ApiEndpoint
                  label="Categories"
                  value={`/api/public/${business?.slug}/categories`}
                />
                <ApiEndpoint
                  label="Enquiries"
                  value={`/api/public/${business?.slug}/enquiries`}
                />
              </div>
            </AdminCard>
          )}

          <AdminCard>
            <h2 className="text-xl font-black text-slate-950">
              Public Website
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              View the live public website after saving.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <PublicLink href={`/${business?.slug}`}>Open Home</PublicLink>
              <PublicLink href={`/${business?.slug}/products`}>
                Open Products
              </PublicLink>
              <PublicLink href={`/${business?.slug}/contact`} accent>
                Open Contact
              </PublicLink>
              <Link
                href="/admin/settings"
                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700"
              >
                Brand Settings
              </Link>
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminLayout>
  );
}

function SaveSectionButton({
  saving,
  disabled,
  label = "Save Website Settings",
}) {
  return (
    <AdminButton
      type="submit"
      className="w-full bg-[#f2a900] text-slate-950 hover:bg-[#d99800]"
      disabled={disabled}
    >
      {saving ? "Saving Website..." : label}
    </AdminButton>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="border-t border-slate-200 pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function LayoutCard({ layout, selected, disabled, onSelect }) {
  return (
    <div
      className={`rounded-3xl border p-4 transition ${
        selected
          ? "border-[#f2a900] bg-[#fff8e6] shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <MiniPreview type={layout.preview} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h3 className="font-black text-slate-950">{layout.name}</h3>
        {selected && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Selected</span>}
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {layout.description}
      </p>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        Best for
      </p>
      <p className="mt-1 text-sm font-bold text-slate-700">{layout.bestFor}</p>

      <AdminButton
        type="button"
        variant={selected ? "primary" : "secondary"}
        className="mt-4 w-full"
        disabled={disabled}
        onClick={onSelect}
      >
        {selected ? "Selected Layout" : "Select Layout"}
      </AdminButton>
    </div>
  );
}

function MiniPreview({ type }) {
  const block = "rounded-xl";

  if (type === "grid") {
    return (
      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
        <div className={`${block} h-8 bg-slate-100`} />
        <div className="mt-3 grid grid-cols-4 gap-2">
          <div className={`${block} h-10 bg-slate-200`} />
          <div className={`${block} h-10 bg-slate-200`} />
          <div className={`${block} h-10 bg-slate-200`} />
          <div className={`${block} h-10 bg-[#f2a900]`} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className={`${block} h-12 bg-white ring-1 ring-slate-200`} />
          <div className={`${block} h-12 bg-white ring-1 ring-slate-200`} />
        </div>
      </div>
    );
  }

  if (type === "split") {
    return (
      <div className="rounded-2xl bg-slate-100 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className={`${block} h-20 bg-white ring-1 ring-slate-200`} />
          <div className={`${block} h-20 bg-[#101820]`} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className={`${block} h-5 bg-white`} />
          <div className={`${block} h-5 bg-white`} />
          <div className={`${block} h-5 bg-[#f2a900]`} />
        </div>
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="rounded-2xl bg-[#101820] p-3">
        <div className={`${block} h-24 bg-white/20`} />
        <div className="-mt-8 ml-3 max-w-[75%] rounded-xl bg-[#f2a900] p-2">
          <div className="h-2 rounded bg-[#101820]/60" />
          <div className="mt-2 h-2 w-2/3 rounded bg-[#101820]/40" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className={`${block} h-8 bg-white/20`} />
          <div className={`${block} h-8 bg-white/20`} />
          <div className={`${block} h-8 bg-white/20`} />
        </div>
      </div>
    );
  }

  if (type === "minimal") {
    return (
      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
        <div className={`${block} h-3 w-1/2 bg-slate-900`} />
        <div className={`${block} mt-3 h-3 w-5/6 bg-slate-200`} />
        <div className={`${block} mt-2 h-3 w-2/3 bg-slate-200`} />
        <div className={`${block} mt-4 h-8 w-1/2 bg-[#f2a900]`} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#101820] p-3">
      <div className={`${block} h-4 w-1/2 bg-[#f2a900]`} />
      <div className={`${block} mt-3 h-16 max-w-[78%] bg-white/15`} />
      <div className="mt-3 grid grid-cols-3 gap-0 overflow-hidden rounded-xl border border-white/10">
        <div className="h-8 bg-white/20" />
        <div className="h-8 bg-white/10" />
        <div className="h-8 bg-white/20" />
      </div>
    </div>
  );
}

function ImageUpload({ label, uploading, imageUrl, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>
      <input
        type="file"
        accept="image/*"
        className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {uploading && <p className="mt-2 text-sm text-slate-500">Uploading...</p>}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`${label} preview`}
          className="mt-4 h-52 w-full rounded-2xl object-cover"
        />
      )}
    </div>
  );
}

function PreviewStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}

function PublicLink({ href, children, accent = false }) {
  return (
    <a
      href={href}
      target="_blank"
      className={`inline-flex justify-center rounded-xl px-5 py-3 text-sm font-bold ${
        accent ? "bg-[#f2a900] text-slate-950" : "bg-slate-900 text-white"
      }`}
    >
      {children}
    </a>
  );
}

function ApiEndpoint({ label, value }) {
  async function copyEndpoint() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} API copied`);
    } catch {
      toast.error("Unable to copy endpoint");
    }
  }

  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <code className="mt-2 block break-all text-sm font-bold text-slate-800">
            {value}
          </code>
        </div>

        <button
          type="button"
          onClick={copyEndpoint}
          className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
