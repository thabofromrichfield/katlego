/**
 * Local copy of the tailwind-merge + clsx `cn` helper, so the vendored
 * bklit-ui chart components resolve imports without depending on Katlego's
 * app-level lib/utils (which mirrors the upstream @/lib/utils contract).
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
