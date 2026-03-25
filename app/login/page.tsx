import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDashboardPath } from '@/app/actions/roles';
import { CloseButton } from '@/components/close-button';
import { FacebookSignInButton } from '@/components/facebook-signin-button';
import { ForgotPasswordLink } from '@/components/forgot-password-link';
import { GoogleSignInButton } from '@/components/google-signin-button';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/database/server';

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    plan?: string;
    success?: string;
    reset?: string;
    token?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in and has a plan parameter, redirect to billing checkout
  if (user && params.plan && (params.plan === 'starter' || params.plan === 'pro')) {
    return redirect(`/dashboard/photographer/settings?upgrade=${params.plan}`);
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.active_role) {
      const dashboardPath = await getDashboardPath();
      return redirect(dashboardPath);
    }

    const { data: roles } = await supabase
      .from('user_role_memberships')
      .select('role')
      .eq('user_id', user.id);

    if (roles && roles.length > 0) {
      const dashboardPath = await getDashboardPath();
      return redirect(dashboardPath);
    }

    return redirect('/onboarding/role');
  }

  const signIn = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      return redirect(`/login?message=Could not sign in. Reason: ${error.code}`);
    }
    // After successful login, check role to decide where to send the user.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect('/login?message=Could not retrieve user after login');
    }

    const { getProfileActiveRole, getUserRoles } = await import('@/database/queries');

    // Claim a guest download token if one was passed
    if (params.token) {
      try {
        const { getDownloadTokenByToken, claimDownloadToken } = await import(
          '@/database/queries/download-tokens'
        );
        const { supabaseAdmin } = await import('@/database/supabase-admin');
        const tokenRow = await getDownloadTokenByToken(supabaseAdmin, params.token);
        if (tokenRow && !tokenRow.claimed_by_user_id) {
          await claimDownloadToken(supabaseAdmin, tokenRow.id, user.id);
        }
        return redirect(`/download/${params.token}?claimed=true`);
      } catch (err) {
        console.error('Failed to claim download token on login:', err);
      }
    }

    const activeRole = await getProfileActiveRole(supabase, user.id);
    if (activeRole) {
      const dashboardPath = await getDashboardPath();
      return redirect(dashboardPath);
    }

    const roles = await getUserRoles(supabase, user.id);
    if (roles.length > 0) {
      const dashboardPath = await getDashboardPath();
      return redirect(dashboardPath);
    }

    return redirect('/onboarding/role');
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-6 md:p-8">
      <CloseButton className="absolute right-4 top-4" />
      <div className="w-full max-w-md">
        <h1 className="text-center text-4xl font-bold">Welcome back</h1>
        <p className="mt-4 text-center text-muted-foreground">
          Login with your Google, Facebook or Apple account
        </p>
        <div className="mt-4 flex gap-2">
          <GoogleSignInButton plan={params.plan} className="flex-1 h-12 border-2 rounded-lg" />
          <FacebookSignInButton plan={params.plan} className="flex-1 h-12 border-2 rounded-lg" />
          <Button type="button" variant="outline" className="flex-1 h-12 border-2 rounded-lg">
            <Image src="/apple.svg" alt="Apple" width={22} height={22} />
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-sm text-muted-foreground">
              or continue with email
            </span>
          </div>
        </div>

        <form className="animate-in flex w-full flex-col justify-center gap-2">
          {params?.message && (
            <p
              className={`mt-4 border p-4 text-center ${
                params.reset === 'success'
                  ? 'border-green-500 bg-green-100 text-green-800'
                  : 'border-red-500 bg-red-100 text-slate-600'
              }`}
            >
              {params.message}
            </p>
          )}
          <Label htmlFor="email">Email</Label>
          <Input
            className="mb-4 rounded-full border bg-inherit px-4 h-10"
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
          />
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <ForgotPasswordLink emailId="email" />
            </div>
            <Input
              className="mt-2 rounded-full border bg-inherit px-4 h-10 placeholder:text-muted-foreground/30"
              id="password"
              type="password"
              autoComplete="off"
              name="password"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <SubmitButton formAction={signIn} className="mb-2 h-10">
            Log in
          </SubmitButton>
          <p className="text-center">
            Don&apos;t have an account?{' '}
            <Link className="text-sky-600 hover:underline" href="/signup">
              Sign up
            </Link>
            here.
          </p>
        </form>
      </div>
    </div>
  );
}
