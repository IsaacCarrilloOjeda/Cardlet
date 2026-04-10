import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { CreditsProvider } from "@/components/layout/CreditsContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CircleProgress } from "@/components/layout/CircleProgress";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cardlet",
  description: "Study smarter with AI-powered flashcards",
  appleWebApp: {
    capable: true,
    title: "Cardlet",
    statusBarStyle: "black-translucent",
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
          </CreditsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
