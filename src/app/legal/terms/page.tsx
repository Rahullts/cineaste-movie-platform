import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";

export default function TermsOfServicePage() {
  return (
    <LegalDocumentLayout
      title="Terms of Service"
      subtitle="General usage guidelines for the Cineaste personal cinema discovery and tracking web application."
      sections={[
        {
          heading: "1. Service Scope",
          body: [
            "Cineaste provides a personal movie tracking interface for discovering films, maintaining watchlists, recording watch history, and organizing collections.",
          ],
        },
        {
          heading: "2. User-Generated Content",
          body: [
            "Personal notes, reviews, ratings, and custom collection names you create remain your own content. You are responsible for ensuring any public profile information you enter does not infringe third-party rights.",
          ],
        },
        {
          heading: "3. Catalog Availability",
          body: [
            "Film metadata, artwork, and streaming provider listings depend on upstream third-party APIs (including TMDB) and may change or become unavailable without prior notice.",
          ],
        },
        {
          heading: "4. Draft Status",
          body: [
            "Formal governing law, SLA terms, and subscription billing terms will be published here once approved by the project owner.",
          ],
        },
      ]}
    />
  );
}
