export default function Home() {
  return (
    <div className="mx-auto max-w-6xl py-16">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Sell your photos, book shoots, grow your brand
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          OceaPic helps photographers manage events, showcase portfolios, and
          monetize content — all in one simple dashboard.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
          >
            Get started
          </a>
          <a
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md border px-6 text-sm"
          >
            Log in
          </a>
        </div>
      </section>

      <section className="mt-14 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">Events & Bookings</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create events, manage schedules, and keep track of clients.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">Monetize Content</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Sell photo sets and videos directly to your audience.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">Analytics</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Understand sales and engagement with simple insights.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-semibold">Collaboration</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Work with models and clients using integrated messaging.
          </p>
        </div>
      </section>
    </div>
  );
}
