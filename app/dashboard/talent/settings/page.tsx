export default function TalentSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6 rounded-xl border p-6">
      <div>
        <h2 className="text-xl font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose when we should email you about bookings and tagged content.
        </p>
      </div>
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium">Booking updates</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Receive notifications when a photographer invites you to a shoot.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium">Tag confirmations</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Get notified when new photos include you or require approval.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium">Weekly tips</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Occasional updates on portfolio best practices and safety.
          </p>
        </div>
      </div>
    </div>
  );
}
