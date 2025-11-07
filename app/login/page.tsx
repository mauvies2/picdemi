import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/database/server";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRole?.role) {
      return redirect("/dashboard");
    }
    return redirect("/onboarding/role");
  }

  const signIn = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      return redirect(
        `/login?message=Could not sign in. Reason: ${error.code}`,
      );
    }
    // After successful login, check role to decide where to send the user.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/login?message=Could not retrieve user after login");
    }

    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRole?.role) {
      return redirect("/dashboard");
    }
    return redirect("/onboarding/role");
  };

  return (
    <div className="mx-auto mt-6 w-full sm:px-8 sm:max-w-md">
      <h1 className="text-center text-4xl font-bold">Welcome back</h1>
      <p className="mt-2">Login with your Google, Facebook or Apple account</p>
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 border-2 rounded-lg"
        >
          <Image src="/google.svg" alt="Google" width={25} height={25} />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 border-2 rounded-lg"
        >
          <Image src="/facebook.svg" alt="Facebook" width={25} height={25} />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 border-2 rounded-lg"
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
          className="mb-6 rounded-full border bg-inherit px-4 h-10 placeholder:text-muted-foreground/30"
          id="password"
          type="password"
          autoComplete="off"
          name="password"
          placeholder="••••••••"
          minLength={6}
          required
        />
        <SubmitButton formAction={signIn} className="mb-2 h-10">
          Log in
        </SubmitButton>
        <p className="text-center">
          Don&apos;t have an account?{" "}
          <Link className="text-sky-600 hover:underline" href="/signup">
            {"Sign up"}
          </Link>
          {" here."}
        </p>
      </form>
    </div>
  );
}
