"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/database/queries/profiles";
import {
  COMMON_COUNTRIES,
  getBankAccountFields,
} from "../../earnings/bank-account-fields";
import { updatePayoutProfileAction } from "./actions";

interface PayoutProfileFormProps {
  initialData?: Profile | null;
}

export function PayoutProfileForm({ initialData }: PayoutProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialData?.full_name ?? "");
  const [countryCode, setCountryCode] = useState(
    initialData?.country_code ?? "",
  );
  const [city, setCity] = useState(initialData?.city ?? "");
  const [addressLine1, setAddressLine1] = useState(
    initialData?.address_line1 ?? "",
  );
  const [addressLine2, setAddressLine2] = useState(
    initialData?.address_line2 ?? "",
  );
  const [stateOrRegion, setStateOrRegion] = useState(
    initialData?.state_or_region ?? "",
  );
  const [postalCode, setPostalCode] = useState(initialData?.postal_code ?? "");
  const [payoutMethod, setPayoutMethod] = useState<
    "bank_transfer" | "paypal" | "other" | ""
  >((initialData?.payout_method as typeof payoutMethod) ?? "");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [payoutDetails2, setPayoutDetails2] = useState("");
  const [payoutDetails3, setPayoutDetails3] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const bankFields = countryCode ? getBankAccountFields(countryCode) : null;

  // Load existing payout details if available
  useEffect(() => {
    if (initialData?.payout_details_json) {
      const details = initialData.payout_details_json as Record<
        string,
        unknown
      >;
      if (initialData.payout_method === "paypal") {
        setPayoutDetails((details.email as string) ?? "");
      } else if (initialData.payout_method === "bank_transfer") {
        // Extract bank details based on what's stored
        if (details.iban) {
          setPayoutDetails(details.iban as string);
        } else {
          // Try to get first field value
          const firstKey = Object.keys(details)[0];
          if (firstKey && firstKey !== "country_code") {
            setPayoutDetails(details[firstKey] as string);
          }
        }
        // Try to get second field
        const keys = Object.keys(details).filter((k) => k !== "country_code");
        if (keys.length > 1) {
          setPayoutDetails2(details[keys[1]] as string);
        }
        if (keys.length > 2) {
          setPayoutDetails3(details[keys[2]] as string);
        }
      } else {
        setPayoutDetails((details.other as string) ?? "");
      }
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!countryCode) {
      setError("Country is required");
      return;
    }
    if (!city.trim()) {
      setError("City is required");
      return;
    }
    if (!addressLine1.trim()) {
      setError("Address line 1 is required");
      return;
    }
    if (!postalCode.trim()) {
      setError("Postal code is required");
      return;
    }
    if (!payoutMethod) {
      setError("Payout method is required");
      return;
    }

    // Validate payout details based on method
    let payoutDetailsJson: Record<string, unknown> = {};
    if (payoutMethod === "paypal") {
      if (!payoutDetails.trim() || !payoutDetails.includes("@")) {
        setError("Valid PayPal email is required");
        return;
      }
      payoutDetailsJson = { email: payoutDetails.trim() };
    } else if (payoutMethod === "bank_transfer") {
      if (!payoutDetails.trim()) {
        setError(`${bankFields?.label1 || "Bank account details"} is required`);
        return;
      }
      if (bankFields?.label2 && !payoutDetails2.trim()) {
        setError(`${bankFields.label2} is required`);
        return;
      }
      if (bankFields?.label3 && !payoutDetails3.trim()) {
        setError(`${bankFields.label3} is required`);
        return;
      }

      // Store bank details - format depends on country
      if (bankFields?.label1 === "IBAN") {
        payoutDetailsJson = {
          iban: payoutDetails.trim().replace(/\s/g, "").toUpperCase(),
        };
      } else {
        // Store country-specific fields
        const field1Key = bankFields.label1.toLowerCase().replace(/\s/g, "_");
        payoutDetailsJson[field1Key] = payoutDetails.trim();
        if (bankFields.label2 && payoutDetails2.trim()) {
          const field2Key = bankFields.label2.toLowerCase().replace(/\s/g, "_");
          payoutDetailsJson[field2Key] = payoutDetails2.trim();
        }
        if (bankFields.label3 && payoutDetails3.trim()) {
          const field3Key = bankFields.label3.toLowerCase().replace(/\s/g, "_");
          payoutDetailsJson[field3Key] = payoutDetails3.trim();
        }
        // Store country for reference
        payoutDetailsJson.country_code = countryCode;
      }
    } else {
      if (!payoutDetails.trim()) {
        setError("Account details are required");
        return;
      }
      payoutDetailsJson = { other: payoutDetails.trim() };
    }

    startTransition(async () => {
      try {
        await updatePayoutProfileAction({
          full_name: fullName.trim(),
          country_code: countryCode,
          city: city.trim(),
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || null,
          state_or_region: stateOrRegion.trim() || null,
          postal_code: postalCode.trim(),
          payout_method: payoutMethod as "bank_transfer" | "paypal" | "other",
          payout_details_json: payoutDetailsJson,
          is_payout_profile_complete: true,
        });
        router.push("/dashboard/photographer/profile");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save profile");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Personal Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Legal Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your legal name as it appears on official documents
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Address</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="countryCode">Country *</Label>
            <Select
              value={countryCode}
              onValueChange={setCountryCode}
              disabled={isPending}
              required
            >
              <SelectTrigger id="countryCode">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Postal code"
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1 *</Label>
            <Input
              id="addressLine1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Street address"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apartment, suite, etc. (optional)"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stateOrRegion">State / Region</Label>
            <Input
              id="stateOrRegion"
              value={stateOrRegion}
              onChange={(e) => setStateOrRegion(e.target.value)}
              placeholder="State or region (optional)"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Required for some countries (e.g., US states)
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Payout Method</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payoutMethod">Preferred Payout Method *</Label>
            <Select
              value={payoutMethod}
              onValueChange={(value) => {
                setPayoutMethod(value as typeof payoutMethod);
                setPayoutDetails("");
                setPayoutDetails2("");
                setPayoutDetails3("");
              }}
              disabled={isPending}
              required
            >
              <SelectTrigger id="payoutMethod">
                <SelectValue placeholder="Select payout method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {payoutMethod && (
            <div className="space-y-2">
              <Label htmlFor="payoutDetails">
                {payoutMethod === "paypal"
                  ? "PayPal Email *"
                  : payoutMethod === "bank_transfer" && bankFields
                    ? `${bankFields.label1} *`
                    : "Account Details *"}
              </Label>
              <Input
                id="payoutDetails"
                type={payoutMethod === "paypal" ? "email" : "text"}
                value={payoutDetails}
                onChange={(e) => {
                  if (payoutMethod === "bank_transfer" && bankFields?.format1) {
                    const formatted = bankFields.format1(e.target.value);
                    setPayoutDetails(formatted);
                  } else {
                    setPayoutDetails(e.target.value);
                  }
                }}
                placeholder={
                  payoutMethod === "paypal"
                    ? "your@email.com"
                    : payoutMethod === "bank_transfer" && bankFields
                      ? bankFields.placeholder1
                      : "Account details"
                }
                disabled={isPending}
                required
              />
              {payoutMethod === "bank_transfer" && bankFields?.label2 && (
                <div className="mt-2 space-y-2">
                  <Label htmlFor="payoutDetails2">{bankFields.label2} *</Label>
                  <Input
                    id="payoutDetails2"
                    type="text"
                    value={payoutDetails2}
                    onChange={(e) => {
                      const formatted = bankFields.format2
                        ? bankFields.format2(e.target.value)
                        : e.target.value;
                      setPayoutDetails2(formatted);
                    }}
                    placeholder={bankFields.placeholder2 || ""}
                    disabled={isPending}
                    required
                  />
                </div>
              )}
              {payoutMethod === "bank_transfer" && bankFields?.label3 && (
                <div className="mt-2 space-y-2">
                  <Label htmlFor="payoutDetails3">{bankFields.label3} *</Label>
                  <Input
                    id="payoutDetails3"
                    type="text"
                    value={payoutDetails3}
                    onChange={(e) => {
                      const formatted = bankFields.format3
                        ? bankFields.format3(e.target.value)
                        : e.target.value;
                      setPayoutDetails3(formatted);
                    }}
                    placeholder={bankFields.placeholder3 || ""}
                    disabled={isPending}
                    required
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {payoutMethod === "paypal"
                  ? "We'll send payments to this PayPal email"
                  : payoutMethod === "bank_transfer"
                    ? "Your bank account details for receiving payments"
                    : "Provide details for your preferred payout method"}
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Complete Profile"}
        </Button>
      </div>
    </form>
  );
}
