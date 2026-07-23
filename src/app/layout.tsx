import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ds1-realm.dev"),
  title: {
    default: "DS1 - The Developer's Realm",
    template: "%s | DS1",
  },
  description: "Portfolio profesional de Gaspar Doval: Full Stack Developer, Game Developer y Creative Technologist.",
  applicationName: "DS1 - The Developer's Realm",
  keywords: [
    "Gaspar Doval",
    "DS1",
    "Full Stack Developer",
    "Game Developer",
    "Creative Technologist",
    "Next.js portfolio",
  ],
  openGraph: {
    title: "DS1 - The Developer's Realm",
    description: "Building digital worlds, interactive experiences and intelligent systems.",
    type: "website",
    url: "https://ds1-realm.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "DS1 - The Developer's Realm",
    description: "Building digital worlds, interactive experiences and intelligent systems.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)]">
        <SiteHeader />
        <main className="flex min-h-screen flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
