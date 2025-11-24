import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { Main } from "@/components/main";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OceaPic - Find Yourself in Every Moment",
  description:
    "Connect photographers with athletes and event-goers. Upload event photos and let AI help users find themselves instantly. Search, purchase, and download high-resolution photos.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const hideHeader = pathname.startsWith("/auth/reset-password");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {!hideHeader && <Header />}
        <Main>{children}</Main>
        <Toaster />
      </body>
    </html>
  );
}
