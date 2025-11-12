export default function ModelPhotosPage() {
  return (
    <div className="space-y-4 rounded-xl border p-6">
      <div>
        <h2 className="text-xl font-semibold">Your photos</h2>
        <p className="text-sm text-muted-foreground">
          Upload portraits, portfolio work, or mark favorites from tagged
          sessions.
        </p>
      </div>
      <div className="grid gap-4 text-sm text-muted-foreground">
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p>Photo library is empty.</p>
          <p>Uploads and selections will appear here soon.</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium">Coming soon</div>
          <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground">
            <li>Sync favorites from tagged shoots.</li>
            <li>Organize albums and shareable galleries.</li>
            <li>Track approvals &amp; licensing in one place.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
