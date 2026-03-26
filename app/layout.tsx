import type { Metadata } from 'next';
import { Geist_Mono, Inter, Inter_Tight } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Picdemi - Find Yourself in Every Moment',
  description:
    'Connect photographers with athletes and event-goers. Upload event photos and let AI help users find themselves instantly. Search, purchase, and download high-resolution photos.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = (await headers()).get('x-lang') ?? 'es';

  return (
    <html lang={lang} className={`${inter.variable} ${geistMono.variable} ${interTight.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
