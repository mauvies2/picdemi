'use server';

import { createClient } from '@/database/server';
import { env } from '@/env.mjs';

export async function signInWithFacebook(plan?: string) {
  const supabase = await createClient();
  const origin = env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${env.NEXT_PUBLIC_VERCEL_URL}`
    : 'http://localhost:3000';

  // Build redirect URL with plan parameter if present
  const redirectTo = plan ? `${origin}/auth/callback?plan=${plan}` : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error('Facebook OAuth error:', error);
    return {
      error: error.message,
      url: null,
    };
  }

  if (data.url) {
    return {
      error: null,
      url: data.url,
    };
  }

  return {
    error: 'Failed to initiate Facebook sign-in',
    url: null,
  };
}
