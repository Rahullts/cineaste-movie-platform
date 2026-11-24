"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Sparkles,
  Download,
  Check,
  X,
  ArrowRight,
  Database,
  Layers,
  FolderHeart,
  HelpCircle,
  Clock,
  Eye,
  Bookmark,
} from "lucide-react";
import { tmdbFetch } from "@/lib/tmdb-service";
import type { Movie, TimelineActivity, Collection } from "@/types";

export type LetterboxdFileType = "watched" | "watchlist" | "ratings" | "list" | "unknown";

export interface ParsedCsvEntry {
  title: string;
  year?: number | null;
  rating?: number | null;
  watchedAt?: string | null;
  description?: string;
  listName?: string;
}

export interface ParsedFile {
  name: string;
  type: LetterboxdFileType;
  entries: ParsedCsvEntry[];
}

export interface ImportSummary {
  addedWatched: number;
  addedWant: number;
  updated: number;
  skipped: number;
  collectionsCreated: number;
  collectionMoviesAdded: number;
  unmatched: number;
  totalParsed: number;
}

interface ImportSectionProps {
  existingMovies: Movie[];
  onBatchImport: (
    movies: Movie[],
    activities?: TimelineActivity[]
  ) => { added: number; updated: number; skipped: number };
  onCreateCollection?: (
    title: string,
    color?: string,
    description?: string,
    initialMovies?: Movie[]
  ) => Collection;
}

const FILE_TYPE_LABELS: Record<LetterboxdFileType, string> = {
  watched: "Watched History",
  watchlist: "Watchlist Entries",
  ratings: "Personal Ratings",
  list: "Custom Curated List",
  unknown: "Unknown Format",
};

// Global memoized cache for TMDB matching across batches
const tmdbMatchCache = new Map<string, Movie | null>();

