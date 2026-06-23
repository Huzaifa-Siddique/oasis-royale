import type { Metadata, Viewport } from "next";
import { Inter, Lexend_Tera } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Header from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import BottomNavBar from "@/components/layout/BottomNavBar";
import Providers from "@/app/providers";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <Providers>
          <Header />
          <main className="flex-1">
            <SmoothScroll>{children}</SmoothScroll>
          </main>
          <Footer />
          <BottomNavBar />
        </Providers>
      </body>
    </html>
  );
}
