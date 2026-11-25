import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";

export default function CookiePolicyPage() {
  return (
    <LegalDocumentLayout
      title="Cookies & Local Storage"
      subtitle="Summary of browser cookies and localStorage keys used for authentication sessions, theme selection, and offline persistence."
      sections={[
        {
          heading: "1. Essential Session Storage",
          body: [
            "When you sign in via Supabase Auth, session cookies and browser storage tokens (sb-*-auth-token) are stored solely to maintain your authenticated session across page reloads.",
          ],
        },
        {
          heading: "2. Application Preferences & Guest Vault",
          body: [
            "Cineaste uses browser localStorage keys such as cineaste:theme to remember your Dark, Light, or System theme preference, and versioned cineaste:library:* keys to store guest or offline-cached library records.",
          ],
        },
        {
          heading: "3. Managing Browser Data",
          body: [
            "You can inspect, export, or clear local application data directly from Settings or through your browser's site data controls at any time.",
          ],
        },
      ]}
    />
  );
}
