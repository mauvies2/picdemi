"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ViewAllLink() {
  return (
    <Link
      href="/dashboard/talent/photos"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "text-xs sm:text-sm",
      )}
    >
      View All
      <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
    </Link>
  );
}

