import type { Metadata } from "next";
import type React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Belajar Bahasa Arab Interaktif AI",
  description: "Aplikasi belajar bahasa Arab interaktif dengan percakapan AI dan audio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      className={`${geistSans.variable} ${geistMono.variable} h-full max-h-screen overflow-hidden antialiased`}
    >
      <body className="h-full max-h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}

