"use client";

import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  Home,
  LifeBuoy,
  MessageSquare,
  Send,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { NavMains } from "./nav-main";
// import { NavProjects } from "./nav-projects";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "./ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    { title: "Overview", url: "/dashboard", icon: Home },
    { title: "Create Event", url: "/dashboard/events/new", icon: CalendarPlus },
    { title: "Events", url: "/dashboard/events", icon: CalendarDays },
    { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
    { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: MapIcon,
  //   },
  // ],
};

function RoleSwitcher({
  activeRole,
}: {
  activeRole: "photographer" | "model";
}) {
  const router = useRouter();
  const onSelect = async (role: "photographer" | "model") => {
    await fetch("/auth/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.refresh();
  };

  return (
    <div className="px-2 pb-2">
      <div className="text-xs text-muted-foreground mb-1">Active role</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
          >
            {activeRole === "photographer" ? "Photographer" : "Model"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => onSelect("photographer")}>
            Photographer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSelect("model")}>
            Model
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AppSidebar({
  activeRole,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  activeRole: "photographer" | "model";
}) {
  return (
    <Sidebar className="h-svh" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-1.5">
          <Image src="/logo.svg" alt="Logo" width={22} height={22} />
          <span className="font-semibold">OceaPic</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMains items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="w-full space-y-2">
          <RoleSwitcher activeRole={activeRole} />
          <NavUser user={data.user} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
