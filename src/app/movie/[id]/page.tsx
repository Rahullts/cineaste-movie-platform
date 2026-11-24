import { AppShell } from "@/components/layout/app-shell";
import MovieDetailClient from "./movie-detail-client";

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <MovieDetailClient id={id} />
    </AppShell>
  );
}
