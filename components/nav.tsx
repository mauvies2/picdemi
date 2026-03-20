'use client';

import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './user-avatar';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
];

export function Nav({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/dashboard')
  ) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-(--header-height) max-w-[1600px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo_dark.svg" alt="Picdemi" width={170} height={70} priority />
            </Link>
          </div>

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

          <div className="hidden md:flex md:items-center md:gap-4">
            {user ? (
              <UserAvatar user={user} />
            ) : (
              <>
                <Link href="/login" className="text-sm hover:text-foreground/70 transition-colors">
                  Log in
                </Link>
                <Link href="/signup" tabIndex={-1}>
                  <Button size="md">Get started</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md bg-background"
            aria-label="Toggle Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Toggle Menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-7 w-7"
              aria-hidden="true"
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 z-60 bg-white flex flex-col justify-between gap-5 px-4 py-6 sm:px-6 lg:px-8 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col gap-6 items-center">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base text-foreground/90 hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <Button className="w-full">Sign up</Button>
        </div>
      )}
    </>
  );
}
