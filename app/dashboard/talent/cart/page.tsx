import { redirect } from "next/navigation";
import { getActiveRole } from "@/app/actions/roles";
import { DashboardHeader } from "@/components/dashboard-header";
import { createClient } from "@/database/server";
import { getCurrentCart } from "./actions";
import { CartContent } from "./cart-content";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Ensure user is in talent role
  const { activeRole } = await getActiveRole();
  if (activeRole !== "talent") {
    return redirect("/dashboard");
  }

  const cartData = await getCurrentCart();

  return (
    <div className="space-y-6">
      <div>
        <DashboardHeader title="Shopping Cart" />
        <p className="text-sm text-muted-foreground mt-1">
          Review your selected photos before checkout.
        </p>
      </div>
      <CartContent initialCartData={cartData} />
    </div>
  );
}
