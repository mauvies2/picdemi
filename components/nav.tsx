'use client';

import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './user-avatar';

export function Nav({ user }: { user: User | null }) {
  const pathname = usePathname();

  if (
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/dashboard')
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-(--header-height) max-w-[1600px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo_dark.svg" alt="Picdemi" width={170} height={70} priority />
        </Link>

        {/* <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground/70 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav> */}

        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <UserAvatar user={user} />
          ) : (
            <>
              <Link href="/login" className="text-sm hover:text-foreground/70 transition-colors">
                <Button size="md" className="md:hidden">
                  Log in
                </Button>
                <span className="hidden md:inline-flex">Log in</span>
              </Link>
              <Link href="/signup" tabIndex={-1} className="hidden md:inline-flex">
                <Button size="md">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
