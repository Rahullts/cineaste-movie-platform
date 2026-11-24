"use client";

import * as React from "react";
import { MovieDetailView } from "@/components/movie/movie-detail-view";
import { useLibrary } from "@/lib/library-store";
import type { Movie } from "@/types";

interface MovieDetailClientProps {
  id: string;
}

export default function MovieDetailClient({ id }: MovieDetailClientProps) {
  const library = useLibrary();
  const parsedId = Number(id);

  // Check if film exists in user's library initially
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

  const [movieData, setMovieData] = React.useState<any | null>(libraryMovie);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const libraryMovieRef = React.useRef(libraryMovie);
  libraryMovieRef.current = libraryMovie;

  React.useEffect(() => {
    let isCancelled = false;

    async function loadMovieDetails() {
      setIsLoading(true);
      try {
        const currentLib = libraryMovieRef.current;
        const targetId = isNaN(parsedId) ? currentLib?.tmdb_id || 157336 : parsedId;
        const res = await fetch("/api/tmdb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "details", id: targetId }),
        });

        if (res.ok) {
          const tmdbDetails = await res.json();
          if (!isCancelled && tmdbDetails && tmdbDetails.title) {
            // Merge TMDB rich metadata with user library state
            setMovieData({
              ...tmdbDetails,
              id: currentLib?.id || tmdbDetails.tmdb_id || targetId,
              tmdb_id: tmdbDetails.tmdb_id || targetId,
              rating: currentLib?.rating ?? tmdbDetails.rating,
              review: currentLib?.review ?? tmdbDetails.review,
              status: currentLib?.status || "want",
              is_favorite: currentLib?.is_favorite ?? false,
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load TMDB details:", err);
      }

      // Fallback to library movie if network fails
      if (!isCancelled) {
        if (libraryMovieRef.current) {
          setMovieData(libraryMovieRef.current);
        }
        setIsLoading(false);
      }
    }

    loadMovieDetails();

    return () => {
      isCancelled = true;
    };
  }, [parsedId, id]);

  return (
    <MovieDetailView
      movie={movieData}
      isLoading={isLoading && !movieData}
    />
  );
}
