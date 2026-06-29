import { Crown, Award, Medal } from "lucide-react";

const BADGE_CONFIG = {
  gold: { icon: Crown, label: "Doador Ouro", className: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  silver: { icon: Award, label: "Doador Prata", className: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
  bronze: { icon: Medal, label: "Doador Bronze", className: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/30" },
};

export default function DonorBadge({ type, showLabel }: { type: "gold" | "silver" | "bronze"; showLabel?: boolean }) {
  const config = BADGE_CONFIG[type];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {showLabel && config.label}
    </span>
  );
}

export const badgeOrder = ["gold", "silver", "bronze"] as const;
export const badgeTypes = ["gold", "silver", "bronze"] as const;
