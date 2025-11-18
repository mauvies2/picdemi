"use client";

import { format } from "date-fns";
import {
  Calendar,
  Image as ImageIcon,
  Loader2,
  ShoppingCart,
  Trash2,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import {
  type CartData,
  clearCartAction,
  getCurrentCart,
  removePhotoFromCartAction,
} from "./actions";

interface CartContentProps {
  initialCartData: CartData;
}

export function CartContent({ initialCartData }: CartContentProps) {
  const [cartData, setCartData] = useState(initialCartData);
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();

  const handleRemove = (photoId: string) => {
    setRemovingId(photoId);
    startTransition(async () => {
      try {
        await removePhotoFromCartAction(photoId);
        const updated = await getCurrentCart();
        setCartData(updated);
        toast.success("Removed from cart");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to remove item";
        toast.error(message);
      } finally {
        setRemovingId(null);
      }
    });
  };

  const handleClearCart = () => {
    startTransition(async () => {
      try {
        await clearCartAction();
        const updated = await getCurrentCart();
        setCartData(updated);
        toast.success("Cart cleared");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to clear cart";
        toast.error(message);
      }
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (cartData.items.length === 0) {
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
          Start adding photos to your cart from events you've attended or
          discovered.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/dashboard/talent/events")}
            variant="default"
          >
            Browse Events
          </Button>
          <Button
            onClick={() => router.push("/dashboard/talent/photos")}
            variant="outline"
          >
            View My Photos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header with clear cart - spans full width */}
      <div className="flex items-center justify-between mb-2 md:mb-0">
        <p className="text-sm text-muted-foreground mt-1">
          {cartData.itemCount} {cartData.itemCount === 1 ? "item" : "items"}
        </p>
        {cartData.items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear cart
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear cart?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove all items from your cart? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearCart}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear cart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 pb-20 md:pb-0">
        {/* Left side - Cart items (2/3 width on desktop, full width on mobile) */}
        <div className="flex-2 min-w-0">
          {/* Cart items */}
          <div className="space-y-3">
            {cartData.items.map((item) => (
              <div
                key={item.photoId}
                className="group flex gap-4 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-md"
              >
                {/* Photo thumbnail */}
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.previewUrl ? (
                    <Image
                      src={item.previewUrl}
                      alt={item.eventTitle || "Photo"}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Item details */}
                <div className="flex flex-1 flex-col gap-3 min-w-0">
                  <div className="space-y-1">
                    {item.eventTitle && (
                      <h4 className="font-semibold text-base text-foreground line-clamp-1">
                        {item.eventTitle}
                      </h4>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {item.photographerName && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">
                            {item.photographerName}
                          </span>
                        </div>
                      )}
                      {item.eventDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {format(new Date(item.eventDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {formatPrice(item.unitPriceCents)}
                      </span>
                      {item.unitPriceCents === 0 && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          Free
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.photoId)}
                      disabled={isPending && removingId === item.photoId}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      {isPending && removingId === item.photoId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Remove</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Summary (1/3 width, sticky) - Desktop only */}
        <div className="hidden md:block flex-1 min-w-0">
          <div className="sticky top-4 self-start rounded-lg border border-border bg-card p-6 shadow-lg">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(cartData.subtotalCents)}
                  </span>
                </div>
                {cartData.subtotalCents === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    All items in your cart are free
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    toast.info("Checkout coming soon!");
                  }}
                  disabled={cartData.items.length === 0}
                >
                  Proceed to Checkout
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  You can continue shopping and add more items
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Summary - Sticky at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Subtotal
            </span>
            <span className="text-lg font-bold text-foreground">
              {formatPrice(cartData.subtotalCents)}
            </span>
          </div>
          <Button
            className="w-full"
            size="sm"
            onClick={() => {
              toast.info("Checkout coming soon!");
            }}
            disabled={cartData.items.length === 0}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
