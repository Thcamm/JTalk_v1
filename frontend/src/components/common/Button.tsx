import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "premium";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 active:scale-98 disabled:opacity-60 disabled:pointer-events-none cursor-pointer";

  const variantStyles = {
    primary:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md focus:ring-emerald-500",
    secondary:
      "bg-blue-500 hover:bg-blue-600 text-white shadow-xs hover:shadow-md focus:ring-blue-400",
    outline:
      "border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-slate-400",
    ghost:
      "hover:bg-slate-100 text-slate-700 focus:ring-slate-300",
    danger:
      "bg-rose-500 hover:bg-rose-600 text-white shadow-xs focus:ring-rose-400",
    premium:
      "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold shadow-md hover:shadow-lg focus:ring-amber-400",
  };

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3.5 gap-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
