'use client';

import { Camera, Compass } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Camera className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">No photos added yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Photos where you&apos;re tagged will appear here
      </p>
      <Link
        href="/dashboard/talent/events"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}
      >
        <Compass className="mr-2 h-4 w-4" />
        Explore Events
      </Link>
    </div>
  );
}
