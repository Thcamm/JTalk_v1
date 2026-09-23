import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
}

export const LoadingSpinner = ({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <Loader2 className={`${sizeMap[size]} text-rose-500 animate-spin`} />
      {label && <p className="text-sm font-medium text-slate-500 animate-pulse">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
