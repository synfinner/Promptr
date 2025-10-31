"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deletePromptAction } from "@/app/(app)/actions";
import { CreatePromptDialog } from "@/components/prompts/create-prompt-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type PromptSummary = {
  id: string;
  title: string;
  projectId: string;
  promptType: string;
  model: string | null;
  summary: string | null;
  updatedAt: string;
  revisions: {
    id: string;
    version: number;
    createdAt: string;
    changeLog: string | null;
  }[];
};

type PromptListProps = {
  projectId?: string | null;
  prompts: PromptSummary[];
  selectedPromptId?: string | null;
  className?: string;
};

export function PromptList({
  projectId,
  prompts,
  selectedPromptId,
  className,
}: PromptListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [optimisticPrompts, removePromptOptimistic] = useOptimistic(
    prompts,
    (
      currentPrompts: PromptSummary[],
      promptId: string
    ): PromptSummary[] => currentPrompts.filter((prompt) => prompt.id !== promptId)
  );
  const [isPending, startTransition] = useTransition();

  const hasPrompts = optimisticPrompts.length > 0;

  const handleDeletePrompt = (prompt: PromptSummary) => {
    const confirmed = window.confirm(
      `Delete prompt “${prompt.title}”? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    startTransition(() => {
      removePromptOptimistic(prompt.id);
      setPendingId(prompt.id);

      void (async () => {
        const result = await deletePromptAction({
          promptId: prompt.id,
          projectId: prompt.projectId,
        });

        if (result?.error) {
          toast({
            title: "Prompt was not deleted",
            description: result.error,
            variant: "destructive",
          });
        } else {
          toast({
            title: result?.success ?? "Prompt deleted.",
          });
        }

        router.refresh();
        setPendingId(null);
      })();
    });
  };

  return (
    <Card
      className={cn(
        "flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-md shadow-black/5 supports-[backdrop-filter]:backdrop-blur-md transition-colors dark:shadow-none",
        className
      )}
    >
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Prompts
          </CardTitle>
          {projectId ? <CreatePromptDialog projectId={projectId} /> : null}
        </div>
        <p className="text-xs text-muted-foreground/90">
          Track each prompt&apos;s evolution and pick up where you left off faster.
        </p>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        {hasPrompts ? (
          <ScrollArea className="relative h-full px-4">
            <div className="space-y-3 pb-4 pt-3">
              {optimisticPrompts.map((prompt) => {
                const isActive = prompt.id === selectedPromptId;
                const isDeleting = pendingId === prompt.id && isPending;
                const latest = prompt.revisions[0];

                return (
                  <article
                    key={prompt.id}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-transparent bg-card/70 p-4 shadow-sm shadow-black/5 transition hover:-translate-y-[1px] hover:border-border/80 hover:bg-card focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                      isActive
                        ? "border-primary/70 bg-primary/10 text-primary"
                        : ""
                    )}
                  >
                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/?project=${prompt.projectId}&prompt=${prompt.id}`}
                            className="text-sm font-semibold leading-tight tracking-tight text-foreground transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            {prompt.title}
                          </Link>
                          <Badge
                            variant="secondary"
                            className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                          >
                            {prompt.promptType.toLowerCase()}
                          </Badge>
                        </div>
                        {prompt.summary ? (
                          <p className="text-xs text-muted-foreground">
                            {prompt.summary}
                          </p>
                        ) : null}
                        {prompt.model ? (
                          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Model ·{" "}
                            <span className="font-semibold text-foreground normal-case">
                              {prompt.model}
                            </span>
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeletePrompt(prompt);
                        }}
                        disabled={isDeleting}
                        className={cn(
                          "relative z-20 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/80 transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          "opacity-0 group-hover:opacity-100",
                          isDeleting && "opacity-100"
                        )}
                        aria-label={`Delete prompt ${prompt.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    {latest ? (
                      <Link
                        href={`/?project=${prompt.projectId}&prompt=${prompt.id}&revision=${latest.id}`}
                        className="relative z-10 mt-3 block rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground transition hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <div className="flex items-center justify-between text-foreground/80">
                          <span>Version {latest.version}</span>
                          <span>
                            {new Date(latest.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {latest.changeLog ? (
                          <>
                            <Separator className="my-2 opacity-40" />
                            <p className="line-clamp-2 text-foreground/80">
                              {latest.changeLog}
                            </p>
                          </>
                        ) : null}
                      </Link>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <EmptyState projectId={projectId} />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  projectId,
}: {
  projectId?: string | null;
}) {
  if (!projectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
        Select a project to view its prompts.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">
        No prompts yet. Create one to capture your first draft.
      </p>
      <CreatePromptDialog projectId={projectId} />
    </div>
  );
}
