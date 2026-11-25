import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";

export default function OpenSourcePage() {
  return (
    <LegalDocumentLayout
      title="Open Source Notices"
      subtitle="Core open-source frameworks and libraries powering the Cineaste web application."
      sections={[
        {
          heading: "1. Framework & Runtime",
          body: [
            "Cineaste is built with Next.js (App Router), React, TypeScript, and Tailwind CSS.",
          ],
        },
        {
          heading: "2. Icons & Backend Client Libraries",
          body: [
            "User interface iconography is powered by Lucide Icons. Authentication and relational persistence use the official Supabase JavaScript client libraries.",
          ],
        },
        {
          heading: "3. License Availability",
          body: [
            "Each third-party package remains subject to its respective upstream open-source license (such as MIT or Apache-2.0) as declared in the project package manifest.",
          ],
        },
      ]}
    />
  );
}
