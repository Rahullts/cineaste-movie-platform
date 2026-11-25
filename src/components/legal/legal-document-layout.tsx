"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalDocumentLayoutProps {
  title: string;
  subtitle: string;
  sections: LegalSection[];
}

export function LegalDocumentLayout({
  title,
  subtitle,
  sections,
}: LegalDocumentLayoutProps) {
  return (
    <AppShell>
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[11px] font-semibold mb-4">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Draft Placeholder Policy — Pending Formal Legal Review</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="space-y-6 rounded-2xl bg-card/70 border border-border/60 p-6 sm:p-8 shadow-lg">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-2.5">
              <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">
                {section.heading}
              </h2>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                {section.body.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/80 leading-relaxed">
          Notice: This document is a draft informational placeholder for the Cineaste web application and does not constitute legal advice or a binding formal policy until reviewed and approved by the application maintainer.
        </p>
      </div>
    </AppShell>
  );
}
