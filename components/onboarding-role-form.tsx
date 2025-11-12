"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  saveRole: (formData: FormData) => Promise<void>;
};

export default function OnboardingRoleForm({ saveRole }: Props) {
  const [selectedRole, setSelectedRole] = useState<
    "photographer" | "talent" | null
  >(null);

  return (
    <form action={saveRole} className="grid gap-6">
      <input type="hidden" name="role" value={selectedRole ?? ""} />

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

      <div className="flex justify-end">
        <Button type="submit" disabled={!selectedRole} className="px-8">
          Continue
        </Button>
      </div>
    </form>
  );
}
