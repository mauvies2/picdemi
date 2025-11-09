"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <SidebarTrigger />
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
    </div>
  );
}


