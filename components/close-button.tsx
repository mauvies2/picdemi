"use client";

import { useRouter, usePathname } from "next/navigation";

export function CloseButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Redirect to /login for reset password page, otherwise to home
  const handleClick = () => {
    if (pathname?.startsWith("/auth/reset-password")) {
      router.push("/login");
    } else {
      router.push("/");
    }
  };

  return (
    <button
      type="button"
      aria-label="Close"
      onClick={handleClick}
      className={`inline-flex h-9 w-9 items-center justify-center text-foreground/70 hover:text-foreground/60 transition-colors ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
