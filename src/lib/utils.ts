import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format runtime minutes into a clean display: e.g. 142 -> "2h 22m", 0 -> "0m"
 */
export function formatRuntime(minutes?: number | null): string {
  if (minutes === 0) return "0m";
  if (!minutes || minutes < 0) return "--";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format date into "d MMM yyyy" format (e.g. 24 Oct 2024)
 */
export function formatDate(dateInput?: Date | string | null): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format date into relative human readable string (e.g. "in 3 days", "2 days ago")
 */
export function formatRelativeDate(dateInput?: Date | string | null): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "in 1 day";
  if (diffDays > 1 && diffDays < 30) return `in ${diffDays} days`;
  if (diffDays >= 30 && diffDays < 60) return "in 1 month";
  if (diffDays >= 60 && diffDays < 365) return `in ${Math.round(diffDays / 30)} months`;
  if (diffDays >= 365) return `in ${Math.round(diffDays / 365)} years`;

  const absDays = Math.abs(diffDays);
  if (absDays === 1) return "1 day ago";
  if (absDays < 30) return `${absDays} days ago`;
  if (absDays < 60) return "1 month ago";
  if (absDays < 365) return `${Math.round(absDays / 30)} months ago`;
  return `${Math.round(absDays / 365)} years ago`;
}

/**
 * Format release date string into release year: e.g. "2024-10-24" -> "2024"
 */
export function formatYear(dateStr?: string | null): string {
  if (!dateStr) return "--";
  return dateStr.split("-")[0] || "--";
}

/**
 * Format score to 1 decimal place: e.g. 8.42 -> "8.4"
 */
export function formatScore(score?: number | null): string {
  if (score === undefined || score === null || isNaN(score)) return "--";
  return score.toFixed(1);
}

/**
 * Return dynamic greeting based on time of day (Original Cineaste formula: Ibe)
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}
