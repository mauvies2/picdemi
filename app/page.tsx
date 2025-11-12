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
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section - Full Screen Height */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-2 text-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                AI-Powered Photo Discovery
              </span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
              Find Yourself in Every
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Moment
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-muted-foreground sm:text-2xl">
              OceaPic connects photographers with athletes and event-goers.
              Upload your event photos, and let AI help users find themselves
              instantly.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="group text-base px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Log In
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Instant downloads</span>
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
      <section className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              How It Works
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Simple, fast, and smart photo discovery
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-6xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1 - Photographer */}
              <div className="group relative rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:border-primary/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <div className="mt-6">
                  <span className="text-sm font-semibold text-primary">
                    Step 1
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Photographers Upload
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Upload event photos through a simple interface. Our AI
                    automatically extracts activity type, location, and date
                    metadata.
                  </p>
                </div>
              </div>

              {/* Step 2 - AI Detection */}
              <div className="group relative rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:border-primary/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div className="mt-6">
                  <span className="text-sm font-semibold text-primary">
                    Step 2
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold">
                    AI-Powered Detection
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Advanced AI recognizes faces, outfits, and bib numbers to
                    help users find themselves in photos instantly.
                  </p>
                </div>
              </div>

              {/* Step 3 - Search & Buy */}
              <div className="group relative rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:border-primary/20 sm:col-span-2 lg:col-span-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <div className="mt-6">
                  <span className="text-sm font-semibold text-primary">
                    Step 3
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Search & Purchase
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Users search by filters or upload a selfie for AI matching.
                    Select and buy photos from multiple photographers with
                    flexible pricing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features for Users */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              For Event Participants
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Find and purchase your photos in seconds
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">Smart Search</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Filter by location, activity, and date, or upload a selfie for
                  instant AI matching.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  Smart Notifications
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Get notified when new photos matching your preferences are
                  available.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">Personal Gallery</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Automatically collect detected photos and create your public
                  profile.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">Flexible Pricing</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Bundle photos from multiple photographers. Save with package
                  deals.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">Instant Download</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Get high-resolution, watermark-free photos immediately after
                  purchase.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  No Account Required
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Search and purchase without signing up. Create an account for
                  personalized features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features for Photographers */}
      <section className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              For Photographers
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Monetize your event photography effortlessly
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">Bulk Upload</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Upload hundreds of photos at once. AI automatically extracts
                  metadata.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">Set Your Pricing</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Create custom bundles (1 photo €5, 3 for €12, 5 for €15, 10
                  for €20).
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">Secure Payments</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Get paid automatically. We handle transactions with just a 10%
                  platform fee.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  Reach More Buyers
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Your photos are discoverable by AI search, reaching users you
                  never could before.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">Event Management</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Organize photos by events, locations, and dates automatically.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  Analytics & Insights
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Track sales, popular photos, and buyer engagement to grow your
                  business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Photographer Plans
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="mx-auto mt-20 grid max-w-6xl gap-8 sm:grid-cols-3">
            {/* Free Tier */}
            <div className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg">
              <h3 className="text-2xl font-bold">Free</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Perfect for getting started
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Limited monthly uploads</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Basic gallery</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Standard sales (10% fee)</span>
                </li>
              </ul>
            </div>

            {/* Amateur Tier */}
            <div className="group relative rounded-2xl border-2 border-primary bg-card p-8 shadow-lg transition-all hover:shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Popular
                </span>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Amateur</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                For active photographers
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>200GB storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Custom pricing & bundles</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Reduced platform fee</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Enhanced profile</span>
                </li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg">
              <h3 className="text-2xl font-bold">Pro</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                For professionals
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Unlimited storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Premium features & analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Priority listing</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Lowest transaction fees</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>€20/month subscription</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Join photographers and athletes already using OceaPic
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="group text-base px-8">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
