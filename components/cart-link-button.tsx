"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { getCartItemCountAction } from "@/app/dashboard/talent/cart/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartLinkButton() {
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const fetchCartCount = useCallback(() => {
    startTransition(async () => {
      try {
        const count = await getCartItemCountAction();
        setCartItemCount(count);
      } catch {
        setCartItemCount(0);
      }
    });
  }, []);

  useEffect(() => {
    fetchCartCount();
  }, [pathname, fetchCartCount]);

  // Refresh cart count when window regains focus (e.g., after returning from cart page)
  useEffect(() => {
    const handleFocus = () => {
      fetchCartCount();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchCartCount]);

  return (
    <Link href="/dashboard/talent/cart">
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0"
        aria-label="Shopping cart"
      >
        <ShoppingCart className="h-5 w-5" />
        {cartItemCount > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold",
              "bg-primary text-primary-foreground",
            )}
          >
            {cartItemCount > 99 ? "99+" : cartItemCount}
          </span>
        )}
      </Button>
    </Link>
  );
}

