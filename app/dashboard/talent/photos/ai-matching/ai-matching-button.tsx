"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AIMatchingModal } from "./ai-matching-modal";

export function AIMatchingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2"
        variant="default"
      >
        <Sparkles className="h-4 w-4" />
        Find Me with AI
      </Button>
      <AIMatchingModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
