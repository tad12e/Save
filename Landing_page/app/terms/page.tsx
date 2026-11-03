import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Use | Yazem & Clipper - Microsoft Edge Add-ons Compliant",
  description:
    "Terms of Use and Service Agreement for Yazem Technologies and Clipper Browser Extension. Fully compliant with Microsoft Partner Center and Edge Add-ons Developer Agreement.",
};

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-surface selection:bg-secondary-fixed selection:text-secondary">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Microsoft Partner Center Compliant Terms
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-geist text-zinc-900 tracking-tight">
            Terms of Use & Developer Agreement
          </h1>
          <p className="mt-3 text-sm text-zinc-500 font-inter">
            Effective Date: November 3, 2026 • Governing all Web, Mobile, and Browser Extension surfaces
          </p>
        </div>

        <div className="prose prose-zinc max-w-none text-zinc-700 font-inter space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">1. Acceptance of Terms</h2>
            <p>
              By accessing Yazem (app.save.io, yazem.tech) or installing our Clipper extension for Microsoft Edge, Google Chrome, or other supported browsers, you agree to be bound by these Terms of Use and our Privacy Statement. If you do not agree, do not use the service or extension.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">2. Description of Service & Clipper Extension</h2>
            <p>
              Yazem provides an AI-augmented knowledge management platform allowing users to capture, index, synthesize, and query bookmarks, media, research papers, e-commerce listings, and personal notes. The Clipper extension acts as a client utility to capture page content upon user command.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">3. Acceptable Use & Intellectual Property</h2>
            <p>
              You retain ownership of the content and notes you store in Yazem. You agree not to use the service to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Infringe on third-party intellectual property or copyright laws.</li>
              <li>Attempt to reverse-engineer, decompile, or compromise backend services.</li>
              <li>Automate excessive scraping that violates targeted platforms&apos; terms of service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">4. Third-Party Platforms & Trademarks</h2>
            <p>
              Microsoft, Microsoft Edge, Windows, and the Microsoft logo are registered trademarks of Microsoft Corporation. Google, Chrome, and Android are trademarks of Google LLC. Apple, Safari, and iOS are trademarks of Apple Inc. Notion, Airtable, and Slack are trademarks of their respective owners. Yazem Technologies is an independent software vendor and developer partner.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">5. Limitation of Liability & Warranties</h2>
            <p>
              The service is provided &quot;as is&quot; without warranties of any kind. Yazem Technologies Inc. shall not be liable for indirect, incidental, or consequential damages resulting from service downtime, data synchronization delays, or third-party API changes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">6. Support & Contact Information</h2>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-geist">
              <p className="font-semibold text-zinc-900">Yazem Technologies Inc. - Legal & Partner Relations</p>
              <p className="text-zinc-600">Support Desk: <a href="mailto:support@yazem.tech" className="text-blue-600 hover:underline">support@yazem.tech</a></p>
              <p className="text-zinc-600">Enterprise Inquiries: <a href="mailto:partners@yazem.tech" className="text-blue-600 hover:underline">partners@yazem.tech</a></p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
