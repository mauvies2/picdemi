'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { EventShareCode } from '@/components/event-share-code';
import { Button } from '@/components/ui/button';

type ShareCodeDialogProps = {
  shareCode: string;
  eventName: string;
  onGoToEvent: () => void;
};

export function ShareCodeDialog({ shareCode, eventName, onGoToEvent }: ShareCodeDialogProps) {
  return (
    <Dialog.Root open onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-100 bg-black/40" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-120 mx-auto w-full max-w-md -translate-y-1/2 rounded-2xl bg-background p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-lg font-semibold">Event Created Successfully!</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Your private event has been created. Share this code with people who should have access.
          </Dialog.Description>
          <div className="mt-4">
            <EventShareCode shareCode={shareCode} eventName={eventName} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={onGoToEvent} className="rounded-md">
              Go to Event
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
