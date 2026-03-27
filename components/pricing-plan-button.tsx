'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { createBillingCheckoutAction } from '@/app/[lang]/dashboard/photographer/billing/actions';
import { Button } from '@/components/ui/button';

interface PricingPlanButtonProps {
  planId: 'free' | 'starter' | 'pro';
  isFree: boolean;
  isAuthenticated?: boolean;
  className?: string;
}

export function PricingPlanButton({
  planId,
  isFree,
  isAuthenticated = false,
  className,
}: PricingPlanButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // For free plan, always link to signup
  if (isFree) {
    return (
      <Link href="/signup" className={className}>
        <Button
          variant="outline"
          size="lg"
          className="w-full justify-center gap-2 text-sm font-medium tracking-tight"
        >
          Start for free
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

  // If not authenticated, link to signup with plan parameter
  if (!isAuthenticated) {
    return (
      <Link href={`/signup?plan=${planId}`} className={className}>
        <Button
          variant="default"
          size="lg"
          className="w-full justify-center gap-2 text-sm font-medium tracking-tight bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {planId === 'starter' ? 'Get Starter' : 'Go Pro'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

  // For authenticated users with paid plans, create checkout
  const handleUpgrade = () => {
    startTransition(async () => {
      try {
        const result = await createBillingCheckoutAction(planId as 'starter' | 'pro');

        if ('url' in result) {
          // Redirect to Stripe Checkout
          window.location.href = result.url;
        } else if (result.updated) {
          // Subscription was updated directly
          router.push('/dashboard/photographer/settings?updated=true');
        }
      } catch (error) {
        // On error, redirect to signup as fallback
        console.error('Checkout error:', error);
        router.push(`/signup?plan=${planId}`);
      }
    });
  };

  return (
    <Button
      variant="default"
      size="lg"
      onClick={handleUpgrade}
      disabled={isPending}
      className={[
        'w-full justify-center gap-2 text-sm font-medium tracking-tight',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {planId === 'starter' ? 'Get Starter' : 'Go Pro'}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
