import type { Metadata } from 'next';
import { Geist_Mono, Inter, Inter_Tight } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { Toaster } from 'sonner';
import { GuestCartProvider } from '@/components/guest-cart-provider';
import Header from '@/components/header';
import { Main } from '@/components/main';

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

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const hideHeader = pathname.startsWith('/auth/reset-password');

  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} ${interTight.variable}`}>
      <body className="antialiased">
        <GuestCartProvider>
          {!hideHeader && <Header />}
          <Main>{children}</Main>
          <Toaster />
        </GuestCartProvider>
      </body>
    </html>
  );
}
