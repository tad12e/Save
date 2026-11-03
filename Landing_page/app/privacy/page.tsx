import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | Save & Clipper - Microsoft Edge Add-ons Compliant",
  description:
    "Privacy Policy for Save Technologies and Clipper Browser Extension. Fully compliant with Microsoft Edge Add-ons Partner Center, Google Chrome Web Store, and GDPR/CCPA standards.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-surface selection:bg-secondary-fixed selection:text-secondary">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Microsoft Edge Add-ons Partner Verified Policy
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-geist text-zinc-900 tracking-tight">
            Privacy Statement & Cookie Notice
          </h1>
          <p className="mt-3 text-sm text-zinc-500 font-inter">
            Effective Date: November 3, 2026 • Last updated for Microsoft Partner Center & Edge Add-ons MV3
          </p>
        </div>

        <div className="prose prose-zinc max-w-none text-zinc-700 font-inter space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">1. Overview & Commitment</h2>
            <p>
              Save Technologies Inc. (&quot;Save&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Statement explains how our web vault, mobile applications, and Clipper browser extensions (including our Microsoft Edge Add-on and Chrome Extension) collect, use, and safeguard your information.
            </p>
            <p>
              We do not sell personal data to third parties. We do not use user web browsing history for advertising, profile monetization, or data brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">2. Extension Permissions & Data Collection</h2>
            <p>
              The Clipper browser extension operates strictly upon user initiation or on designated social media / content domains you choose to clip from:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <strong>activeTab & Scripting:</strong> Accessed only when you click the Clipper extension, use the <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs">Alt+S</code> shortcut, or interact with per-post micro-save buttons on supported feeds (YouTube, X, LinkedIn, Reddit, TikTok) to extract page metadata (title, URL, thumbnail, price, authors, publication date).
              </li>
              <li>
                <strong>Storage:</strong> Used locally in your browser to store your session token, preference toggles, and offline queue.
              </li>
              <li>
                <strong>Context Menus:</strong> Enables quick right-click clipping of highlighted text, images, or hyperlinks directly into your Save knowledge vault.
              </li>
              <li>
                <strong>Identity:</strong> Used exclusively for secure OAuth sign-in (Google / Email).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">3. AI Processing & Knowledge Extraction</h2>
            <p>
              When a clip is saved, our polymorphic extraction engine parses structured metadata (such as product pricing, book authors, arXiv abstract summaries, or job application deadlines). Extracted data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.
            </p>
            <p>
              User content is never used to train public foundation models without explicit organizational consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">4. Your Privacy Choices & Data Rights</h2>
            <p>
              In accordance with GDPR, CCPA/CPRA, and Microsoft Partner developer privacy standards, you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Export your entire library of clips and metadata in JSON, CSV, or Markdown format anytime.</li>
              <li>Request immediate, permanent deletion of your account and all associated knowledge vaults.</li>
              <li>Opt out of any non-essential analytics or telemetry.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold font-geist text-zinc-900">5. Contact & Data Protection Officer</h2>
            <p>
              For privacy inquiries, GDPR/CCPA data requests, or Microsoft Partner Center inquiries, contact our Data Protection Officer at:
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-geist">
              <p className="font-semibold text-zinc-900">Save Technologies Inc. - Privacy & Compliance</p>
              <p className="text-zinc-600">Email: <a href="mailto:privacy@yazem.tech" className="text-blue-600 hover:underline">privacy@yazem.tech</a></p>
              <p className="text-zinc-600">Support: <a href="mailto:support@yazem.tech" className="text-blue-600 hover:underline">support@yazem.tech</a></p>
              <p className="text-zinc-500 text-xs mt-1">Microsoft Edge Add-ons Developer Partner ID: Yazem Technologies</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}