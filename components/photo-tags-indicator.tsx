"use client";

import { Trash2, Users } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { untagPhotoForTalentAction } from "@/app/dashboard/events/[id]/actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PhotoTag {
  tag_id: string;
  talent_user_id: string;
  talent_email: string;
  talent_display_name: string | null;
  tagged_at: string;
}

interface PhotoTagsIndicatorProps {
  tags: PhotoTag[];
  photoId: string;
  className?: string;
  onUntag?: () => void;
  isDropdownOpen?: boolean;
  onDropdownOpenChange?: (open: boolean) => void;
}

export function PhotoTagsIndicator({
  tags,
  photoId,
  className,
  onUntag,
  isDropdownOpen = false,
  onDropdownOpenChange,
}: PhotoTagsIndicatorProps) {
  const [isUntagging, startUntagging] = useTransition();

  if (tags.length === 0) {
    return null;
  }

  const handleUntag = (talentUserId: string) => {
    startUntagging(async () => {
      try {
        await untagPhotoForTalentAction(photoId, talentUserId);
        toast.success("Tag removed");
        onUntag?.();
      } catch (error) {
        console.error("Error untagging photo:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to remove tag",
        );
      }
    });
  };

  return (
    <Popover
      onOpenChange={(open) => {
        onDropdownOpenChange?.(open);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "pointer-events-auto flex size-6 items-center justify-center rounded-full bg-background/60 text-foreground/80 opacity-0 shadow-sm transition-all group-hover:opacity-100 cursor-pointer hover:bg-background/70 border-0 p-0",
            isDropdownOpen && "opacity-100",
            className,
          )}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <Users className="size-3" />
          {tags.length > 1 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {tags.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        side="top"
        align="start"
        onClick={(e) => e.stopPropagation()}
        onPointerEnter={(e) => e.stopPropagation()}
      >
        <div className="space-y-1.5">
          {tags.map((tag) => (
            <div
              key={tag.tag_id}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm group"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {tag.talent_display_name || "No name"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {tag.talent_email}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUntag(tag.talent_user_id);
                }}
                disabled={isUntagging}
                className="ml-2 rounded p-1 hover:text-destructive disabled:opacity-50"
                aria-label={`Remove tag for ${tag.talent_display_name || tag.talent_email}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
