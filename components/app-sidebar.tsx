"use client";

import {
  CalendarDays,
  CalendarPlus,
  Camera,
  Compass,
  Home,
  Images,
  LifeBuoy,
  Send,
  Settings,
  User,
  WalletMinimal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  type FC,
  useOptimistic,
  useTransition,
} from "react";
import { switchRole } from "@/app/actions/roles";
import { NavMains } from "./nav-main";
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

type RoleSlug = "photographer" | "talent";

const photographerNav = [
  { title: "Overview", url: "/dashboard/photographer", icon: Home },
  {
    title: "Create Event",
    url: "/dashboard/photographer/events/new",
    icon: CalendarPlus,
  },
  {
    title: "Events",
    url: "/dashboard/photographer/events",
    icon: CalendarDays,
  },
  { title: "Sales", url: "/dashboard/photographer/sales", icon: WalletMinimal },
  // {
  //   title: "Analytics",
  //   url: "/dashboard/photographer/analytics",
  //   icon: BarChart3,
  // },
  // {
  //   title: "Messages",
  //   url: "/dashboard/photographer/messages",
  //   icon: MessageSquare,
  // },
];

const talentNav = [
  { title: "Overview", url: "/dashboard/talent", icon: Home },
  { title: "Photos of you", url: "/dashboard/talent/photos", icon: Images },
  { title: "Explore", url: "/dashboard/talent/explore", icon: Compass },
  { title: "Profile", url: "/dashboard/talent/profile", icon: User },
  { title: "Settings", url: "/dashboard/talent/settings", icon: Settings },
];

const navSecondary = [
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
];

const RoleSwitcher: FC<{
  activeRole: RoleSlug;
}> = ({ activeRole }) => {
  const router = useRouter();
  const { state } = useSidebar();
  const [optimisticRole, addOptimisticRole] = useOptimistic<RoleSlug, RoleSlug>(
    activeRole,
    (_, role) => role,
  );
  const [isPending, startTransition] = useTransition();

  const onSelect = (role: RoleSlug) => {
    if (role === optimisticRole) return;
    startTransition(async () => {
      addOptimisticRole(role);
      try {
        const result = await switchRole(role);
        addOptimisticRole(result.activeRole);
        // Redirect to the correct dashboard homepage
        const dashboardPath =
          role === "photographer"
            ? "/dashboard/photographer"
            : "/dashboard/talent";
        router.push(dashboardPath);
      } catch (error) {
        console.error(error);
        addOptimisticRole(activeRole);
      } finally {
        router.refresh();
      }
    });
  };

  const currentRole = optimisticRole;

  if (state === "collapsed") {
    const Icon = currentRole === "photographer" ? Camera : User;
    const color =
      currentRole === "photographer"
        ? "bg-sky-100 text-sky-700 border-sky-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200";
    return (
      <div className="flex justify-center pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 w-8 rounded-full p-2 transition-opacity ${color} ${isPending ? "opacity-70" : ""}`}
              disabled={isPending}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onClick={() => onSelect("photographer")}>
              Photographer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelect("talent")}>
              Talent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`w-full justify-start gap-2 transition-opacity ${
              currentRole === "photographer"
                ? "bg-sky-100 text-sky-700 border-sky-200"
                : "bg-emerald-100 text-emerald-700 border-emerald-200"
            } ${isPending ? "opacity-70" : ""}`}
            disabled={isPending}
          >
            {currentRole === "photographer" ? (
              <>
                <Camera className="h-4 w-4" />
                <span>Photographer</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                <span>Talent</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => onSelect("photographer")}>
            Photographer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSelect("talent")}>
            Talent
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export function AppSidebar({
  activeRole,
  user,
  ...props
}: ComponentProps<typeof Sidebar> & {
  activeRole: RoleSlug;
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}) {
  const navItems = activeRole === "photographer" ? photographerNav : talentNav;

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
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMains items={navItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="w-full space-y-2">
          <RoleSwitcher activeRole={activeRole} />
          <NavUser user={user} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
