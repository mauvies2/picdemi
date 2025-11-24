import { format } from "date-fns";
import {
  Camera,
  Image as ImageIcon,
  Package,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { cn } from "@/lib/utils";
import { getTalentDashboardData } from "./actions";
import { EmptyState } from "./empty-state";
import { QuickActions } from "./quick-actions";
import { ViewAllLink } from "./view-all-link";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function TalentDashboardPage() {
  const data = await getTalentDashboardData();
  const { stats, recentTaggedPhotos, recentOrders } = data;

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <DashboardHeader title="Overview" />

      <div className="flex flex-1 flex-col gap-4">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Photos Tagged
                </p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                  {stats.taggedPhotosCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.taggedPhotosCount === 1 ? "photo" : "photos"} found
                </p>
              </div>
              <div className="ml-2 shrink-0 rounded-full bg-primary/10 p-2 sm:p-3">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Photos Purchased
                </p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                  {stats.purchasedPhotosCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.purchasedPhotosCount === 1 ? "photo" : "photos"} owned
                </p>
              </div>
              <div className="ml-2 shrink-0 rounded-full bg-primary/10 p-2 sm:p-3">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Cart Items
                </p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                  {stats.cartItemCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.cartItemCount === 1 ? "item" : "items"} ready to buy
                </p>
              </div>
              <div className="ml-2 shrink-0 rounded-full bg-primary/10 p-2 sm:p-3">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                  {stats.totalOrders}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.totalOrders === 1 ? "order" : "orders"} completed
                </p>
              </div>
              <div className="ml-2 shrink-0 rounded-full bg-primary/10 p-2 sm:p-3">
                <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Recent Tagged Photos */}
          <div className="lg:col-span-2 rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">
                  Recent Photos of You
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Latest photos where you&apos;ve been tagged
                </p>
              </div>
              <ViewAllLink />
            </div>

            {recentTaggedPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {recentTaggedPhotos.map((photo) => (
                  <Link
                    key={photo.photo_id}
                    href={`/dashboard/talent/photos${
                      photo.event_id ? `?event=${photo.event_id}` : ""
                    }`}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted transition-transform hover:scale-105"
                  >
                    {photo.signed_url ? (
                      <Image
                        src={photo.signed_url}
                        alt={
                          photo.event_name
                            ? `Photo from ${photo.event_name}`
                            : "Tagged photo"
                        }
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 33vw"
                        unoptimized={
                          photo.signed_url.startsWith("http://localhost") ||
                          photo.signed_url.startsWith("http://127.0.0.1")
                        }
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {photo.event_name && (
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs font-medium text-white truncate">
                          {photo.event_name}
                        </p>
                        {photo.event_date && (
                          <p className="text-xs text-white/80">
                            {format(new Date(photo.event_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Quick Actions & Recent Orders */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <QuickActions cartItemCount={stats.cartItemCount} />

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Recent Purchases
                  </h2>
                </div>
                <div className="space-y-3">
                  {recentOrders.slice(0, 3).map((order) => {
                    const totalCents = order.items.reduce(
                      (sum, item) => sum + item.total_price_cents,
                      0,
                    );
                    return (
                      <div
                        key={order.id}
                        className="rounded-lg border bg-muted/40 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium">
                              {format(
                                new Date(order.created_at),
                                "MMM d, yyyy",
                              )}
                            </p>
                            {order.items.length > 0 &&
                              order.items[0].event_name && (
                                <p className="mt-1 text-xs text-muted-foreground truncate">
                                  {order.items[0].event_name}
                                </p>
                              )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {order.items.length}{" "}
                              {order.items.length === 1 ? "photo" : "photos"}
                            </p>
                          </div>
                          <div className="ml-2 shrink-0 text-right">
                            <p className="text-sm font-semibold">
                              {formatCurrency(totalCents)}
                            </p>
                            <p
                              className={cn(
                                "mt-1 text-xs",
                                order.status === "completed"
                                  ? "text-green-600 dark:text-green-400"
                                  : order.status === "pending"
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-muted-foreground",
                              )}
                            >
                              {order.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
