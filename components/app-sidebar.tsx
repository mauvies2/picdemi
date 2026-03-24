'use client';

import {
  CalendarDays,
  CalendarPlus,
  Compass,
  Home,
  Images,
  LifeBuoy,
  Package,
  Send,
  User,
  Wallet,
  WalletMinimal,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { NavMains } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { Sidebar, SidebarContent, SidebarHeader } from './ui/sidebar';

const photographerNav = [
  { title: 'Overview', url: '/dashboard/photographer', icon: Home },
  {
    title: 'Create Event',
    url: '/dashboard/photographer/events/new',
    icon: CalendarPlus,
  },
  {
    title: 'Events',
    url: '/dashboard/photographer/events',
    icon: CalendarDays,
  },
  { title: 'Sales', url: '/dashboard/photographer/sales', icon: WalletMinimal },
  { title: 'Earnings', url: '/dashboard/photographer/earnings', icon: Wallet },
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
  { title: 'Overview', url: '/dashboard/talent', icon: Home },
  { title: 'My Photos', url: '/dashboard/talent/photos', icon: Images },
  { title: 'Profile', url: '/dashboard/talent/profile', icon: User },
  { title: 'Explore', url: '/dashboard/talent/events', icon: Compass },
  { title: 'Orders', url: '/dashboard/talent/orders', icon: Package },
];

const navSecondary = [
  {
    title: 'Support',
    url: '#',
    icon: LifeBuoy,
  },
  {
    title: 'Feedback',
    url: '#',
    icon: Send,
  },
];

export function AppSidebar({
  activeRole,
  user: _user,
  ...props
}: ComponentProps<typeof Sidebar> & {
  activeRole: 'photographer' | 'talent';
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}) {
  const navItems = activeRole === 'photographer' ? photographerNav : talentNav;

  return (
    <Sidebar collapsible="icon" className="h-svh" {...props}>
      <SidebarHeader>
        <div className="relative flex items-center px-2">
          <Link href="/" className="flex items-center gap-1">
            <Image src="/logo_dark.svg" alt="Logo" width={170} height={50} priority />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMains items={navItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
