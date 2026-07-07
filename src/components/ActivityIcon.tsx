import * as LucideIcons from "lucide-react";
import { Baby } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ActivityIcon({ name, className, strokeWidth }: { name: string; className?: string; strokeWidth?: number }) {
  const Icon = ((LucideIcons as unknown as Record<string, LucideIcon>)[name] ?? Baby) as LucideIcon;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
