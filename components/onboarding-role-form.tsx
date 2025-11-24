"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  saveRole: (formData: FormData) => Promise<void>;
};

export default function OnboardingRoleForm({ saveRole }: Props) {
  const [selectedRole, setSelectedRole] = useState<
    "photographer" | "talent" | null
  >(null);
  const [username, setUsername] = useState("");

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to lowercase and remove invalid characters
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(value);
  };

  const isUsernameValid = username.length >= 3 && username.length <= 30;

  return (
    <form action={saveRole} className="grid gap-6">
      <input type="hidden" name="role" value={selectedRole ?? ""} />
      <input type="hidden" name="username" value={username} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => setSelectedRole("photographer")}
          className={`h-40 rounded-xl border-2 p-6 text-left transition-colors ${
            selectedRole === "photographer"
              ? "border-primary bg-primary/5"
              : "border-muted hover:border-primary/50"
          }`}
        >
          <div className="text-xl font-semibold">Photographer</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Sell your photos and videos. Manage your portfolio and earnings.
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole("talent")}
          className={`h-40 rounded-xl border-2 p-6 text-left transition-colors ${
            selectedRole === "talent"
              ? "border-primary bg-primary/5"
              : "border-muted hover:border-primary/50"
          }`}
        >
          <div className="text-xl font-semibold">Talent / Athlete / Buyer</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Purchase multimedia and collaborate with photographers.
          </div>
        </button>
      </div>

      {selectedRole && (
        <div className="space-y-2">
          <Label htmlFor="username">Choose a username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="johndoe"
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9_-]+"
            required
            className="rounded-full"
          />
          <p className="text-xs text-muted-foreground">
            This will be how others see you (e.g., in photo tags). 3-30
            characters, lowercase letters, numbers, underscores, and hyphens
            only.
          </p>
          {username && !isUsernameValid && (
            <p className="text-xs text-destructive">
              Username must be between 3 and 30 characters
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!selectedRole || !isUsernameValid}
          className="px-8"
        >
          Continue
        </Button>
      </div>
    </form>
  );
}
