import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/database/server";

export default async function ModelProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("id", user.id)
    .maybeSingle();

  const updateProfile = async (formData: FormData) => {
    "use server";

    const displayName = formData.get("display_name") as string | null;
    const bio = formData.get("bio") as string | null;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/login");
    }

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: displayName?.trim() || null,
        bio: bio?.trim() || null,
      },
      { onConflict: "id", ignoreDuplicates: false },
    );

    revalidatePath("/dashboard/model/profile");
  };

  return (
    <div className="max-w-2xl space-y-6 rounded-xl border p-6">
      <div>
        <h2 className="text-xl font-semibold">Profile details</h2>
        <p className="text-sm text-muted-foreground">
          Share a short introduction so photographers recognise you.
        </p>
      </div>
      <form action={updateProfile} className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            name="display_name"
            placeholder="Jordan Rivers"
            defaultValue={profile?.display_name ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            placeholder="Introduce yourself, add experience, or list upcoming goals."
            defaultValue={profile?.bio ?? ""}
          />
        </div>
        <div>
          <Button type="submit" className="rounded-md">
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
