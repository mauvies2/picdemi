"use server";

import { getBaseUrl } from "@/lib/get-base-url";

/**
 * Create checkout session for subscription upgrade/change
 */
export async function createBillingCheckoutAction(
  planId: "amateur" | "pro",
): Promise<{ url: string } | { updated: boolean }> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/billing/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ planId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Checkout failed" }));
    throw new Error(error.error || "Failed to create checkout session");
  }

  return response.json();
}

/**
 * Cancel subscription
 */
export async function cancelSubscriptionAction(): Promise<void> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/billing/cancel`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Cancellation failed" }));
    throw new Error(error.error || "Failed to cancel subscription");
  }
}

