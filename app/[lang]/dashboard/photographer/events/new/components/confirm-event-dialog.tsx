'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';

type SummaryItem = { label: string; value: string };

type ConfirmEventDialogProps = {
  open: boolean;
  onClose: () => void;
  summary: SummaryItem[];
  isPending: boolean;
  onConfirm: () => void;
};

export function ConfirmEventDialog({
  open,
  onClose,
  summary,
  isPending,
  onConfirm,
}: ConfirmEventDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-100 bg-black/40" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-120 mx-auto w-full max-w-md -translate-y-1/2 rounded-2xl bg-background p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-lg font-semibold">Confirm details</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Review and confirm your event information.
          </Dialog.Description>
          <div className="mt-4 grid gap-2 text-sm">
            {summary.map((item) => (
              <div
                key={item.label}
                className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-b-0 last:pb-0"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value || '—'}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="rounded-md">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="button" onClick={onConfirm} disabled={isPending} className="rounded-md">
              {isPending ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading Photos...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
