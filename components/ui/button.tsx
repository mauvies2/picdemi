"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

    const variantStyles =
      variant === "outline"
        ? "border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
        : variant === "ghost"
          ? "bg-transparent hover:bg-accent text-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary/90";

    const sizeStyles =
      size === "sm"
        ? "h-8 px-3"
        : size === "lg"
          ? "h-11 px-6 text-base"
          : "h-9 px-4";

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles, sizeStyles, className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
