import type { ReactNode } from "react";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-semibold text-foreground transition hover:text-primary"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              P
            </span>
            <div className="flex flex-col leading-tight">
              <span>Promptr</span>
              <span className="text-xs font-medium text-muted-foreground">
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
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <Toaster />
    </div>
  );
}
