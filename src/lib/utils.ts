import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isLocalhostHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1"
}

export function withTenantPrefix(path: string, tenantSlug: string | null | undefined) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  if (!tenantSlug) return normalized
  if (!isLocalhostHost(window.location.hostname)) return normalized
  if (tenantSlug === "dev") return normalized
  if (normalized === "/") return `/${tenantSlug}`
  return `/${tenantSlug}${normalized}`
}
