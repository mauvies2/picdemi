'use client';

import { usePathname } from 'next/navigation';

export function ConditionalHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/auth/reset-password')) return null;
  return <>{children}</>;
}
