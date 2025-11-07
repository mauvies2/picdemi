"use client";

import { usePathname } from "next/navigation";

export function Main({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname?.startsWith("/signup") || pathname?.startsWith("/login");
  return (
    <main className={isAuth ? "w-screen h-screen" : "px-4 max-w-[1600px]"}>
      {children}
    </main>
  );
}
