'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { signInWithGoogle } from '@/app/auth/google/actions';
import { Button } from '@/components/ui/button';

interface GoogleSignInButtonProps {
  plan?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  className?: string;
}

export function GoogleSignInButton({
  plan,
  variant = 'outline',
  className,
}: GoogleSignInButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      const result = await signInWithGoogle(plan);
      if (result.error) {
        router.push(`/login?message=Could not sign in with Google. Reason: ${result.error}`);
      } else if (result.url) {
        window.location.href = result.url;
      } else {
        router.push('/login?message=Failed to initiate Google sign-in');
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
      <Image src="/google.svg" alt="Google" width={25} height={25} />
    </Button>
  );
}
