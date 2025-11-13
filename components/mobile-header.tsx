"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={24}
          height={24}
          className="h-7 w-7 shrink-0 -translate-x-0.5"
          priority
        />
        <h1 className="text-xl font-bold select-none">OceaPic</h1>
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="md"
        className={cn("size-10 p-0 min-w-0", "hover:bg-accent")}
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        <Menu className="h-5 w-5 text-gray-900 dark:text-gray-100" />
      </Button>
    </div>
  );
}
