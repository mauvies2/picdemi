import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardPath } from "@/app/actions/roles";
import { CloseButton } from "@/components/close-button";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/database/server";
import { env } from "@/env.mjs";

export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in and has a plan parameter, redirect to settings page
  if (
    user &&
    params.plan &&
    (params.plan === "amateur" || params.plan === "pro")
  ) {
    return redirect(`/dashboard/photographer/settings?upgrade=${params.plan}`);
  }

  if (user) {
    const dashboardPath = await getDashboardPath();
    return redirect(dashboardPath);
  }

  const signUp = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      return redirect(`/signup?message=Passwords do not match`);
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: env.NEXT_PUBLIC_VERCEL_URL
          ? `https://${env.NEXT_PUBLIC_VERCEL_URL}`
          : "http://localhost:3000",
      },
    });

    if (error) {
      console.error(error);
      return redirect(
        `/signup?message=Could not signup user. Reason: ${error.code}`,
      );
    }

    // Preserve plan parameter if present
    const planParam = params.plan ? `&plan=${params.plan}` : "";
    return redirect(
      `/login?success=Check email to continue sign in process${planParam}`,
    );
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-6 md:p-8">
      <CloseButton className="absolute right-4 top-4 md:right-6 md:top-6" />
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-4xl font-bold">
          Create an account
        </h1>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 border-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <Image src="/google.svg" alt="Google" width={25} height={25} />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 border-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <Image src="/facebook.svg" alt="Facebook" width={25} height={25} />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 border-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <Image src="/apple.svg" alt="Apple" width={22} height={22} />
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>
        </div>

        <form className="animate-in flex w-full flex-col justify-center gap-2">
          {params?.message && (
            <p className="mt-4 border border-red-500 bg-red-100 p-4 text-center text-slate-600">
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
          <Label htmlFor="password">Password</Label>
          <Input
            className="mb-4 rounded-full border bg-inherit px-4 h-10 placeholder:text-muted-foreground/30"
            id="password"
            type="password"
            autoComplete="off"
            name="password"
            placeholder="••••••••"
            minLength={6}
            required
          />
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            className="mb-6 rounded-full border bg-inherit px-4 h-10 placeholder:text-muted-foreground/30"
            id="confirmPassword"
            type="password"
            autoComplete="off"
            name="confirmPassword"
            placeholder="••••••••"
            minLength={6}
            required
          />
          <SubmitButton formAction={signUp} className="mb-2 h-10">
            Create Account
          </SubmitButton>
          <p className="text-center">
            Already have account?{" "}
            <Link className="text-sky-600 hover:underline" href="/login">
              {"Log in"}
            </Link>
            {" here."}
          </p>
          <p className="mt-4 text-center text-xs">
            By continuing, you agree to Supabase's Terms of Service and Privacy
            Policy, and to receive periodic emails with updates.
          </p>
        </form>
      </div>
    </div>
  );
}
