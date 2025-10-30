import type { ReactNode } from "react";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative sticky top-0 z-40 overflow-hidden border-b border-[hsla(var(--border)_/_0.7)] bg-[hsla(var(--surface-1)_/_0.92)] shadow-[0_16px_40px_-26px_rgba(19,36,92,0.35)] backdrop-blur supports-[backdrop-filter]:bg-[hsla(var(--surface-1)_/_0.75)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_top,_rgba(128,152,255,0.22)_0%,_transparent_58%)] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[hsla(var(--foreground)_/_0.06)] dark:border-white/5 dark:bg-[hsla(var(--surface-1)_/_0.6)] dark:shadow-[0_12px_32px_-12px_rgba(10,17,34,0.85)] dark:supports-[backdrop-filter]:bg-[hsla(var(--surface-1)_/_0.3)] dark:before:bg-[radial-gradient(circle_at_top,_rgba(110,140,255,0.18)_0%,_transparent_65%)] dark:after:bg-white/10">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              P
            </span>
            <div className="flex flex-col leading-none">
              <span>Promptr</span>
              <span className="text-xs text-muted-foreground">
                Prompt workflows, versioned.
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>
      <Separator className="opacity-0" />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
