import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { getCartItemCountAction } from "@/app/dashboard/talent/cart/actions";
import { DashboardUserMenu } from "@/components/dashboard-user-menu";
import { Button } from "@/components/ui/button";
import type { RoleSlug } from "@/lib/roles";
import { cn } from "@/lib/utils";

export async function DashboardTopHeader({
  user,
  activeRole,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  activeRole: RoleSlug;
}) {
  // Only show cart for talent users
  const cartItemCount =
    activeRole === "talent" ? await getCartItemCountAction() : 0;

  return (
    <div className="pointer-events-none absolute top-3 right-4 z-40 hidden md:flex md:items-center md:gap-3">
      {activeRole === "talent" && (
        <Link href="/dashboard/talent/cart" className="pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 rounded-lg hover:bg-accent p-0"
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
      )}
      <div className="pointer-events-auto">
        <DashboardUserMenu user={user} activeRole={activeRole} />
      </div>
    </div>
  );
}
