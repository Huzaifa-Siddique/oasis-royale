import type { Metadata } from "next";
import { Inter, Lexend_Tera } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Header from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lexendTera = Lexend_Tera({
  variable: "--font-lexend-tera",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oasis Royale",
  description: "Cinematic Desert Noir Dining Experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lexendTera.variable} h-full antialiased`}
    >
      <body className="flex flex-col min-h-screen font-sans">
        <Header />
        <main className="flex-1 pt-16">
          <SmoothScroll>{children}</SmoothScroll>
        </main>
        <Footer />
      </body>
    </html>
  );
}
