export function getBusinessTheme(business) {
  return {
    primary: business?.primary_color || "#1f5f8b",
    accent: business?.accent_color || "#f2a900",
    dark: "#101820",
    light: "#f8fafc",
    name: business?.name || "Business",
    logo: business?.logo_url || "",
  };
}

export function buttonStyle(theme, variant = "primary") {
  if (variant === "accent") {
    return {
      backgroundColor: theme.accent,
      color: "#101820",
    };
  }

  if (variant === "primary") {
    return {
      backgroundColor: theme.primary,
      color: "#ffffff",
    };
  }

  return {};
}

export function sectionStyle(theme) {
  return {
    backgroundColor: theme.primary,
  };
}