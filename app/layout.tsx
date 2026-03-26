import type { Metadata } from 'next';
import { Geist_Mono, Inter, Inter_Tight } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ConditionalHeader } from '@/components/conditional-header';
import { GuestCartProvider } from '@/components/guest-cart-provider';
import Header from '@/components/header';
import { Main } from '@/components/main';
import { QueryProvider } from '@/components/query-provider';
import { getSiteUrl } from '@/lib/get-site-url';

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
  // Absolute base for all relative OG/canonical URLs resolved by Next.js
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Picdemi — Find Yourself in Every Photo',
    template: '%s | Picdemi',
  },
  description:
    'Browse sports event photos from marathons, cycling races, triathlons, and more. Find yourself in high-resolution photos shot by professional event photographers.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    siteName: 'Picdemi',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  // Prevent indexing of dashboard/auth pages at the root level fallback;
  // individual pages override this where needed.
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} ${interTight.variable}`}>
      <body className="antialiased">
        <QueryProvider>
          <GuestCartProvider>
            <ConditionalHeader>
              <Header />
            </ConditionalHeader>
            <Main>{children}</Main>
            <Toaster />
          </GuestCartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
