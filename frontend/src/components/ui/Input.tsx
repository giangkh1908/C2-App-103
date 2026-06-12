"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-[13px] font-bold text-natural-charcoal">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-natural-dark placeholder:text-natural-dashed
          outline-none transition-all duration-150 ease-out
          ${error
            ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            : "border-natural-border focus:border-natural-green focus:ring-1 focus:ring-natural-green/20"
          }
          ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[11px] font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}
