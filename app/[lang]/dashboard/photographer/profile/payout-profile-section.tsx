'use client';

import { AlertCircle, CheckCircle2, CreditCard, MapPin, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Profile } from '@/database/queries/profiles';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import { useTranslations } from '@/lib/i18n/translations-provider';

type PhotographerDashboardT = Dictionary['photographerDashboard'];

interface PayoutProfileSectionProps {
  profile: Profile | null;
}

export function PayoutProfileSection({ profile }: PayoutProfileSectionProps) {
  const { t } = useTranslations<PhotographerDashboardT>();

  const isComplete = profile?.is_payout_profile_complete ?? false;
  const payoutMethod = profile?.payout_method;
  const payoutDetails = profile?.payout_details_json as Record<string, unknown> | null | undefined;

  const getPayoutMethodLabel = (method: string | null | undefined) => {
    switch (method) {
      case 'bank_transfer':
        return t('payoutBankTransfer');
      case 'paypal':
        return t('payoutPayPal');
      case 'other':
        return t('payoutOther');
      default:
        return t('payoutNotSet');
    }
  };

  const getPayoutDetailsDisplay = () => {
    if (!payoutDetails) return t('payoutNotConfigured');

    if (payoutMethod === 'paypal') {
      return (payoutDetails.email as string) || t('payoutNotConfigured');
    }
    if (payoutMethod === 'bank_transfer') {
      if (payoutDetails.iban) {
        const iban = payoutDetails.iban as string;
        return `IBAN: ${iban.substring(0, 4)}****${iban.substring(iban.length - 4)}`;
      }
      return t('payoutBankAccountConfigured');
    }
    return t('payoutConfigured');
  };

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm lg:h-full lg:flex lg:flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">{t('payoutProfileTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('payoutProfileDesc')}</p>
        </div>
        <Link href="/dashboard/photographer/profile/payout-profile">
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            {isComplete ? t('payoutProfileEdit') : t('payoutProfileCompleteButton')}
          </Button>
        </Link>
      </div>

      <div className="lg:flex-1 lg:flex lg:flex-col">
        {!isComplete ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t('payoutProfileIncompleteTitle')}
                </p>
                <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                  {t('payoutProfileIncompleteDesc')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {t('payoutProfileCompleteStatus')}
              </span>
            </div>

            {/* Personal Information */}
            {profile?.full_name && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{t('payoutLegalName')}</p>
                  <p className="text-sm font-medium">{profile.full_name}</p>
                </div>
              </div>
            )}

            {/* Address */}
            {(profile?.address_line1 || profile?.city || profile?.country_code) && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{t('payoutAddress')}</p>
                  <p className="text-sm font-medium">
                    {[
                      profile.address_line1,
                      profile.address_line2,
                      profile.city,
                      profile.state_or_region,
                      profile.postal_code,
                      profile.country_code,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Payout Method */}
            {payoutMethod && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{t('payoutMethod')}</p>
                  <p className="text-sm font-medium">{getPayoutMethodLabel(payoutMethod)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {getPayoutDetailsDisplay()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
