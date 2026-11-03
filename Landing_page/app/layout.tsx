import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Yazem — AI Action-Oriented Knowledge Vault",
  description:
    "Organize content by WHY you saved it (Action Intent), not just what format it is. Seamless bi-directional sync to Google Sheets, Notion, and Airtable with native clip fidelity.",
  openGraph: {
    title: "Yazem — Action-Oriented Knowledge Vault",
    description: "Capture with purpose. Act with precision.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased selection:bg-secondary-fixed selection:text-secondary min-h-screen flex flex-col justify-between overflow-x-hidden">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
