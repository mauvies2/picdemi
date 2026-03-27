import { Calendar, Package, ShoppingCart } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getTalentOrderStats, getTalentOrders } from './actions';
import { OrdersList } from './orders-list';

function formatCurrency(cents: number, currency = 'usd'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

export default async function TalentOrdersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const [orders, stats] = await Promise.all([getTalentOrders(), getTalentOrderStats()]);

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <DashboardHeader title={dict.talentDashboard.orders} />

      {/* Statistics Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.talentDashboard.totalOrders}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedOrders} {dict.talentDashboard.completedOrders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.talentDashboard.photosPurchased}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchasedPhotos}</div>
            <p className="text-xs text-muted-foreground">{dict.talentDashboard.acrossAllOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.talentDashboard.totalSpent}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpentCents)}</div>
            <p className="text-xs text-muted-foreground">{dict.talentDashboard.lifetimeTotal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <OrdersList orders={orders} t={dict.ordersList} />
    </div>
  );
}
