import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country");
  const acceptLanguage = headersList.get("accept-language");

  const isIndonesian =
    country === "ID" || acceptLanguage?.toLowerCase().includes("id");

  if (isIndonesian) {
    return {
      title: "Good Reels — TikTok Edukatif",
      description: "Jelajahi artikel Wikipedia dalam format Reels yang menyenangkan.",
      icons: {
        icon: "/icon.png",
      },
    };
  }

  return {
    title: "Good Reels — Educational TikTok Experience",
    description: "Explore Wikipedia articles in a fun, Reels-style layout.",
    icons: {
      icon: "/icon.png",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country");
  const acceptLanguage = headersList.get("accept-language");
  const isIndonesian =
    country === "ID" || acceptLanguage?.toLowerCase().includes("id");
  const lang = isIndonesian ? "id" : "en";

  return (
    <html lang={lang}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
