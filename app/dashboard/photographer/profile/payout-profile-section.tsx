"use client";

import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  MapPin,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/database/queries/profiles";

interface PayoutProfileSectionProps {
  profile: Profile | null;
}

export function PayoutProfileSection({ profile }: PayoutProfileSectionProps) {
  const isComplete = profile?.is_payout_profile_complete ?? false;
  const payoutMethod = profile?.payout_method;
  const payoutDetails = profile?.payout_details_json as
    | Record<string, unknown>
    | null
    | undefined;

  const getPayoutMethodLabel = (method: string | null | undefined) => {
    switch (method) {
      case "bank_transfer":
        return "Bank Transfer";
      case "paypal":
        return "PayPal";
      case "other":
        return "Other";
      default:
        return "Not set";
    }
  };

  const getPayoutDetailsDisplay = () => {
    if (!payoutDetails) return "Not configured";

    if (payoutMethod === "paypal") {
      return (payoutDetails.email as string) || "Not configured";
    } else if (payoutMethod === "bank_transfer") {
      if (payoutDetails.iban) {
        const iban = payoutDetails.iban as string;
        return `IBAN: ${iban.substring(0, 4)}****${iban.substring(iban.length - 4)}`;
      }
      return "Bank account configured";
    }
    return "Configured";
  };

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm lg:h-full lg:flex lg:flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Payout Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your payout information for receiving payments
          </p>
        </div>
        <Link href="/dashboard/photographer/profile/payout-profile">
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            {isComplete ? "Edit" : "Complete"}
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
                  Payout profile incomplete
                </p>
                <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                  Complete your payout profile to enable withdrawal requests.
                  This includes your address and payment method.
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
                Profile Complete
              </span>
            </div>

            {/* Personal Information */}
            {profile?.full_name && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Legal Name</p>
                  <p className="text-sm font-medium">{profile.full_name}</p>
                </div>
              </div>
            )}

            {/* Address */}
            {(profile?.address_line1 ||
              profile?.city ||
              profile?.country_code) && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Address</p>
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
                      .join(", ")}
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
                  <p className="text-xs text-muted-foreground">Payout Method</p>
                  <p className="text-sm font-medium">
                    {getPayoutMethodLabel(payoutMethod)}
                  </p>
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
