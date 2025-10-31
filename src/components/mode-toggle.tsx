"use client";

import { startTransition, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="subtle"
      size="icon"
      aria-pressed={isDark}
      className="relative h-10 w-10 overflow-hidden border border-border/60 bg-card/80 text-foreground hover:bg-card"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="sr-only">Toggle theme</span>
      <span className="relative flex h-[18px] w-[18px] items-center justify-center">
        <Sun
          aria-hidden="true"
          className={cn(
            "absolute h-[18px] w-[18px] text-amber-400 transition-all duration-300",
            isDark
              ? "scale-0 -rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          )}
        />
        <Moon
          aria-hidden="true"
          className={cn(
            "absolute h-[18px] w-[18px] text-primary transition-all duration-300",
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 rotate-90 opacity-0"
          )}
        />
      </span>
    </Button>
  );
}
