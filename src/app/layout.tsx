import type { Metadata } from "next";
import { Fraunces, Frank_Ruhl_Libre, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-hebrew",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://torok.vercel.app"),
  title: "Torok — The Torah Wisdom Bot",
  description:
    "Explore Torah wisdom for everyday moments through carefully sourced teachings and practical reflection.",
  applicationName: "Torok",
  openGraph: {
    title: "Torok — The Torah Wisdom Bot",
    description:
      "Explore Torah wisdom for everyday moments through carefully sourced teachings and practical reflection.",
    type: "website",
    siteName: "Torok",
  },
  twitter: {
    card: "summary_large_image",
    title: "Torok — The Torah Wisdom Bot",
    description:
      "Explore Torah wisdom for everyday moments through carefully sourced teachings and practical reflection.",
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
      className={`${fraunces.variable} ${sourceSans.variable} ${frankRuhl.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
