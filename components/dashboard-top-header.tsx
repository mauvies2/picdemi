import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { getActiveRole } from "@/app/actions/roles";
import { getCartItemCountAction } from "@/app/dashboard/talent/cart/actions";
import { DashboardUserMenu } from "@/components/dashboard-user-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function DashboardTopHeader({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}) {
  const { activeRole } = await getActiveRole();

  // Only show cart for talent users
  const cartItemCount =
    activeRole === "talent" ? await getCartItemCountAction() : 0;

  return (
    <div className="pointer-events-none absolute top-3 right-4 z-40 hidden md:flex md:items-center md:gap-4">
      {activeRole === "talent" && (
        <Link href="/dashboard/talent/cart" className="pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            className="relative h-11 w-11 p-2 hover:bg-foreground/10 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-background backdrop-blur-lg"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <span
                className={cn(
                  "absolute -right-1 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold",
                  "bg-primary text-primary-foreground",
                )}
              >
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </Button>
        </Link>
      )}
      <div className="pointer-events-auto">
        <DashboardUserMenu user={user} />
      </div>
    </div>
  );
}
