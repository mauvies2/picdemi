import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"output">) {
  return (
    <output aria-live="polite" {...props}>
      <Loader2Icon
        aria-hidden="true"
        focusable="false"
        className={cn("size-6 animate-spin", className)}
      />
      <span className="sr-only">Loading</span>
    </output>
  );
}

export { Spinner };
