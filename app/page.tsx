import { ArrowRight, Camera, CheckCircle2, Download, Search } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EventSearchBar } from '@/components/event-search-bar';
import { Footer } from '@/components/footer';
import { PricingPlanButton } from '@/components/pricing-plan-button';
import { Button } from '@/components/ui/button';
import { getProfileFields } from '@/database/queries';
import { createClient } from '@/database/server';
import { PLANS } from '@/lib/plans';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await getProfileFields(supabase, user.id, ['active_role']);
    if (profile?.active_role === 'PHOTOGRAPHER') {
      redirect('/dashboard/photographer');
    }
    redirect('/dashboard/talent');
  }

  const isAuthenticated = false;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-linear-to-br from-background via-background to-primary/5">
        {/* Decorative background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl text-center space-y-6 px-4 sm:px-6 lg:px-8">
          {/* <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-powered photo discovery for talents & creators</span>
            </div> */}

          <h1 className="text-balance text-5xl font-semibold tracking-tight lg:text-7xl">
            Your best shots
            <span className="block bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              delivered fast.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-normal text-muted-foreground sm:text-xl">
            Bridging the gap between photographers and athletes. Discover your photos in seconds
            through our advanced gallery search.
          </p>

          <EventSearchBar variant="hero" className="mx-auto" />

          <p className="text-xs text-muted-foreground/80 tracking-wider">
            No account needed · Buy in minutes · Instant downloads
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-6 w-px bg-muted-foreground/30" />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              From the lens to your gallery, in seconds.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              We connect photographers who love their craft with athletes who live for their
              passion.
            </p>
          </div>

          {/* Three Pillars */}
          <div className="mx-auto mt-16 max-w-6xl">
            <div className="grid gap-8 sm:grid-cols-3">
              {/* Pillar 1 */}
              <div className="group flex flex-col gap-5 rounded-2xl border bg-card p-8 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/50 transition-colors group-hover:bg-primary/10">
                  <Camera className="h-5 w-5 text-foreground/70 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    Upload &amp; Professionalize
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Drag, drop, and start selling. Upload thousands of photos in minutes and let our
                    smart metadata handle the organization for you.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="group flex flex-col gap-5 rounded-2xl border bg-card p-8 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/50 transition-colors group-hover:bg-primary/10">
                  <Search className="h-5 w-5 text-foreground/70 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Instant Discovery</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Find your moment. Search by event, location, or time. No more scrolling through
                    endless galleries to find that one perfect shot.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="group flex flex-col gap-5 rounded-2xl border bg-card p-8 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/50 transition-colors group-hover:bg-primary/10">
                  <Download className="h-5 w-5 text-foreground/70 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Secure &amp; Instant</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    One-click checkout, high-res downloads. Your memories are ready to share the
                    moment the race ends, watermark-free and at full quality.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-auto mt-16 max-w-6xl border-t border-border/40" />

          {/* Action Bar */}
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-px hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              Find my photos
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-7 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-px hover:opacity-90"
            >
              <Camera className="h-4 w-4" />
              Start selling as a photographer
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-linear-to-b from-muted/20 via-background to-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Pricing For Photographers
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Start for free and scale as your gallery grows. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const isFree = plan.id === 'free';
              const isPopular = plan.popular;

              return (
                <div
                  key={plan.id}
                  className={[
                    'relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200',
                    'hover:-translate-y-[2px] hover:border-primary/40 hover:shadow-md',
                    isPopular &&
                      'sm:-mt-2 bg-linear-to-b from-primary/5 to-card ring-1 ring-primary/40 ring-offset-1 ring-offset-background shadow-lg',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>

                    <div className="mt-3 flex items-baseline gap-2">
                      {plan.price !== null ? (
                        <>
                          <span className="text-3xl font-semibold">${plan.price}</span>
                          <span className="text-xs text-muted-foreground">/month</span>
                        </>
                      ) : (
                        <span className="text-3xl font-semibold">Free</span>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {plan.salesFeePercent}% sales fee • Cancel anytime
                    </p>
                  </div>

                  <ul className="mb-6 flex-1 space-y-2 text-sm text-foreground/90">
                    {plan.features.map((feature) => {
                      const text = typeof feature === 'string' ? feature : feature.text;
                      const badge = typeof feature === 'string' ? undefined : feature.badge;
                      return (
                        <li key={text} className="flex items-center gap-2 leading-relaxed">
                          <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1 text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[13px]">
                            {text}
                            {badge && (
                              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {badge}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-auto">
                    <PricingPlanButton
                      planId={plan.id}
                      isFree={isFree}
                      isAuthenticated={isAuthenticated}
                    />
                  </div>

                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Best for{' '}
                    {plan.id === 'free'
                      ? 'trying out Picdemi'
                      : plan.id === 'starter'
                        ? 'growing event photographers'
                        : 'high-volume pros & studios'}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-[11px] text-muted-foreground">
            Need a custom plan for large studios or organizers?{' '}
            <Link href="/contact" className="underline underline-offset-4 hover:text-foreground">
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-linear-to-br from-primary/10 via-primary/5 to-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to see your events in a new light?
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Join photographers and talents who use Picdemi to make sure great moments never get
              lost in someone&apos;s camera roll.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="group px-8 text-base">
                  Create your free account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 text-base">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
