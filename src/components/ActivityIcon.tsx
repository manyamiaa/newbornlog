import * as LucideIcons from "lucide-react";
import { Baby } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ActivityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ((LucideIcons as unknown as Record<string, LucideIcon>)[name] ?? Baby) as LucideIcon;
  return <Icon className={className} />;
}
