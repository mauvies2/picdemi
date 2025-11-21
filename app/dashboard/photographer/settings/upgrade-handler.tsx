"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBillingCheckoutAction } from "../billing/actions";
import { toast } from "sonner";

/**
 * Client component to handle upgrade query parameter
 * Automatically triggers upgrade when ?upgrade=plan is in URL
 */
export function UpgradeHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgradePlan = searchParams.get("upgrade");

  useEffect(() => {
    if (upgradePlan && (upgradePlan === "amateur" || upgradePlan === "pro")) {
      const handleUpgrade = async () => {
        try {
          const result = await createBillingCheckoutAction(
            upgradePlan as "amateur" | "pro",
          );

          // Remove query parameter from URL
          router.replace("/dashboard/photographer/settings", { scroll: false });

          if ("url" in result) {
            // Redirect to Stripe Checkout
            window.location.href = result.url;
          } else if (result.updated) {
            // Subscription was updated directly
            toast.success("Subscription updated successfully");
            router.refresh();
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to start checkout";
          toast.error(message);
          // Remove query parameter even on error
          router.replace("/dashboard/photographer/settings", { scroll: false });
        }
      };

      handleUpgrade();
    }
  }, [upgradePlan, router]);

  return null;
}

