import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count: number;
  maxCount: number;
  variant: "work" | "audience" | "others";
  delay?: number;
}

const variantStyles = {
  work: {
    bg: "bg-work-light",
    border: "border-work/20 hover:border-work/40",
    iconBg: "bg-work/10",
    iconColor: "text-work",
    progressBg: "bg-work/20",
    progressFill: "bg-work",
  },
  audience: {
    bg: "bg-audience-light",
    border: "border-audience/20 hover:border-audience/40",
    iconBg: "bg-audience/10",
    iconColor: "text-audience",
    progressBg: "bg-audience/20",
    progressFill: "bg-audience",
  },
  others: {
    bg: "bg-others-light",
    border: "border-others/20 hover:border-others/40",
    iconBg: "bg-others/10",
    iconColor: "text-others",
    progressBg: "bg-others/20",
    progressFill: "bg-others",
  },
};

export function CategoryCard({
  title,
  description,
  icon: Icon,
  count,
  maxCount,
  variant,
  delay = 0,
}: CategoryCardProps) {
  const styles = variantStyles[variant];
  const percentage = (count / maxCount) * 100;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-500",
        "hover:shadow-lg hover:-translate-y-1 cursor-pointer",
        "opacity-0 animate-fade-in-up",
        styles.border,
        styles.bg
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Icon */}
      <div
        className={cn(
          "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
          styles.iconBg
        )}
      >
        <Icon className={cn("h-7 w-7", styles.iconColor)} />
      </div>

      {/* Content */}
      <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">الرسائل</span>
          <span className="font-semibold text-foreground">
            {count} / {maxCount}
          </span>
        </div>
        <div className={cn("h-2 rounded-full overflow-hidden", styles.progressBg)}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              styles.progressFill
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Decorative gradient */}
      <div
        className={cn(
          "absolute -left-20 -top-20 h-40 w-40 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-30",
          variant === "work" && "bg-work",
          variant === "audience" && "bg-audience",
          variant === "others" && "bg-others"
        )}
      />
    </div>
  );
}
