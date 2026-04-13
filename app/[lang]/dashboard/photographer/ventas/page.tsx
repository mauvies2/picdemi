import { DashboardHeader } from '@/components/dashboard-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { TranslationsProvider } from '@/lib/i18n/translations-provider';
import { EarningsContent } from '../earnings/earnings-content';
import { SalesContent } from '../sales/sales-content';

export default async function VentasPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <DashboardHeader title={dict.dashboard.sales} />
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="sales">{dict.photographerDashboard.salesTitle}</TabsTrigger>
          <TabsTrigger value="earnings">{dict.photographerDashboard.earningsTitle}</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <TranslationsProvider translations={dict.photographerDashboard}>
            <SalesContent lang={lang} />
          </TranslationsProvider>
        </TabsContent>

        <TabsContent value="earnings">
          <TranslationsProvider translations={dict.earnings}>
            <EarningsContent />
          </TranslationsProvider>
        </TabsContent>
      </Tabs>
    </div>
  );
}
