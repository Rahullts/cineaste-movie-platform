"use client";

import * as React from "react";
import { MovieDetailView } from "@/components/movie/movie-detail-view";
import { useLibrary } from "@/lib/library-store";

interface MovieDetailClientProps {
  id: string;
}

export default function MovieDetailClient({ id }: MovieDetailClientProps) {
  const library = useLibrary();
  const parsedId = Number(id);

  // Live reactive lookup from shared LibraryContext
  const libraryMovie = React.useMemo(() => {
    if (!library.movies || library.movies.length === 0) return null;
    return (
      library.movies.find(
        (m) =>
          m.tmdb_id === parsedId ||
          m.id === parsedId ||
          String(m.id) === id
      ) || null
    );
  }, [library.movies, parsedId, id]);

  const [tmdbDetails, setTmdbDetails] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const libraryMovieRef = React.useRef(libraryMovie);
  libraryMovieRef.current = libraryMovie;

  React.useEffect(() => {
    let isCancelled = false;

    async function loadMovieDetails() {
      setIsLoading(true);
      try {
        const currentLib = libraryMovieRef.current;
        const targetId = isNaN(parsedId)
          ? currentLib?.tmdb_id || 157336
          : parsedId;
        const res = await fetch("/api/tmdb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "details", id: targetId }),
        });

        if (res.ok) {
          const details = await res.json();
          if (!isCancelled && details && details.title) {
            setTmdbDetails(details);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load TMDB details:", err);
      }

      if (!isCancelled) {
        setIsLoading(false);
      }
    }

    loadMovieDetails();

    return () => {
      isCancelled = true;
    };
  }, [parsedId, id]);

  // Dynamically merge TMDB catalog metadata with reactive library state
  const mergedMovie = React.useMemo(() => {
    if (tmdbDetails) {
      return {
        ...tmdbDetails,
        id: libraryMovie?.id || tmdbDetails.tmdb_id || parsedId,
        tmdb_id: tmdbDetails.tmdb_id || parsedId,
        release_status: tmdbDetails.status || "Released",
        status: tmdbDetails.status || "Released",
        user_status: libraryMovie?.status,
        rating: libraryMovie?.rating ?? tmdbDetails.rating,
        review: libraryMovie?.review ?? tmdbDetails.review,
        is_favorite: libraryMovie?.is_favorite ?? false,
      };
    }
    return libraryMovie;
  }, [tmdbDetails, libraryMovie, parsedId]);

  return (
    <MovieDetailView
      movie={mergedMovie}
      isLoading={isLoading && !mergedMovie}
    />
  );
}
