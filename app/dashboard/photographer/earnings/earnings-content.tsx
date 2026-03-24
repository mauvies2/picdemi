'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Wallet, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { PhotographerEarning } from '@/database/queries/earnings';
import type { Payout } from '@/database/queries/payouts';
import { cn } from '@/lib/utils';
import { getPayoutProfileStatusAction } from '../profile/payout-profile/actions';
import {
  createPayoutRequestAction,
  getEarningsSummaryAction,
  getPayoutsAction,
  getPhotographerEarningsAction,
} from './actions';
import { getPaymentAccountsAction } from './payment-accounts-actions';
import { PaymentAccountsSection } from './payment-accounts-section';
import { PayoutProfileBanner } from './payout-profile-banner';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
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
  description?: string;
  className?: string;
}

function SummaryCard({ title, value, icon, description, className }: SummaryCardProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 sm:p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">{value}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="ml-2 shrink-0 rounded-full bg-primary/10 p-2 sm:p-3">{icon}</div>
      </div>
    </div>
  );
}

interface PayoutRequestDialogProps {
  availableBalance: number;
  onSuccess: () => void;
  isPayoutProfileComplete: boolean;
}

function PayoutRequestDialog({
  availableBalance,
  onSuccess,
  isPayoutProfileComplete,
}: PayoutRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: paymentAccounts = [] } = useQuery({
    queryKey: ['payment-accounts'] as const,
    queryFn: () => getPaymentAccountsAction(),
    enabled: open,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (paymentAccounts.length > 0 && !paymentAccountId) {
      const defaultAccount = paymentAccounts.find((a) => a.is_default);
      setPaymentAccountId(defaultAccount?.id ?? paymentAccounts[0].id);
    }
  }, [paymentAccounts, paymentAccountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!paymentAccountId) {
      setError('Please select a payment account');
      return;
    }

    const amountCents = Math.round(Number.parseFloat(amount) * 100);

    if (!amount || Number.isNaN(amountCents) || amountCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountCents > availableBalance) {
      setError(`Amount exceeds available balance of ${formatPrice(availableBalance)}`);
      return;
    }

    startTransition(async () => {
      try {
        await createPayoutRequestAction(amountCents, paymentAccountId);
        setOpen(false);
        setAmount('');
        setPaymentAccountId('');
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create payout request');
      }
    });
  };

  const maxAmount = (availableBalance / 100).toFixed(2);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setPaymentAccountId('');
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" disabled={!isPayoutProfileComplete}>
          Request Payout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            {!isPayoutProfileComplete ? (
              'Please complete your payout profile first to request withdrawals.'
            ) : (
              <>
                Enter the amount you want to withdraw. Available balance:{' '}
                <span className="font-semibold">{formatPrice(availableBalance)}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {!isPayoutProfileComplete ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Payout profile incomplete</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Complete your payout profile to enable withdrawal requests.
                </p>
                <Link href="/dashboard/photographer/profile/payout-profile">
                  <Button variant="outline" size="sm">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            ) : paymentAccounts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No payment accounts found</p>
                <p className="text-xs text-muted-foreground">
                  Please add a payment account before requesting a payout.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="paymentAccount">Payment Account *</Label>
                  <Select
                    value={paymentAccountId}
                    onValueChange={setPaymentAccountId}
                    disabled={isPending}
                  >
                    <SelectTrigger id="paymentAccount">
                      <SelectValue placeholder="Select payment account" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.display_name}
                          {account.is_default && ' (Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxAmount}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError(null);
                    }}
                    placeholder={`Max: ${maxAmount}`}
                    disabled={isPending}
                  />
                </div>
              </>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || paymentAccounts.length === 0}>
              {isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PayoutHistoryProps {
  payouts: Payout[];
}

function PayoutHistory({ payouts }: PayoutHistoryProps) {
  if (payouts.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Payout History</h3>
        <p className="text-sm text-muted-foreground">No payout requests yet</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 dark:text-green-400';
      case 'approved':
        return 'text-blue-600 dark:text-blue-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'cancelled':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Payout History</h3>
      <div className="space-y-3">
        {payouts.map((payout) => (
          <div
            key={payout.id}
            className="flex items-center justify-between rounded-lg border bg-background p-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{formatPrice(payout.amount_cents)}</p>
                <span className={cn('text-xs font-medium', getStatusColor(payout.status))}>
                  {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Requested: {formatDateTime(payout.created_at)}
              </p>
              {payout.paid_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Paid: {formatDateTime(payout.paid_at)}
                </p>
              )}
              {payout.admin_notes && (
                <p className="mt-1 text-xs text-muted-foreground">Note: {payout.admin_notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface EarningsTableProps {
  earnings: PhotographerEarning[];
}

function EarningsTable({ earnings }: EarningsTableProps) {
  if (earnings.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Recent Earnings</h3>
        <p className="text-sm text-muted-foreground">No earnings yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Recent Earnings</h3>
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
                Gross
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                Fee
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                Net
              </th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((earning) => (
              <tr key={earning.id} className="border-b border-border">
                <td className="px-4 py-3 text-sm">{formatDate(earning.created_at)}</td>
                <td className="px-4 py-3 text-sm">{earning.event_name || 'Untitled Event'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {earning.buyer_email || (
                    <span className="italic">Customer {earning.buyer_id.slice(0, 8)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {formatPrice(earning.gross_amount_cents)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                  -{formatPrice(earning.platform_fee_cents)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium">
                  {formatPrice(earning.net_amount_cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EarningsContent() {
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ['earnings'] as const,
    queryFn: async () => {
      const [summaryData, earningsData, payoutsData, profileStatus] = await Promise.all([
        getEarningsSummaryAction(),
        getPhotographerEarningsAction(20),
        getPayoutsAction(),
        getPayoutProfileStatusAction(),
      ]);
      return {
        summary: summaryData,
        earnings: earningsData,
        payouts: payoutsData,
        isPayoutProfileComplete: profileStatus.isComplete,
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  const summary = data?.summary ?? null;
  const earnings = data?.earnings ?? [];
  const payouts = data?.payouts ?? [];
  const isPayoutProfileComplete = data?.isPayoutProfileComplete ?? true;
  const isLoading = isFetching && !data;

  return (
    <div className="space-y-6">
      {/* Payout Profile Banner */}
      {!isPayoutProfileComplete && <PayoutProfileBanner isComplete={isPayoutProfileComplete} />}

      {/* Summary Cards */}
      {isLoading && !summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Earnings"
              value={formatPrice(summary.totalGrossEarningsCents)}
              icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
              description="All-time gross revenue"
            />
            <SummaryCard
              title="Platform Fees"
              value={formatPrice(summary.platformFeeCents)}
              icon={<XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
              description="10% platform fee"
            />
            <SummaryCard
              title="Net Earnings"
              value={formatPrice(summary.totalNetEarningsCents)}
              icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
              description="After platform fees"
            />
            <SummaryCard
              title="Available Balance"
              value={formatPrice(summary.withdrawableBalanceCents)}
              icon={<Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
              description="Ready to withdraw"
            />
          </div>

          {/* Payment Accounts */}
          <PaymentAccountsSection />

          {/* Payout Request & History */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Request Payout</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Withdraw your available balance. Payouts are processed manually by our team.
              </p>
              <PayoutRequestDialog
                availableBalance={summary.withdrawableBalanceCents}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['earnings'] })}
                isPayoutProfileComplete={isPayoutProfileComplete}
              />
            </div>
            <PayoutHistory payouts={payouts} />
          </div>

          {/* Earnings Table */}
          <EarningsTable earnings={earnings} />
        </>
      ) : null}
    </div>
  );
}
