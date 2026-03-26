import { Toaster } from 'sonner';
import { ConditionalHeader } from '@/components/conditional-header';
import { GuestCartProvider } from '@/components/guest-cart-provider';
import Header from '@/components/header';
import { Main } from '@/components/main';
import { QueryProvider } from '@/components/query-provider';
import { locales } from '@/lib/i18n/config';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  // Consume params to satisfy Next.js dynamic segment requirements
  await params;

  return (
    <QueryProvider>
      <GuestCartProvider>
        <ConditionalHeader>
          <Header />
        </ConditionalHeader>
        <Main>{children}</Main>
        <Toaster />
      </GuestCartProvider>
    </QueryProvider>
  );
}
