import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";

export default function DataPolicyPage() {
  return (
    <LegalDocumentLayout
      title="Data Policy"
      subtitle="How Cineaste stores, isolates, exports, and deletes personal cinema vault records."
      sections={[
        {
          heading: "1. Account & Guest Isolation",
          body: [
            "Local guest data and authenticated user accounts are isolated per user scope. Signing out separates the active account session from local guest storage so authenticated film libraries are not exposed to subsequent guest sessions.",
          ],
        },
        {
          heading: "2. Import & Export Controls",
          body: [
            "Your library tools allow importing supported watch history formats and managing saved entries directly inside My Library and Settings.",
          ],
        },
        {
          heading: "3. Data Deletion",
          body: [
            "You can reset your local or account library data or initiate account deletion from the Security & Danger Zone sections in Settings.",
          ],
        },
      ]}
    />
  );
}
