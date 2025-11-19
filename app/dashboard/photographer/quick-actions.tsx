"use client";

import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuickActions() {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
        Quick Actions
      </h2>
      <div className="space-y-2 sm:space-y-3">
        <Link
          href="/dashboard/photographer/events/new"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "w-full justify-start text-sm sm:text-base",
          )}
        >
          <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Create New Event
        </Link>
        <Link
          href="/dashboard/photographer/events"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full justify-start text-sm sm:text-base",
          )}
        >
          <FolderOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          View All Events
        </Link>
      </div>
    </div>
  );
}
