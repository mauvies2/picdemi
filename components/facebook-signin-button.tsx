'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { signInWithFacebook } from '@/app/auth/facebook/actions';
import { Button } from '@/components/ui/button';

interface FacebookSignInButtonProps {
  plan?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  className?: string;
}

export function FacebookSignInButton({
  plan,
  variant = 'outline',
  className,
}: FacebookSignInButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      const result = await signInWithFacebook(plan);
      if (result.error) {
        router.push(`/login?message=Could not sign in with Facebook. Reason: ${result.error}`);
      } else if (result.url) {
        window.location.href = result.url;
      } else {
        router.push('/login?message=Failed to initiate Facebook sign-in');
      }
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={isPending}
    >
      <Image src="/facebook.svg" alt="Facebook" width={25} height={25} />
    </Button>
  );
}
