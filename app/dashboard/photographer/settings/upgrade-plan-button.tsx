"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createBillingCheckoutAction } from "../billing/actions";

interface UpgradePlanButtonProps {
  planId: "amateur" | "pro";
  variant?: "default" | "outline";
  size?: "sm" | "lg";
  className?: string;
}

export function UpgradePlanButton({
  planId,
  variant = "default",
  size = "sm",
  className,
}: UpgradePlanButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleUpgrade = () => {
    startTransition(async () => {
      try {
        const result = await createBillingCheckoutAction(planId);

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
      }
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUpgrade}
      disabled={isPending}
      className={className}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          {planId === "pro" ? "Upgrade to Pro" : "Upgrade to Amateur"}
        </>
      )}
    </Button>
  );
}
