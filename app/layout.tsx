import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { CreditsProvider } from "@/components/layout/CreditsContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CircleProgress } from "@/components/layout/CircleProgress";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { BootSplash } from "@/components/layout/BootSplash";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cardlet.app"),
  title: {
    default: "Cardlet — AI-Powered Flashcard Study App",
    template: "%s | Cardlet",
  },
  description:
    "Create flashcards in seconds with AI. Study smarter with spaced repetition, practice tests, written quizzes, and an AI tutor. Free forever.",
  keywords: [
    "flashcards",
    "study app",
    "spaced repetition",
    "AI flashcards",
    "quizlet alternative",
    "study tools",
    "free flashcard maker",
    "practice tests",
    "AI tutor",
  ],
  authors: [{ name: "Isaac Carrillo Ojeda", url: "https://cardlet.app" }],
  creator: "Isaac Carrillo Ojeda",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cardlet.app",
    siteName: "Cardlet",
    title: "Cardlet — AI-Powered Flashcard Study App",
    description:
      "Create flashcards in seconds with AI. Study smarter with spaced repetition, practice tests, written quizzes, and an AI tutor. Free forever.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cardlet — AI-Powered Flashcard Study App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardlet — AI-Powered Flashcard Study App",
    description:
      "Create flashcards in seconds with AI. Study smarter with spaced repetition and an AI tutor. Free forever.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "Cardlet",
    statusBarStyle: "black-translucent",
  },
  verification: {
    google: "iVoSm7Wy-Ipf-cWhaflGengYmhOgH1Jwf4IGFE59HIs",
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <CreditsProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CircleProgress />
            <ServiceWorkerRegister />
            <BootSplash />
          </CreditsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
