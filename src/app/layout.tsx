import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "IGAC HR Portal", template: "%s · IGAC HR" },
  description: "Internal Human Resource Management System for the International Global Affairs Council.",
  robots: { index: false, follow: false }, // Internal — no indexing
  icons: {
    icon: "/IGAC Logo OG NOBG.svg",
    shortcut: "/IGAC Logo OG NOBG.svg",
    apple: "/IGAC Logo OG NOBG.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
