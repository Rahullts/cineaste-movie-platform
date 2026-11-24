export interface NavItem {
  to: string;
  label: string;
  iconName:
    | "LayoutDashboard"
    | "Compass"
    | "Bookmark"
    | "Heart"
    | "FolderHeart"
    | "Upload"
    | "Calendar"
    | "CreditCard"
    | "User"
    | "Settings"
    | "Shield";
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Original Cineaste Sidebar Navigation Sections (Verified from live bundle: Yfe, Xfe)
 */
export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", iconName: "LayoutDashboard" },
      { to: "/discover", label: "Discover", iconName: "Compass" },
      { to: "/library?tab=watchlist", label: "Watchlist", iconName: "Bookmark" },
      { to: "/library?tab=favorites", label: "Favorites", iconName: "Heart" },
      { to: "/library?tab=collections", label: "Collections", iconName: "FolderHeart" },
      { to: "/library?tab=import", label: "Import", iconName: "Upload" },
      { to: "/library?tab=timeline", label: "Timeline", iconName: "Calendar" },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/billing", label: "Billing", iconName: "CreditCard" },
      { to: "/profile", label: "Profile", iconName: "User" },
      { to: "/settings", label: "Settings", iconName: "Settings" },
    ],
  },
];

/**
 * Mobile Navigation Items (Aligned with 5 Floating Dock Destinations)
 */
export const MOBILE_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", iconName: "LayoutDashboard" },
  { to: "/discover", label: "Discover", iconName: "Compass" },
  { to: "/watchlist", label: "Watchlist", iconName: "Bookmark" },
  { to: "/activity", label: "Activity", iconName: "Calendar" },
  { to: "/settings", label: "Settings", iconName: "Settings" },
] as const;

/**
 * Original Quick Actions List (Verified from live bundle: Dxe)
 */
export const QUICK_ACTIONS = [
  {
    id: "search",
    label: "Search Movie",
    desc: "Find any film by title",
    palette: true,
    iconName: "Compass",
  },
  {
    id: "add",
    label: "Add Movie",
    desc: "Browse and save to your watchlist",
    to: "/discover",
    iconName: "Bookmark",
  },
  {
    id: "import",
    label: "Import & Timeline",
    desc: "Letterboxd importer & cinema timeline",
    to: "/activity?tab=import",
    iconName: "Upload",
  },
  {
    id: "collection",
    label: "My Library",
    desc: "Curated shelves & favorites archive",
    to: "/library?tab=collections",
    iconName: "FolderHeart",
  },
  {
    id: "link",
    label: "Paste Link",
    desc: "Add a film from a TMDB or IMDb link",
    to: "/discover",
    iconName: "Compass",
  },
] as const;

/**
 * Original AI Vibe Search Prompts (Verified from live bundle: Rxe)
 */
export const AI_VIBES_PROMPTS = [
  "time travel movie",
  "psychological thriller",
  "feel-good comedy",
  "dark gritty crime",
  "mind-bending sci-fi",
  "90s action movies",
] as const;

/**
 * Original Keyboard Jump Shortcuts (Verified from live bundle: SL)
 */
export const KEYBOARD_SHORTCUTS = {
  d: { to: "/dashboard", label: "Dashboard" },
  s: { to: "/discover", label: "Discover" },
  w: { to: "/watchlist", label: "Watchlist" },
  l: { to: "/library", label: "My Library" },
  f: { to: "/library?tab=favorites", label: "Favorites" },
  c: { to: "/library?tab=collections", label: "Collections" },
  a: { to: "/activity", label: "Activity Hub" },
  i: { to: "/activity?tab=import", label: "Import" },
  t: { to: "/activity?tab=timeline", label: "Timeline" },
} as const;

/**
 * Original Storage Key for Recent Searches (Verified from live bundle: U9)
 */
export const RECENT_SEARCHES_STORAGE_KEY = "cineaste:recent-searches";

/**
 * TMDB 19 Genre Mapping
 */
export const TMDB_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
] as const;

/**
 * Cineaste Source of Truth Colors
 */
export const BRAND_COLORS = {
  background: "#0A0B0F",
  surface: "#101118",
  border: "#1E1F2A",
  primary: "#00D664",
  gold: "#FBBF24",
  foreground: "#F3F4F6",
  mutedForeground: "#9496A1",
} as const;
