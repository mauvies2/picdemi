"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartLinkButton } from "@/components/cart-link-button";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const isTalentDashboard = pathname?.startsWith("/dashboard/talent");

  return (
    <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={24}
          height={24}
          className="h-7 w-7 shrink-0 -translate-x-0.5"
          priority
        />
        <h1 className="text-xl font-bold select-none">Shootea</h1>
      </Link>
      <div className="flex items-center gap-2">
        {isTalentDashboard && <CartLinkButton />}
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
    </div>
  );
}
