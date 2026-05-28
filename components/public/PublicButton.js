import Link from "next/link";
import { buttonStyle } from "@/lib/theme";

export default function PublicButton({
  href,
  children,
  theme,
  variant = "accent",
  className = "",
}) {
  const isOutline = variant === "outline";
  const isDark = variant === "dark";
  const classes = `inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-slate-300 ${
    isOutline
      ? "border border-slate-300 bg-white text-slate-900"
      : isDark
        ? "bg-[#101820] text-white"
        : ""
  } ${className}`;
  const style = isOutline || isDark ? undefined : buttonStyle(theme, variant);

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        style={style}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      style={style}
    >
      {children}
    </button>
  );
}