export function ImportSection({
  existingMovies,
  onBatchImport,
  onCreateCollection,
}: ImportSectionProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [parsedFiles, setParsedFiles] = React.useState<ParsedFile[]>([]);
  const [importState, setImportState] = React.useState<"idle" | "matching" | "saving" | "done">("idle");
  const [matchProgress, setMatchProgress] = React.useState(0);
  const [summary, setSummary] = React.useState<ImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const totalEntriesCount = React.useMemo(
    () => parsedFiles.reduce((acc, f) => acc + f.entries.length, 0),
    [parsedFiles]
  );

  // Robust CSV parser supporting quotes and commas (Original Cineaste TNe algorithm)
  const parseCsvToObjects = (csvText: string): Record<string, string>[] => {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const fields: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          fields.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      fields.push(current.trim().replace(/^["']|["']$/g, ""));
      return fields;
    };

    const headers = parseLine(lines[0]);
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] || "";
      });
      records.push(obj);
    }
    return records;
  };

  // Classify CSV by header contents (Original Cineaste RNe algorithm)
  const classifyHeaders = (headers: string[]): LetterboxdFileType => {
    const has = (key: string) => headers.some((h) => h.toLowerCase().includes(key));
    if (has("rating")) return "ratings";
    if (has("date")) return "watched";
    if (has("description")) return "list";
    if (has("position")) return "watchlist";
    return "unknown";
  };

  // Parse a Letterboxd CSV file into structured entries (Original Cineaste MNe algorithm)
  const parseLetterboxdCsv = (csvText: string, filename: string): ParsedFile | null => {
    const records = parseCsvToObjects(csvText);
    if (!records.length) return null;

    const headers = Object.keys(records[0]);
    let type = classifyHeaders(headers);

    // Filename fallback classification
    if (type === "unknown") {
      const lower = filename.toLowerCase();
      if (lower.includes("watched")) type = "watched";
      else if (lower.includes("ratings")) type = "ratings";
      else if (lower.includes("watchlist")) type = "watchlist";
      else type = "list";
    }

    const entries: ParsedCsvEntry[] = records
      .filter((r) => r.Name || r.Title)
      .map((r) => ({
        title: (r.Name || r.Title || "").trim(),
        year: r.Year ? parseInt(r.Year, 10) : null,
        rating: r.Rating ? parseFloat(r.Rating) : null,
        watchedAt: r.Date || null,
        description: (r.Description || "").trim(),
        listName: type === "list" ? filename.replace(/\.csv$/i, "") : undefined,
      }));

    if (!entries.length) return null;

    return {
      name: filename.replace(/\.csv$/i, ""),
      type,
      entries,
    };
  };

  // Handle uploaded files
  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileList = Array.from(files);
    const parsedList: ParsedFile[] = [];

    for (const file of fileList) {
      if (file.name.toLowerCase().endsWith(".csv")) {
        try {
          const text = await file.text();
          const parsed = parseLetterboxdCsv(text, file.name);
          if (parsed && parsed.entries.length) {
            parsedList.push(parsed);
          } else {
            setErrorMessage(`Could not read "${file.name}" as a valid Letterboxd CSV.`);
          }
        } catch (err: any) {
          setErrorMessage(`Error parsing ${file.name}: ${err.message}`);
        }
      }
    }

    if (parsedList.length > 0) {
      setParsedFiles((prev) => [...prev, ...parsedList]);
      setSummary(null);
      setImportState("idle");
    }
  };

  const handleClear = () => {
    setParsedFiles([]);
    setImportState("idle");
    setMatchProgress(0);
    setSummary(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Match single title + year against TMDB (Original Cineaste DNe algorithm)
  const matchMovieWithTmdb = async (title: string, year?: number | null): Promise<Movie | null> => {
    const key = `${title.toLowerCase()}|${year || ""}`;
    if (tmdbMatchCache.has(key)) return tmdbMatchCache.get(key) || null;

    let match: Movie | null = null;
    try {
      const res = await tmdbFetch({ action: "search", query: title, page: 1 });
      const results: Movie[] = res.results || [];
      if (results.length > 0) {
        if (year) {
          match =
            results.find(
              (m) => m.release_date && m.release_date.slice(0, 4) === String(year)
            ) || results[0];
        } else {
          match = results[0];
        }
      }
    } catch {
      match = null;
    }

    tmdbMatchCache.set(key, match);
    return match;
  };

  // Batch process entries in concurrent chunks of 6 (Original Cineaste INe algorithm)
  const batchResolveTmdb = async (
    entries: ParsedCsvEntry[],
    onProgress: (current: number, total: number) => void
  ): Promise<{ entry: ParsedCsvEntry; movie: Movie | null }[]> => {
    const resolved: { entry: ParsedCsvEntry; movie: Movie | null }[] = [];
    const total = entries.length;

    for (let i = 0; i < total; i += 6) {
      const chunk = entries.slice(i, i + 6);
      const batchMatches = await Promise.all(
        chunk.map((item) => matchMovieWithTmdb(item.title, item.year))
      );

      batchMatches.forEach((m, idx) => {
        resolved.push({ entry: chunk[idx], movie: m });
        onProgress(resolved.length, total);
      });
    }

    return resolved;
  };

  // Run full import pipeline (Original Cineaste $Ne execution pipeline)
  const handleExecuteImport = async () => {
    if (!totalEntriesCount) return;

    setImportState("matching");
    setMatchProgress(0);
    setErrorMessage(null);

    // 1. Separate standard library entries (watched/ratings/watchlist) from custom list collections
    const standardMap = new Map<string, ParsedCsvEntry & { targetStatus: "want" | "watched" }>();
    const listFiles: ParsedFile[] = [];

    parsedFiles.forEach((file) => {
      if (file.type === "list") {
        listFiles.push(file);
        return;
      }

      file.entries.forEach((entry) => {
        const key = `${entry.title.toLowerCase()}|${entry.year || ""}`;
        if (!standardMap.has(key)) {
          standardMap.set(key, {
            ...entry,
            targetStatus: "want",
          });
        }
        const record = standardMap.get(key)!;
        if (file.type === "watched") {
          record.targetStatus = "watched";
          if (entry.watchedAt) record.watchedAt = entry.watchedAt;
        }
        if (file.type === "ratings") {
          if (entry.rating) record.rating = entry.rating;
          record.targetStatus = "watched";
        }
      });
    });

    const standardEntries = Array.from(standardMap.values());
    const listEntries: (ParsedCsvEntry & { listName: string })[] = listFiles.flatMap((f) =>
      f.entries.map((e) => ({ ...e, listName: f.name }))
    );

    const allToResolve: ParsedCsvEntry[] = [...standardEntries, ...listEntries];

    // 2. Query TMDB concurrently
    const resolvedResults = await batchResolveTmdb(allToResolve, (curr, tot) => {
      setMatchProgress(Math.round((curr / tot) * 100));
    });

    setImportState("saving");

    // 3. Compare with user's existing vault
    const existingMap = new Map<number, Movie>();
    existingMovies.forEach((m) => existingMap.set(m.tmdb_id || m.id, m));

    const moviesToCommit: Movie[] = [];
    const activitiesToCommit: TimelineActivity[] = [];

    let addedWatched = 0;
    let addedWant = 0;
    let updated = 0;
    let skipped = 0;
    let unmatched = 0;

    const standardResolved = resolvedResults.slice(0, standardEntries.length);
    const listResolved = resolvedResults.slice(standardEntries.length);

    standardResolved.forEach(({ entry, movie }) => {
      if (!movie) {
        unmatched++;
        return;
      }

      const movieId = movie.tmdb_id || movie.id;
      const existing = existingMap.get(movieId);
      const targetStatus = (entry as any).targetStatus || (entry.watchedAt ? "watched" : "want");

      if (existing) {
        let isChanged = false;
        const updates: Partial<Movie> = {};

        if (targetStatus === "watched" && existing.status !== "watched") {
          updates.status = "watched";
          updates.watched_date = entry.watchedAt || new Date().toISOString().split("T")[0];
          isChanged = true;
        }
        if (entry.rating && existing.rating !== entry.rating) {
          updates.rating = entry.rating;
          isChanged = true;
        }

        if (isChanged) {
          moviesToCommit.push({ ...existing, ...updates });
          updated++;
        } else {
          skipped++;
        }
      } else {
        const newMovie: Movie = {
          ...movie,
          status: targetStatus,
          rating: entry.rating ?? undefined,
          watched_date:
            targetStatus === "watched"
              ? entry.watchedAt || new Date().toISOString().split("T")[0]
              : undefined,
          created_date: new Date().toISOString(),
        };

        moviesToCommit.push(newMovie);
        if (targetStatus === "watched") {
          addedWatched++;
          activitiesToCommit.push({
            id: `act-imp-w-${movieId}-${Date.now()}`,
            type: "watched",
            tmdb_id: movieId,
            title: newMovie.title,
            poster_path: newMovie.poster_path,
            rating: newMovie.rating,
            occurred_at: newMovie.watched_date ? `${newMovie.watched_date}T12:00:00Z` : new Date().toISOString(),
          });
        } else {
          addedWant++;
          activitiesToCommit.push({
            id: `act-imp-a-${movieId}-${Date.now()}`,
            type: "added",
            tmdb_id: movieId,
            title: newMovie.title,
            poster_path: newMovie.poster_path,
            occurred_at: new Date().toISOString(),
          });
        }
      }
    });

    // 4. Create Curated Collections for list CSVs
    let collectionsCreated = 0;
    let collectionMoviesAdded = 0;

    for (const listFile of listFiles) {
      const itemsForThisList = listResolved
        .filter((r) => (r.entry as any).listName === listFile.name)
        .map((r) => r.movie)
        .filter((m): m is Movie => Boolean(m));

      if (itemsForThisList.length > 0 && onCreateCollection) {
        onCreateCollection(listFile.name, "#00D664", `Imported from Letterboxd list: ${listFile.name}`, itemsForThisList);
        collectionsCreated++;
        collectionMoviesAdded += itemsForThisList.length;
      }
    }

    // 5. Commit batch to library store
    if (moviesToCommit.length > 0) {
      onBatchImport(moviesToCommit, activitiesToCommit);
    }

    setSummary({
      addedWatched,
      addedWant,
      updated,
      skipped,
      collectionsCreated,
      collectionMoviesAdded,
      unmatched,
      totalParsed: totalEntriesCount,
    });

    setImportState("done");
  };

  // Download Sample CSV Helper
  const handleDownloadSample = () => {
    const sample = `Name,Year,Rating,Date\nInception,2010,4.5,2024-05-12\nInterstellar,2014,5,2024-06-18\nBlade Runner 2049,2017,4,2024-07-22\nDune: Part Two,2024,5,2024-08-10\nParasite,2019,4.5,2024-09-05`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "letterboxd_sample_watched.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Completed Summary View (Original Cineaste FNe view) */}
      {importState === "done" && summary ? (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-[#00D664]/40 bg-gradient-to-br from-[#141520] via-[#101118] to-[#0A0B0F] shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-[#00D664] text-black grid place-items-center font-black text-xl shadow-lg shadow-[#00D664]/30">
                <Check className="w-6 h-6 stroke-[3]" />
              </span>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Import Complete!
                </h3>
                <p className="text-xs text-[#9496A1]">
                  Your Letterboxd library has been successfully integrated into your Cineaste Film Vault.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition"
              >
                Import More
              </button>
              <Link
                href="/watchlist"
                className="px-5 py-2 rounded-xl bg-[#00D664] text-black font-extrabold text-xs hover:bg-[#00B855] transition shadow-lg shadow-[#00D664]/20 inline-flex items-center gap-1.5"
              >
                <span>Go to Watchlist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 7-Card Summary Metrics Matrix (Original Cineaste FNe breakdown) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118] shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9496A1]">New Watched Entries</p>
                <p className="text-xl font-heading font-black text-[#00D664]">
                  {summary.addedWatched}
                </p>
              </div>
              <Eye className="w-5 h-5 text-[#00D664]" />
            </div>

            <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118] shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9496A1]">New Watchlist Entries</p>
                <p className="text-xl font-heading font-black text-[#00D664]">
                  {summary.addedWant}
                </p>
              </div>
              <Bookmark className="w-5 h-5 text-[#00D664]" />
            </div>

            <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118] shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9496A1]">Existing Entries Updated</p>
                <p className="text-xl font-heading font-black text-indigo-400">
                  {summary.updated}
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118] shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9496A1]">Collections Created</p>
                <p className="text-xl font-heading font-black text-amber-400">
                  {summary.collectionsCreated}
                </p>
              </div>
              <FolderHeart className="w-5 h-5 text-amber-400" />
            </div>

            <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118] shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9496A1]">Films Added to Collections</p>
                <p className="text-xl font-heading font-black text-cyan-400">
                  {summary.collectionMoviesAdded}
                </p>
              </div>
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>

            <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118] shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9496A1]">Already in Your Vault</p>
                <p className="text-xl font-heading font-black text-[#9496A1]">
                  {summary.skipped}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#9496A1]" />
            </div>

            <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118] shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9496A1]">Unmatched on TMDB</p>
                <p className="text-xl font-heading font-black text-red-400">
                  {summary.unmatched}
                </p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>

            <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118] shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9496A1]">Total Records Parsed</p>
                <p className="text-xl font-heading font-black text-white">
                  {summary.totalParsed}
                </p>
              </div>
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      ) : (
        /* Active Import Workspace (Original Cineaste $Ne Dropzone & File List) */
        <div className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
            className="rounded-3xl border-2 border-dashed border-[#1E1F2A] hover:border-[#00D664]/50 bg-[#101118]/70 p-10 sm:p-14 text-center cursor-pointer hover:bg-[#00D664]/5 transition-all duration-300 space-y-4 shadow-xl select-none"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />

            <span className="w-16 h-16 rounded-3xl bg-[#00D664]/10 border border-[#00D664]/30 grid place-items-center text-[#00D664] mx-auto shadow-xl">
              <Upload className="w-7 h-7 stroke-[2.5]" />
            </span>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-heading text-base sm:text-lg font-bold text-white">
                Drop your Letterboxd CSVs here or click to browse
              </h3>
              <p className="text-xs text-[#9496A1] leading-relaxed">
                Supports <code>watched.csv</code>, <code>ratings.csv</code>, <code>watchlist.csv</code>, and custom list CSVs.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00D664] text-black font-extrabold text-xs shadow-lg shadow-[#00D664]/25">
                <span>Browse CSV Files</span>
              </span>
            </div>
          </div>

          {/* Staged Files List */}
          {parsedFiles.length > 0 && (
            <div className="p-5 rounded-2xl border border-[#1E1F2A] bg-[#101118] shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#00D664]" />
                  <span>
                    {totalEntriesCount} films across {parsedFiles.length} file{parsedFiles.length > 1 ? "s" : ""}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-[#9496A1] hover:text-white transition"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {parsedFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#1E1F2A] bg-[#141520]/60"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#00D664]/10 border border-[#00D664]/20 grid place-items-center text-[#00D664] shrink-0">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{f.name}.csv</p>
                      <p className="text-[10px] text-[#9496A1]">
                        {FILE_TYPE_LABELS[f.type]} • {f.entries.length} films
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resolution Progress / Action Button */}
              {importState === "matching" || importState === "saving" ? (
                <div className="p-4 rounded-xl border border-[#00D664]/30 bg-[#141520] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#00D664]" />
                      <span>
                        {importState === "matching"
                          ? `Matching films to TMDB… ${matchProgress}%`
                          : "Saving to your library & generating timeline…"}
                      </span>
                    </span>
                    <span className="font-mono text-[#00D664]">{matchProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#181922] overflow-hidden">
                    <div
                      className="h-full bg-[#00D664] transition-all duration-200"
                      style={{ width: importState === "saving" ? "100%" : `${matchProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="w-full h-11 rounded-xl bg-[#00D664] text-black font-extrabold text-xs inline-flex items-center justify-center gap-2 hover:bg-[#00B855] transition shadow-lg shadow-[#00D664]/20 select-none"
                >
                  <Upload className="w-4 h-4 stroke-[2.5]" />
                  <span>Import {totalEntriesCount} Films to Cineaste</span>
                </button>
              )}
            </div>
          )}

          {/* Original "How It Works" Box (Original Cineaste Guidance) */}
          <div className="rounded-2xl border border-[#1E1F2A] bg-[#101118]/60 p-5 text-xs text-[#9496A1] space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#00D664]" />
                <span>How Letterboxd Migration Works</span>
              </p>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-[11px] text-[#00D664] hover:underline font-semibold inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Download Sample CSV</span>
              </button>
            </div>
            <p className="leading-relaxed">
              Export your data from Letterboxd in <strong>Settings → &quot;Export your data&quot;</strong>. You will receive a ZIP file containing individual CSV files. Drop the relevant CSVs into the box above:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-xl bg-[#141520] border border-[#1E1F2A]/60">
                <span className="font-bold text-white">watched.csv</span> → marked as watched with original screening date
              </div>
              <div className="p-2.5 rounded-xl bg-[#141520] border border-[#1E1F2A]/60">
                <span className="font-bold text-white">watchlist.csv</span> → added to your Want to Watch list
              </div>
              <div className="p-2.5 rounded-xl bg-[#141520] border border-[#1E1F2A]/60">
                <span className="font-bold text-white">ratings.csv</span> → user star ratings applied to films
              </div>
              <div className="p-2.5 rounded-xl bg-[#141520] border border-[#1E1F2A]/60">
                <span className="font-bold text-white">list CSVs</span> → automatically created as private curated collections
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
