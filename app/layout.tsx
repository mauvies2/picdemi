import type { Metadata } from 'next';
import { Geist_Mono, Inter, Inter_Tight } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ConditionalHeader } from '@/components/conditional-header';
import { GuestCartProvider } from '@/components/guest-cart-provider';
import Header from '@/components/header';
import { Main } from '@/components/main';
import { QueryProvider } from '@/components/query-provider';

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
