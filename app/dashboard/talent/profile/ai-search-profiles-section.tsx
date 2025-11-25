"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronUp, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type AISearchProfile,
  deleteMyAISearchProfile,
  getMyAISearchProfiles,
} from "@/app/dashboard/talent/photos/ai-matching/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AISearchProfilesSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [presets, setPresets] = useState<AISearchProfile[]>([]);
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);

  const loadPresets = useCallback(() => {
    startTransition(async () => {
      try {
        const data = await getMyAISearchProfiles();
        setPresets(data);
      } catch (error) {
        console.error("Failed to load presets:", error);
        toast.error("Failed to load AI search profiles");
      }
    });
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleDelete = useCallback((presetId: string) => {
    setPresetToDelete(presetId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!presetToDelete) return;

    startTransition(async () => {
      try {
        await deleteMyAISearchProfile(presetToDelete);
        toast.success("Preset deleted");
        setDeleteDialogOpen(false);
        setPresetToDelete(null);
        loadPresets();
      } catch (error) {
        console.error("Failed to delete preset:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to delete preset",
        );
      }
    });
  }, [presetToDelete, loadPresets]);

  if (presets.length === 0 && !isPending) {
    return null; // Don't show section if no presets
  }

  return (
    <>
      <div className="border-t pt-6 mt-6">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">AI Search Profiles</h3>
            <span className="text-sm text-muted-foreground">
              ({presets.length})
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {isOpen && (
          <div className="mt-4 space-y-3">
            {isPending && presets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : presets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No AI search profiles yet. Create one when using "Find Me with
                AI".
              </p>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  className="rounded-lg border p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{preset.name}</h4>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {preset.activity_type && (
                        <p>Activity: {preset.activity_type}</p>
                      )}
                      {preset.country && (
                        <p>
                          Location: {preset.country}
                          {preset.region && `, ${preset.region}`}
                        </p>
                      )}
                      {(preset.date_from || preset.date_to) && (
                        <p>
                          Date range:{" "}
                          {preset.date_from
                            ? format(new Date(preset.date_from), "MMM d, yyyy")
                            : "Any"}{" "}
                          -{" "}
                          {preset.date_to
                            ? format(new Date(preset.date_to), "MMM d, yyyy")
                            : "Any"}
                        </p>
                      )}
                      <p className="text-xs">
                        Created{" "}
                        {format(new Date(preset.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(preset.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete AI Search Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this preset? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPresetToDelete(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
