import Link from "next/link";

import { CreatePromptDialog } from "@/components/prompts/create-prompt-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  const hasPrompts = prompts.length > 0;

  return (
    <Card
      className={cn(
        "flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-slate-900/65 dark:shadow-[0_35px_90px_-55px_rgba(2,8,23,0.85)]",
        className,
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
      <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
        {hasPrompts ? (
          <ScrollArea className="relative h-full px-4 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
            <div className="space-y-3 pb-6 pt-3">
              {prompts.map((prompt) => {
                const isActive = prompt.id === selectedPromptId;
                const latest = prompt.revisions[0];

                return (
                  <Link
                    key={prompt.id}
                    href={`/?project=${prompt.projectId}&prompt=${prompt.id}`}
                    className={cn(
                      "group relative block rounded-2xl border border-white/40 bg-white/50 p-3 text-left shadow-[0_20px_45px_-36px_rgba(15,23,42,0.35)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-white/80 hover:bg-white/85 hover:shadow-[0_26px_55px_-40px_rgba(73,93,182,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/10 dark:bg-slate-900/55 dark:shadow-[0_20px_50px_-38px_rgba(7,11,22,0.9)] dark:hover:border-white/20 dark:hover:bg-slate-900/80 dark:hover:shadow-[0_26px_60px_-40px_rgba(28,45,94,0.75)]",
                      isActive
                        ? "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_24px_60px_-36px_rgba(73,103,214,0.6)] dark:bg-primary/15 dark:shadow-[0_0_0_1px_rgba(99,102,241,0.45),0_24px_60px_-36px_rgba(38,73,199,0.75)]"
                        : ""
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-1 flex-col">
                        <span className="font-semibold leading-tight tracking-tight">
                          {prompt.title}
                        </span>
                        {prompt.summary ? (
                          <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {prompt.summary}
                          </span>
                        ) : null}
                        {prompt.model ? (
                          <span className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                            Model ·{" "}
                            <span className="font-semibold text-foreground normal-case dark:text-white">
                              {prompt.model}
                            </span>
                          </span>
                        ) : null}
                      </div>
                      <Badge
                        variant="outline"
                        className="border-primary/40 bg-primary/15 uppercase tracking-wide text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-200 ease-out group-hover:border-primary/60 group-hover:bg-primary/25 group-hover:text-primary dark:border-primary/50 dark:bg-primary/30 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      >
                        {prompt.promptType.toLowerCase()}
                      </Badge>
                    </div>
                    {latest ? (
                      <div className="mt-3 rounded-xl bg-[hsla(var(--surface-3)_/_0.55)] px-3 py-2 text-xs text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:bg-white/5 dark:text-muted-foreground dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <div className="flex items-center justify-between">
                          <span>Version {latest.version}</span>
                          <span>
                            {new Date(latest.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {latest.changeLog ? (
                          <Separator className="my-2 opacity-40" />
                        ) : null}
                        {latest.changeLog ? (
                          <p className="line-clamp-2">{latest.changeLog}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </Link>
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
