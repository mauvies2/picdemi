import { Suspense } from "react";
import { GuestCartContent } from "./guest-cart-content";

export default function GuestCartPage() {
  return (
    <div className="mx-auto max-w-7xl py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Shopping Cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your selected photos before checkout.
        </p>
      </div>
      <Suspense>
        <GuestCartContent />
      </Suspense>
    </div>
  );
}
