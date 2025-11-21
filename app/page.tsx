import {
  ArrowRight,
  Bell,
  Camera,
  CheckCircle2,
  CreditCard,
  Image as ImageIcon,
  MapPin,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { PricingPlanButton } from "@/components/pricing-plan-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/database/server";
import { PLANS } from "@/lib/plans";

export default async function Home() {
  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-background via-background to-primary/5">
        {/* Decorative background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                AI-powered event photo discovery for talents & creators
              </span>
            </div>

            <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Your event photos,
              <span className="block bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                found in seconds.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Captoran connects event photographers with talents and
              participants. Upload thousands of photos, and let AI help everyone
              find themselves instantly — by face, outfit, or bib number.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Link href="/signup">
                <Button size="lg" className="group px-8 text-base">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 text-base">
                  Log in
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Built for photographers & talents</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Secure payments & instant downloads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-6 w-px bg-muted-foreground/30" />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              How Captoran works
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              From upload to purchase in three simple steps.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-6xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1 - Photographer */}
              <div className="group relative rounded-2xl border bg-card p-7 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Step 1
                  </span>
                  <h3 className="mt-2 text-xl font-semibold">
                    Photographers upload
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Import hundreds or thousands of event photos with a simple
                    interface. Captoran automatically enriches them with
                    activity, location, and date metadata.
                  </p>
                </div>
              </div>

              {/* Step 2 - AI Detection */}
              <div className="group relative rounded-2xl border bg-card p-7 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Step 2
                  </span>
                  <h3 className="mt-2 text-xl font-semibold">
                    AI finds the right faces
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Our AI recognizes faces, outfits, and bib numbers so every
                    participant can quickly find their own shots — even in a sea
                    of images.
                  </p>
                </div>
              </div>

              {/* Step 3 - Search & Buy */}
              <div className="group relative rounded-2xl border bg-card p-7 shadow-sm transition-all hover:border-primary/20 hover:shadow-md sm:col-span-2 lg:col-span-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Step 3
                  </span>
                  <h3 className="mt-2 text-xl font-semibold">
                    Participants search & buy
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Athletes and attendees search by filters or upload a selfie
                    for AI matching, add their favorite images to cart, and
                    purchase securely — often from multiple photographers at
                    once.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features for Users */}
      <section className="bg-linear-to-b from-muted/30 to-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              For participants & talents
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Never lose your race photos again.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Smart search</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Filter by event, location, activity, or date — or upload a
                  selfie to let AI do the work for you.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Photo alerts</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Get notified when new photos of you are uploaded from events
                  you care about.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Personal library</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Keep every purchased photo in one place and curate a public
                  profile if you want to share your highlights.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Fair, flexible pricing
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Buy just one image or build a bundle. Mix photos from
                  different photographers in a single checkout.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Instant downloads
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Get high-resolution, watermark-free files immediately after
                  purchase — ready to post or print.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Frictionless access
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Search and buy without an account, or create one to unlock
                  saved searches and notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features for Photographers */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              For photographers & studios
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Turn your event photography into a scalable revenue stream.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Fast bulk uploads
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Drag, drop, done. Upload entire events in minutes and let
                  Captoran handle organization.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Set your own pricing
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Use default bundles to start, then create custom pricing and
                  packages as you grow.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Protected & secure
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Strong watermarking, Stripe-powered payments, and clear
                  licensing keep your work safe and your payouts predictable.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Built-in demand</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Your photos become instantly searchable for participants — no
                  more sending links one by one.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Event-first structure
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Organize by event, location, and date automatically — so you
                  stay focused on shooting, not sorting.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Analytics that matter
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  See which events, activities, and photos convert best so you
                  can double down on what works.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-linear-to-b from-muted/20 via-background to-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Pricing for every stage of your creative journey
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Start free, then upgrade when you&apos;re ready. No long-term
              contracts, cancel anytime.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const isFree = plan.id === "free";
              const isPopular = plan.popular;

              return (
                <div
                  key={plan.id}
                  className={[
                    "relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200",
                    "hover:-translate-y-[2px] hover:border-primary/40 hover:shadow-md",
                    isPopular &&
                      "sm:-mt-2 bg-linear-to-b from-primary/5 to-card ring-1 ring-primary/40 ring-offset-1 ring-offset-background shadow-lg",
                  ]
                    .filter(Boolean)
                    .join(" ")}
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      {plan.description}
                    </p>

                    <div className="mt-3 flex items-baseline gap-2">
                      {plan.price !== null ? (
                        <>
                          <span className="text-3xl font-semibold">
                            ${plan.price}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /month
                          </span>
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
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 leading-relaxed"
                      >
                        <div className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[13px]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <PricingPlanButton
                      planId={plan.id}
                      isFree={isFree}
                      isAuthenticated={isAuthenticated}
                    />
                  </div>

                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Best for{" "}
                    {plan.id === "free"
                      ? "trying out Captoran"
                      : plan.id === "amateur"
                        ? "growing event photographers"
                        : "high-volume pros & studios"}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-[11px] text-muted-foreground">
            Need a custom plan for large studios or organizers?{" "}
            <Link
              href="/contact"
              className="underline underline-offset-4 hover:text-foreground"
            >
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
              Join photographers and talents who use Captoran to make sure great
              moments never get lost in someone&apos;s camera roll.
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
