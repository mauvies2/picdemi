'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { getCartItemCountAction } from '@/app/dashboard/talent/cart/actions';
import { useGuestCart } from '@/components/guest-cart-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function AuthCartLinkButton() {
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [, startTransition] = useTransition();

  const fetchCartCount = useCallback(() => {
    startTransition(async () => {
      try {
        const count = await getCartItemCountAction();
        setCartItemCount(count);
      } catch {
        setCartItemCount(0);
      }
    });
  }, []);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  useEffect(() => {
    const handleFocus = () => fetchCartCount();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchCartCount]);

  return <CartIconButton href="/dashboard/talent/cart" count={cartItemCount} />;
}

function GuestCartLinkButton() {
  const { itemCount } = useGuestCart();
  return <CartIconButton href="/cart" count={itemCount} />;
}

function CartIconButton({ href, count }: { href: string; count: number }) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        size="sm"
        className="relative h-10 w-10 p-0 hover:bg-accent"
        aria-label="Shopping cart"
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span
            className={cn(
              'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
              'bg-primary text-primary-foreground',
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Button>
    </Link>
  );
}

export function CartLinkButton({ guest = false }: { guest?: boolean }) {
  if (guest) return <GuestCartLinkButton />;
  return <AuthCartLinkButton />;
}
