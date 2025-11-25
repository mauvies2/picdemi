"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewEventButtonProps {
  eventId: string;
}

export function ViewEventButton({ eventId }: ViewEventButtonProps) {
  return (
    <Link
      href={`/dashboard/photographer/events/${eventId}`}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "w-full mt-3 sm:mt-4 text-xs sm:text-sm",
      )}
    >
      View Event
    </Link>
  );
}
