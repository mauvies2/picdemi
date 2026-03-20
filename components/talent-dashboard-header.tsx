'use client';

import { LayoutDashboard, Package, Search, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { CartLinkButton } from '@/components/cart-link-button';
import { DashboardUserMenu } from '@/components/dashboard-user-menu';
import type { RoleSlug } from '@/lib/roles';
import { cn } from '@/lib/utils';

const talentNavLinks = [
  {
    href: '/dashboard/talent',
    label: 'Overview',
    icon: LayoutDashboard,
    exact: true,
  },
  { href: '/dashboard/talent/events', label: 'Explore', icon: Search },
  { href: '/dashboard/talent/photos', label: 'Photos of me', icon: Package },
  { href: '/dashboard/talent/orders', label: 'Orders', icon: ShoppingBag },
];

export function TalentDashboardHeader({
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          {/* Left: Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/logo_dark.svg" alt="Picdemi" width={130} height={50} priority />
          </Link>

          {/* Center: Nav Links (desktop) */}
          <nav className="hidden md:flex items-center gap-0.5">
            {talentNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive(link.href, link.exact)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Cart + User Avatar + Mobile hamburger */}
          <div className="flex items-center gap-3">
            <CartLinkButton />
            <DashboardUserMenu user={user} activeRole={activeRole} />
            <button
              type="button"
              className="md:hidden ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
              aria-label="Toggle Menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-background md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <nav className="flex flex-col gap-1 px-4 py-4">
            {talentNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium transition-colors',
                  isActive(link.href, link.exact)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
                onClick={() => setMobileOpen(false)}
              >
                <link.icon className="h-5 w-5 shrink-0" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
