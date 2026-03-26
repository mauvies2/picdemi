import { Toaster } from 'sonner';
import { ConditionalHeader } from '@/components/conditional-header';
import { GuestCartProvider } from '@/components/guest-cart-provider';
import Header from '@/components/header';
import { Main } from '@/components/main';
import { QueryProvider } from '@/components/query-provider';
import { type Locale, locales } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

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
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <QueryProvider>
      <GuestCartProvider>
        <ConditionalHeader>
          <Header navDict={{ login: dict.nav.login, getStarted: dict.nav.getStarted }} />
        </ConditionalHeader>
        <Main>{children}</Main>
        <Toaster />
      </GuestCartProvider>
    </QueryProvider>
  );
}
