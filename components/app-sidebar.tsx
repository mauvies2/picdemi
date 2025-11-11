"use client";

import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  Camera,
  ChevronLeft,
  ChevronRight,
  Home,
  LifeBuoy,
  MessageSquare,
  Send,
  User,
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
  useSidebar,
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
  const { state } = useSidebar();
  const onSelect = async (role: "photographer" | "model") => {
    await fetch("/auth/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.refresh();
  };

  // Collapsed: show icon-only role switcher
  if (state === "collapsed") {
    const Icon = activeRole === "photographer" ? Camera : User;
    const color =
      activeRole === "photographer"
        ? "bg-sky-100 text-sky-700 border-sky-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200";
    return (
      <div className="pb-2 flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 w-8 rounded-full p-2 ${color}`}
            >
              <Icon className="h-4 w-4" />
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

  // Expanded: show labeled selector
  return (
    <div className="pb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`w-full justify-start gap-2 ${
              activeRole === "photographer"
                ? "bg-sky-100 text-sky-700 border-sky-200"
                : "bg-emerald-100 text-emerald-700 border-emerald-200"
            }`}
          >
            {activeRole === "photographer" ? (
              <>
                <Camera className="h-4 w-4" />
                <span>Photographer</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                <span>Model</span>
              </>
            )}
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

// function CollapseButton() {
//   const { state, toggleSidebar } = useSidebar();
//   const Icon = state === "expanded" ? ChevronLeft : ChevronRight;
//   return (
//     <button
//       type="button"
//       aria-label="Toggle sidebar"
//       onClick={toggleSidebar}
//       className="absolute -right-[1.2rem] top-10 inline-flex h-5 w-5 z-50 items-center justify-center rounded-full border bg-background hover:bg-muted transition-colors shadow-sm"
//     >
//       <Icon className="h-3 w-3 text-foreground/60" />
//     </button>
//   );
// }

export function AppSidebar({
  activeRole,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  activeRole: "photographer" | "model";
}) {
  return (
    <Sidebar collapsible="icon" className="h-svh" {...props}>
      <SidebarHeader>
        <div className="relative flex items-center px-2 pb-1.5 pt-2">
          <Link href="/" className="flex items-center gap-1">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={24}
              height={24}
              className="h-7 w-7 shrink-0 -translate-x-0.5"
              priority
            />
            <h1 className="text-2xl font-bold select-none transition-opacity group-data-[collapsible=icon]:opacity-0">
              OceaPic
            </h1>
          </Link>
          {/* <CollapseButton /> */}
        </div>
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
