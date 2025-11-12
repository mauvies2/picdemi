import { Facebook, Instagram, Mail, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="OceaPic"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="text-xl font-bold tracking-tight">OceaPic</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Find yourself in every moment. Connect photographers with athletes
              and event-goers.
            </p>
            <div className="flex items-center gap-4">
              <a
                // biome-ignore lint/a11y/useValidAnchor: explanation
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                // biome-ignore lint/a11y/useValidAnchor: explanation
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                // biome-ignore lint/a11y/useValidAnchor: explanation
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/signup"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
            </ul>
          </div>

          {/* For Photographers */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">For Photographers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Upload Photos
                </a>
              </li>
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Set Pricing
                </a>
              </li>
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Analytics
                </a>
              </li>
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Resources
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  // biome-ignore lint/a11y/useValidAnchor: explanation
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} OceaPic. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a
                href="mailto:hello@oceapic.com"
                className="hover:text-foreground transition-colors"
              >
                hello@oceapic.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
