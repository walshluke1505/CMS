export function getWebsiteTheme(content) {
  const theme = content?.website_theme || "industrial";

  const radiusMap = {
    rounded: "rounded-3xl",
    soft: "rounded-2xl",
    sharp: "rounded-none",
  };

  const shadowMap = {
    soft: "shadow-sm",
    medium: "shadow-md",
    strong: "shadow-xl",
  };

  const base = {
    radius: radiusMap[content?.website_radius] || "rounded-3xl",
    shadow: shadowMap[content?.website_shadow] || "shadow-sm",
  };

  const themes = {
    industrial: {
      name: "Industrial",
      container: "max-w-7xl",
      pageBg: "bg-slate-100",
      heroBg: "bg-slate-950",
      heroOverlay:
        "bg-[linear-gradient(135deg,rgba(15,23,42,0.2),rgba(2,6,23,0.9)),radial-gradient(circle_at_top_right,rgba(242,169,0,0.18),transparent_35%)]",
      sectionBg: "bg-slate-100",
      cardStyle: "bg-white border border-slate-300",
      imageStyle: "grayscale contrast-125",
      heading: "tracking-tight uppercase",
      subheading: "text-slate-600",
      sectionSpacing: "py-20",
      heroSpacing: "py-24",
      navStyle: "bg-white border-b border-slate-300",
    },

    corporate: {
      name: "Corporate",
      container: "max-w-7xl",
      pageBg: "bg-slate-50",
      heroBg: "bg-gradient-to-br from-white via-slate-50 to-slate-100",
      heroOverlay:
        "bg-[radial-gradient(circle_at_top_right,rgba(31,95,139,0.12),transparent_32%)]",
      sectionBg: "bg-slate-50",
      cardStyle: "bg-white border border-slate-200",
      imageStyle: "",
      heading: "tracking-tight",
      subheading: "text-slate-600",
      sectionSpacing: "py-20",
      heroSpacing: "py-20",
      navStyle: "bg-white/95 backdrop-blur border-b border-slate-200",
      lightHero: true,
    },

    modern: {
      name: "Modern",
      container: "max-w-6xl",
      pageBg: "bg-white",
      heroBg: "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950",
      heroOverlay:
        "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(242,169,0,0.14),transparent_30%)]",
      sectionBg: "bg-white",
      cardStyle: "bg-white border border-slate-100",
      imageStyle: "scale-105 saturate-125",
      heading: "tracking-[-0.05em]",
      subheading: "text-slate-500",
      sectionSpacing: "py-28",
      heroSpacing: "py-28",
      navStyle: "bg-white/80 backdrop-blur-xl border-b border-slate-100",
    },

    minimal: {
      name: "Minimal",
      container: "max-w-5xl",
      pageBg: "bg-white",
      heroBg: "bg-white",
      heroOverlay: "",
      sectionBg: "bg-white",
      cardStyle: "bg-white border border-slate-100 shadow-none",
      imageStyle: "",
      heading: "tracking-tight",
      subheading: "text-slate-500",
      sectionSpacing: "py-14",
      heroSpacing: "py-16",
      navStyle: "bg-white border-b border-slate-100",
      lightHero: true,
    },

    premium: {
      name: "Premium",
      container: "max-w-7xl",
      pageBg: "bg-[#f7f3ed]",
      heroBg: "bg-[#111111]",
      heroOverlay:
        "bg-[radial-gradient(circle_at_top_right,rgba(242,169,0,0.22),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%)]",
      sectionBg: "bg-[#f7f3ed]",
      cardStyle: "bg-white/95 border border-[#e6dccd]",
      imageStyle: "brightness-95 contrast-110",
      heading: "tracking-[-0.06em]",
      subheading: "text-stone-600",
      sectionSpacing: "py-28",
      heroSpacing: "py-28",
      navStyle: "bg-[#f7f3ed]/90 backdrop-blur-xl border-b border-[#e6dccd]",
    },
  };

  return {
    ...base,
    ...(themes[theme] || themes.industrial),
  };
}