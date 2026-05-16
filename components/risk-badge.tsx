import { AlertTriangle, CheckCircle2, CircleHelp, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RiskLevel } from "@/src/lib/contracts/types";

type OverallRisk = "high" | "medium" | "low";
type BadgeRisk = RiskLevel | OverallRisk;

const badgeConfig: Record<
  BadgeRisk,
  {
    label: string;
    className: string;
    icon: typeof AlertTriangle;
  }
> = {
  danger: {
    label: "위험",
    className: "border-danger/25 bg-danger/10 text-danger",
    icon: ShieldAlert
  },
  high: {
    label: "고위험",
    className: "border-danger/25 bg-danger/10 text-danger",
    icon: ShieldAlert
  },
  warning: {
    label: "주의",
    className: "border-warn/25 bg-warn/10 text-warn",
    icon: AlertTriangle
  },
  medium: {
    label: "점검 필요",
    className: "border-warn/25 bg-warn/10 text-warn",
    icon: AlertTriangle
  },
  safe: {
    label: "정상",
    className: "border-safe/25 bg-safe/10 text-safe",
    icon: ShieldCheck
  },
  low: {
    label: "낮은 위험",
    className: "border-safe/25 bg-safe/10 text-safe",
    icon: CheckCircle2
  },
  missing: {
    label: "빠진 조항",
    className: "border-ink/15 bg-ink/5 text-ink",
    icon: CircleHelp
  }
};

const sizeClasses = {
  sm: "gap-1.5 px-2 py-1 text-xs",
  md: "gap-2 px-3 py-1.5 text-sm",
  lg: "gap-2.5 px-4 py-2 text-base"
};

const iconSizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5"
};

export function RiskBadge({
  level,
  label,
  size = "md",
  className = ""
}: {
  level: BadgeRisk;
  label?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const config = badgeConfig[level];
  const Icon = config.icon;

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full border font-semibold leading-none",
        config.className,
        sizeClasses[size],
        className
      ].join(" ")}
    >
      <Icon aria-hidden="true" className={iconSizeClasses[size]} />
      {label || config.label}
    </span>
  );
}
