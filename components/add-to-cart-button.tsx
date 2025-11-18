"use client";

import { Check, Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addPhotoToCartAction } from "@/app/dashboard/talent/cart/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  photoId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg" | "icon";
  showText?: boolean;
  initialInCart?: boolean;
  asDiv?: boolean; // When true, renders as div instead of button (for nested button scenarios)
}

export function AddToCartButton({
  photoId,
  className,
  variant = "default",
  size = "sm",
  showText = true,
  initialInCart = false,
  asDiv = false,
}: AddToCartButtonProps) {
  const [isInCart, setIsInCart] = useState(initialInCart);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    startTransition(async () => {
      try {
        await addPhotoToCartAction(photoId);
        setIsInCart(true);
        toast.success("Added to cart");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to add to cart";
        toast.error(message);
      }
    });
  };

  const baseClasses = cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "h-8 px-3 text-xs",
    size === "md" && "h-9 px-4",
    size === "lg" && "h-10 px-8",
    variant === "default" &&
      "bg-primary text-primary-foreground hover:bg-primary/90",
    variant === "outline" &&
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
    variant === "secondary" &&
      "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    className,
  );

  if (asDiv) {
    if (isInCart) {
      return (
        <div className={cn(baseClasses, "cursor-default")}>
          <Check className="h-4 w-4" />
          {showText && <span className="ml-2">In cart</span>}
        </div>
      );
    }

    return (
      // biome-ignore lint/a11y/useSemanticElements: Intentionally using div to avoid nested buttons
      <div
        className={cn(baseClasses, "cursor-pointer")}
        onClick={handleAddToCart}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleAddToCart();
          }
        }}
        aria-label="Add to cart"
        role="button"
        tabIndex={0}
        aria-disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {showText && <span className="ml-2">Adding...</span>}
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            {showText && <span className="ml-2">Add to cart</span>}
          </>
        )}
      </div>
    );
  }

  if (isInCart) {
    return (
      <Button
        variant={
          variant === "default" || variant === "secondary" ? "outline" : variant
        }
        size={size === "icon" ? "sm" : size}
        disabled
        className={className}
      >
        <Check className="h-4 w-4" />
        {showText && <span className="ml-2">In cart</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant === "secondary" ? "outline" : variant}
      size={size === "icon" ? "sm" : size}
      onClick={handleAddToCart}
      disabled={isPending}
      className={className}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && <span className="ml-2">Adding...</span>}
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          {showText && <span className="ml-2">Add to cart</span>}
        </>
      )}
    </Button>
  );
}
