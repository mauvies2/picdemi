'use client';

import { DollarSign, Image, ShoppingCart, TrendingUp } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Sale, SalesByDate, SalesSummary, TopSellingEvent } from '@/database/queries/sales';
import { cn } from '@/lib/utils';
import { getSalesDataAction } from './actions';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  className?: string;
}

function SummaryCard({ title, value, icon, trend, className }: SummaryCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className="rounded-full bg-primary/10 p-3">{icon}</div>
      </div>
    </div>
  );
}

interface SalesChartProps {
  data: SalesByDate[];
}

function SalesChart({ data }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">No sales data available</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue_cents), 1);
  // Limit to last 30 data points for better visualization
  const displayData = data.slice(-30);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Sales Over Time</h3>
      <div className="flex h-64 items-end justify-between gap-1 overflow-x-auto pb-2">
        {displayData.map((item) => {
          const height = (item.revenue_cents / maxRevenue) * 100;
          return (
            <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary transition-all hover:bg-primary/80"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${formatDate(item.date)}: ${formatPrice(item.revenue_cents)} (${item.sales_count} sale${item.sales_count !== 1 ? 's' : ''})`}
              />
              <span className="text-xs text-muted-foreground">
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          );
        })}
      </div>
      {data.length > 30 && (
        <p className="mt-2 text-xs text-muted-foreground">Showing last 30 days of data</p>
      )}
    </div>
  );
}

interface TopEventsProps {
  events: TopSellingEvent[];
}

function TopEvents({ events }: TopEventsProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Top Selling Events</h3>
        <p className="text-sm text-muted-foreground">No sales yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Top Selling Events</h3>
      <div className="space-y-3">
        {events.map((event, index) => (
          <div
            key={event.event_id}
            className="flex items-center gap-4 rounded-lg border border-border bg-background p-3"
          >
            <div className="flex size-10 items-center justify-center rounded bg-muted text-sm font-semibold">
              #{index + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{event.event_name || 'Untitled Event'}</p>
              <p className="text-xs text-muted-foreground">
                {event.photos_sold} photo{event.photos_sold !== 1 ? 's' : ''} • {event.sales_count}{' '}
                sale{event.sales_count !== 1 ? 's' : ''} • {formatPrice(event.revenue_cents)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RecentSalesProps {
  sales: Sale[];
}

function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Recent Sales</h3>
        <p className="text-sm text-muted-foreground">No sales yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Recent Sales</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                Event
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                Buyer
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b border-border">
                <td className="px-4 py-3 text-sm">{formatDateTime(sale.created_at)}</td>
                <td className="px-4 py-3 text-sm">{sale.event_name || 'Untitled Event'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {sale.buyer_email || (
                    <span className="italic">Customer {sale.buyer_id.slice(0, 8)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium">
                  {formatPrice(sale.unit_price_cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SalesContent() {
  const [timeRange, setTimeRange] = useState<string>('30');
  const [salesData, setSalesData] = useState<{
    summary: SalesSummary;
    salesOverTime: SalesByDate[];
    topEvents: TopSellingEvent[];
    recentSales: Sale[];
  } | null>(null);
  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    const endDate = new Date();
    let startDate: Date | undefined;

    if (timeRange === 'all') {
      startDate = undefined;
    } else {
      const days = Number.parseInt(timeRange, 10);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    startTransition(async () => {
      try {
        const data = await getSalesDataAction(startDate?.toISOString(), endDate.toISOString());
        setSalesData(data);
      } catch (error) {
        console.error('Failed to load sales data:', error);
      }
    });
  }, [timeRange]);

  return (
    <div className="space-y-4">
      {/* Header with time range filter */}
      <div className="flex items-end justify-between">
        <h2 className="text-xl font-semibold">Overview</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {isLoading && !salesData ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['revenue', 'sales', 'average', 'photos'].map((id) => (
              <Skeleton key={id} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </>
      ) : salesData ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Revenue"
              value={formatPrice(salesData.summary.totalRevenueCents)}
              icon={<DollarSign className="size-6 text-primary" />}
            />
            <SummaryCard
              title="Total Sales"
              value={salesData.summary.totalSales.toString()}
              icon={<ShoppingCart className="size-6 text-primary" />}
            />
            <SummaryCard
              title="Average Order Value"
              value={formatPrice(salesData.summary.averageOrderValueCents)}
              icon={<TrendingUp className="size-6 text-primary" />}
            />
            <SummaryCard
              title="Photos Sold"
              value={salesData.summary.totalPhotosSold.toString()}
              icon={<Image className="size-6 text-primary" />}
            />
          </div>

          {/* Charts and Recent Sales */}
          {salesData.summary.totalSales > 0 ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <SalesChart data={salesData.salesOverTime} />
                <RecentSales sales={salesData.recentSales} />
              </div>

              {/* Top Selling Events */}
              <TopEvents events={salesData.topEvents} />
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
              <ShoppingCart className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No sales yet</h3>
              <p className="text-sm text-muted-foreground">
                Start selling photos to see your sales data here.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
