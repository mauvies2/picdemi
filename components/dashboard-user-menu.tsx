"use client";

import { Bell, CreditCard, LogOut, Settings, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RoleSlug = "photographer" | "talent";

export function DashboardUserMenu({
  user,
  activeRole,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  activeRole: RoleSlug;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const profileUrl =
    activeRole === "photographer"
      ? "/dashboard/photographer/profile"
      : "/dashboard/talent/profile";
  const settingsUrl =
    activeRole === "photographer"
      ? "/dashboard/photographer/settings"
      : "/dashboard/talent/settings";

  const isProfileActive = pathname.startsWith(profileUrl);
  const isSettingsActive = pathname.startsWith(settingsUrl);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 rounded-lg hover:bg-accent p-0"
          aria-label="User menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
              <AvatarFallback>
                {user.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push(profileUrl)}
            className={isProfileActive ? "bg-accent" : ""}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(settingsUrl)}
            className={isSettingsActive ? "bg-accent" : ""}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {activeRole === "photographer" && (
            <DropdownMenuItem
              onClick={() =>
                router.push("/dashboard/photographer/settings?tab=billing")
              }
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem disabled>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
