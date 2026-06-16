"use client";

import { useTranslations } from "next-intl";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const t = useTranslations("common");
  const base = "rounded-full font-bold text-sm py-3 px-6 transition-all duration-150 ease-out active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-natural-green hover:bg-natural-green-hover text-white shadow-md shadow-natural-green/10",
    secondary: "bg-white border border-natural-border text-natural-charcoal hover:border-natural-green hover:text-natural-green",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t("loading")}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
