import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      subtitle="Overview of how Cineaste handles guest browser storage, optional account authentication, and external film metadata requests."
      sections={[
        {
          heading: "1. Guest Mode Storage",
          body: [
            "When you browse Cineaste without signing in, any movies added to your Watchlist, marked as Watched, favorited, or organized into collections are stored locally in your web browser using localStorage.",
            "Guest library data stays on your device unless you explicitly choose to create an account or sign in, at which point genuine local items can be synchronized to your personal cloud account.",
          ],
        },
        {
          heading: "2. Authenticated Accounts",
          body: [
            "If you choose to register or sign in using email/password or OAuth (such as GitHub), authentication and user-scoped library persistence are handled through the project's Supabase backend.",
            "Stored account data includes your authentication identifier, profile fields you edit (display name, handle, bio), your saved library records, collections, ratings, and preferences.",
          ],
        },
        {
          heading: "3. Third-Party Film Metadata",
          body: [
            "Film posters, backdrops, credits, trailers, and catalog metadata are retrieved on demand from The Movie Database (TMDB) API and proxied cleanly by the Cineaste server.",
          ],
        },
        {
          heading: "4. Policy Updates",
          body: [
            "This draft document describes the current technical behavior of the Cineaste application and will be updated with finalized controller contact details and statutory disclosures prior to commercial launch.",
          ],
        },
      ]}
    />
  );
}
