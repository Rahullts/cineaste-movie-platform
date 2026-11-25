import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";

export default function LicensingPage() {
  return (
    <LegalDocumentLayout
      title="Licensing & Attribution"
      subtitle="Metadata, imagery, and external data source notices for Cineaste."
      sections={[
        {
          heading: "1. TMDB Attribution",
          body: [
            "This product uses the TMDB API for film metadata, posters, backdrops, cast credits, and recommendations, and is not endorsed or certified by TMDB.",
          ],
        },
        {
          heading: "2. Ratings & External Scores",
          body: [
            "User personal ratings belong strictly to the user. Any displayed TMDB community scores or external ratings are sourced only when available and labeled according to their respective data source.",
          ],
        },
        {
          heading: "3. Artwork & Trailers",
          body: [
            "All film posters, still images, and trailer media remain the copyright of their respective studios, distributors, and rights holders.",
          ],
        },
      ]}
    />
  );
}
