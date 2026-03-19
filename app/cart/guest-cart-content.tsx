"use client";

import { format } from "date-fns";
import {
  Calendar,
  Image as ImageIcon,
  Loader2,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createGuestCheckoutSessionAction } from "@/app/cart/actions";
import { useGuestCart } from "@/components/guest-cart-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function GuestCartContent() {
  const { items, removeItem, clearCart, subtotalCents } = useGuestCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";
  const [isPending, startTransition] = useTransition();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    startTransition(async () => {
      try {
        const { url } = await createGuestCheckoutSessionAction(items);
        window.location.href = url;
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Checkout failed. Please try again.",
        );
        setIsCheckingOut(false);
      }
    });
  };

  const formatPrice = (cents: number) =>
    cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="relative mb-6">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
            <X className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold mb-2">Your cart is empty</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Browse events to find and add your photos.
        </p>
        <Button onClick={() => router.push("/events")}>Browse Events</Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Sign-in nudge */}
      <div className="mb-4 flex text-sm items-center gap-3 rounded-xl  border bg-primary/5 px-4 py-3">
        <div className="flex-1 flex items-center gap-2">
          <UserPlus className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Have an account? </p>
            <p className="text-muted-foreground">
              Sign in to save your photos to your library after purchase.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign up free</Button>
          </Link>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear cart
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear cart?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove all items from your cart?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={clearCart}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {canceled && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Checkout was canceled. Your cart has been saved.
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 pb-20 md:pb-0">
        {/* Left — cart items */}
        <div className="flex-2 min-w-0 space-y-3">
          {items.map((item) => (
            <div
              key={item.photoId}
              className="group flex gap-4 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.previewUrl ? (
                  <Image
                    src={item.previewUrl}
                    alt={item.eventName ?? "Photo"}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="128px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 min-w-0">
                <div className="space-y-1">
                  {item.eventName && (
                    <h4 className="font-semibold text-base text-foreground line-clamp-1">
                      {item.eventName}
                    </h4>
                  )}
                  {item.eventDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(item.eventDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-4">
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(item.unitPriceCents)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.photoId)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right — summary sticky (desktop) */}
        <div className="hidden md:block flex-1 min-w-0">
          <div className="sticky top-4 self-start rounded-lg border border-border bg-card p-6 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Subtotal
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(subtotalCents)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your email will be collected during checkout to send your
                download link.
              </p>
              <div className="pt-4 border-t border-border">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isPending || isCheckingOut}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Checkout"
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  You can continue shopping and add more items
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Subtotal
            </span>
            <span className="text-lg font-bold text-foreground">
              {formatPrice(subtotalCents)}
            </span>
          </div>
          <Button
            className="w-full"
            size="sm"
            onClick={handleCheckout}
            disabled={isPending || isCheckingOut}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed to Checkout"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
