'use client';

import {
  Bell,
  CalendarDays,
  CalendarPlus,
  Camera,
  CreditCard,
  Home,
  LogOut,
  Settings,
  User,
  Wallet,
  WalletMinimal,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { switchRole } from '@/app/actions/roles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RoleSlug } from '@/lib/roles';
import { cn } from '@/lib/utils';

const navLinks = [
  {
    href: '/dashboard/photographer',
    label: 'Overview',
    icon: Home,
    isActive: (p: string) => p === '/dashboard/photographer',
  },
  {
    href: '/dashboard/photographer/events',
    label: 'Events',
    icon: CalendarDays,
    isActive: (p: string) =>
      p.startsWith('/dashboard/photographer/events') &&
      !p.startsWith('/dashboard/photographer/events/new'),
  },
  {
    href: '/dashboard/photographer/events/new',
    label: 'Create',
    icon: CalendarPlus,
    isActive: (p: string) => p === '/dashboard/photographer/events/new',
  },
];

const accountActiveRoutes = [
  '/dashboard/photographer/sales',
  '/dashboard/photographer/earnings',
  '/dashboard/photographer/profile',
  '/dashboard/photographer/settings',
];

export function PhotographerBottomNav({
  user,
  activeRole,
}: {
  user: { name: string; email: string; avatar?: string | null };
  activeRole: RoleSlug;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [_optimisticRole, addOptimisticRole] = useOptimistic<RoleSlug, RoleSlug>(
    activeRole,
    (_, role) => role,
  );
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    await fetch('/auth/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const handleSwitchRole = () => {
    if (isPending) return;
    startTransition(async () => {
      addOptimisticRole('talent');
      try {
        const result = await switchRole('talent');
        addOptimisticRole(result.activeRole);
        router.push('/dashboard/talent');
      } catch {
        addOptimisticRole(activeRole);
      } finally {
        router.refresh();
      }
    });
  };

  const isAccountActive = accountActiveRoutes.some((r) => pathname.startsWith(r));

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
    >
      {navLinks.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors duration-150',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70',
            )}
          >
            <item.icon
              className={cn(
                'h-5 w-5 shrink-0 transition-all duration-150',
                active ? 'stroke-[2.5]' : 'stroke-[1.5]',
              )}
              aria-hidden="true"
            />
            <span
              className={cn('text-[10px] leading-none tracking-tight', active && 'font-semibold')}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Account tab */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors duration-150 outline-none',
            isAccountActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70',
          )}
          aria-label="Account menu"
        >
          <Avatar
            className={cn(
              'h-5 w-5 transition-all duration-150',
              isAccountActive ? 'ring-[2px] ring-foreground ring-offset-1' : '',
            )}
          >
            <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
            <AvatarFallback className="text-[9px]">
              {user.name?.charAt(0).toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              'text-[10px] leading-none tracking-tight',
              isAccountActive && 'font-semibold',
            )}
          >
            Account
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56 rounded-lg mb-1" side="top" align="end" sideOffset={8}>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>

          <div className="px-2 py-1.5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Camera className="h-3 w-3" />
              Active role:
              <span className="font-medium text-foreground">Photographer</span>
            </span>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/photographer/sales">
                <WalletMinimal className="mr-2 h-4 w-4" />
                <span>Sales</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/photographer/earnings">
                <Wallet className="mr-2 h-4 w-4" />
                <span>Earnings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/photographer/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/photographer/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/photographer/settings?tab=billing">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleSwitchRole} disabled={isPending}>
              <Camera className="mr-2 h-4 w-4" />
              <span>Switch to Talent</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
