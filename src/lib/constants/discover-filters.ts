import {
  Drama,
  Globe,
  Calendar,
  Star,
  Clock,
  Smile,
  type LucideIcon,
} from "lucide-react";

export interface DiscoverFilterState {
  genre: string;
  language: string;
  year: string;
  minRating: string | number;
  length: string;
  mood: string;
}

export const INITIAL_FILTER_STATE: DiscoverFilterState = {
  genre: "",
  language: "",
  year: "",
  minRating: "",
  length: "",
  mood: "",
};

export interface FilterCategoryDef {
  key: keyof DiscoverFilterState;
  label: string;
  icon: LucideIcon;
}

/**
 * Original Filter Categories (Ube)
 */
export const FILTER_CATEGORIES: FilterCategoryDef[] = [
  { key: "genre", label: "Genre", icon: Drama },
  { key: "language", label: "Language", icon: Globe },
  { key: "year", label: "Year", icon: Calendar },
  { key: "minRating", label: "Rating", icon: Star },
  { key: "length", label: "Runtime", icon: Clock },
  { key: "mood", label: "Mood", icon: Smile },
];

/**
 * Mood to TMDB Genre IDs mapping (Zbe)
 */
export const MOOD_GENRE_MAP: Record<string, string> = {
  feelgood: "35,10749,10751",
  dark: "80,53,18",
  mindbending: "878,9648",
  action: "28,12",
  spooky: "27,53",
  heart: "18,10749",
  funny: "35",
};

/**
 * Mood options (qbe)
 */
export const MOOD_OPTIONS = [
  { v: "feelgood", l: "Feel-good" },
  { v: "dark", l: "Dark & gritty" },
  { v: "mindbending", l: "Mind-bending" },
  { v: "action", l: "Action rush" },
  { v: "spooky", l: "Spooky" },
  { v: "heart", l: "Heart-tugging" },
  { v: "funny", l: "Funny" },
];

/**
 * Language options (zbe)
 */
export const LANGUAGE_OPTIONS = [
  { v: "", l: "Any" },
  { v: "ta|te|ml|kn", l: "South Indian Cinema" },
  { v: "hi", l: "Hindi Cinema" },
  { v: "ta", l: "Tamil" },
  { v: "te", l: "Telugu" },
  { v: "ml", l: "Malayalam" },
  { v: "kn", l: "Kannada" },
  { v: "pa", l: "Punjabi" },
  { v: "bn", l: "Bengali" },
  { v: "mr", l: "Marathi" },
  { v: "en", l: "English" },
  { v: "ko", l: "Korean" },
  { v: "ja", l: "Japanese" },
  { v: "fr", l: "French" },
  { v: "es", l: "Spanish" },
];

/**
 * Year options (Wbe)
 */
export const YEAR_OPTIONS = [
  "",
  2026,
  2025,
  2024,
  2023,
  2022,
  2021,
  2020,
  2019,
  2018,
  2015,
  2010,
  2000,
  1990,
];

/**
 * Minimum rating options (Vbe)
 */
export const RATING_OPTIONS = [
  { v: "", l: "Any" },
  { v: 9, l: "9+ ★" },
  { v: 8, l: "8+ ★" },
  { v: 7, l: "7+ ★" },
  { v: 6, l: "6+ ★" },
  { v: 5, l: "5+ ★" },
];

/**
 * Runtime length options (Hbe)
 */
export const RUNTIME_OPTIONS = [
  { v: "", l: "Any" },
  { v: "short", l: "≤ 90m" },
  { v: "medium", l: "90–150m" },
  { v: "long", l: "≥ 150m" },
];

/**
 * Decades list (NL)
 */
export const DECADE_OPTIONS = [
  { label: "2020s", from: 2020, to: 2029 },
  { label: "2010s", from: 2010, to: 2019 },
  { label: "2000s", from: 2000, to: 2009 },
  { label: "1990s", from: 1990, to: 1999 },
  { label: "1980s", from: 1980, to: 1989 },
  { label: "1970s", from: 1970, to: 1979 },
  { label: "1960s", from: 1960, to: 1969 },
];

/**
 * Suggestions & trending vibe pills (t0e & n0e)
 */
export const AI_SUGGESTIONS = [
  "Best Tamil thrillers after 2022",
  "Funny Malayalam movies",
  "Oscar-winning dramas",
  "Marvel movies",
  "Mind-bending sci-fi",
  "Cozy weekend watch",
];

export const TRENDING_SEARCHES = [
  "Tamil thrillers",
  "Oscar dramas",
  "Marvel movies",
  "Funny Malayalam movies",
  "90s action movies",
  "Space horror",
];
