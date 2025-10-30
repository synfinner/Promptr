"use client";

import { diffWords } from "diff";
import Link from "next/link";
import { useState } from "react";

import { AddCommentForm } from "@/components/prompts/add-comment-form";
import { CreateRevisionSheet } from "@/components/prompts/create-revision-sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { fetchPromptDetails } from "@/server/queries";

type PromptData = NonNullable<
  Awaited<ReturnType<typeof fetchPromptDetails>>
>;

type PromptDetailClientProps = {
  prompt: PromptData;
  selectedRevisionId: string;
  defaultCompareRevisionId: string | null;
};

type DiffToken = {
  id: string;
  type: "added" | "removed" | "unchanged";
  value: string;
};

type DiffLine = {
  id: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  tokens: DiffToken[];
  hasAddition: boolean;
  hasRemoval: boolean;
};

export function PromptDetailClient({
  prompt,
  selectedRevisionId,
  defaultCompareRevisionId,
}: PromptDetailClientProps) {
  const revisions = prompt.revisions;

  const selectedRevision =
    revisions.find((revision) => revision.id === selectedRevisionId) ??
    revisions[0];

  const [viewMode, setViewMode] = useState<"diff" | "raw">("raw");
  const [compareRevisionId, setCompareRevisionId] = useState<string | null>(
    defaultCompareRevisionId
  );

  const compareRevision =
    compareRevisionId &&
    revisions.find((revision) => revision.id === compareRevisionId)
      ? revisions.find((revision) => revision.id === compareRevisionId)
      : findPreviousRevision(revisions, selectedRevision);

  const diffWithLineNumbers = buildWordDiffLines(
    compareRevision?.content ?? "",
    selectedRevision.content
  );

  const formattedUpdatedAt = new Date(prompt.updatedAt).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

  const metadata: { label: string; value: string }[] = [
    {
      label: "Model",
      value: prompt.model ?? "—",
    },
    {
      label: "Project",
      value: prompt.project?.name ?? "Unknown",
    },
    {
      label: "Latest Update",
      value: formattedUpdatedAt,
    },
    {
      label: "Total Revisions",
      value: revisions.length.toString(),
    },
  ];

  return (
    <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="flex min-h-[480px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-[0_45px_110px_-70px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_55px_140px_-72px_rgba(2,8,23,0.9)] md:min-h-[560px]">
        <CardHeader className="space-y-6 border-b border-white/50 bg-white/96 pb-8 dark:border-white/10 dark:bg-slate-900/75">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary dark:border-primary/50 dark:bg-primary/25 dark:text-white">
                {prompt.promptType.toLowerCase()}
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  {prompt.title}
                </CardTitle>
                {prompt.summary ? (
                  <p className="max-w-2xl text-sm text-muted-foreground/90">
                    {prompt.summary}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center">
              <CreateRevisionSheet
                promptId={prompt.id}
                currentContent={selectedRevision.content}
              />
            </div>
          </div>
          <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            {metadata.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/55 bg-white/88 px-4 py-3 shadow-[0_12px_32px_-32px_rgba(15,23,42,0.2)] transition dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_16px_40px_-30px_rgba(2,8,23,0.6)]"
              >
                <dt className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-foreground dark:text-white">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
          <RevisionMeta
            revision={selectedRevision}
            compareRevision={compareRevision}
            onChangeCompare={setCompareRevisionId}
            revisions={revisions}
          />
        </CardHeader>
        <CardContent className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "diff" | "raw")}
            className="space-y-6"
          >
            <TabsList className="inline-flex w-full flex-wrap items-center justify-start gap-2 rounded-2xl border border-white/55 bg-white/85 p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.08] sm:w-auto sm:flex-nowrap sm:rounded-full sm:gap-1">
              <TabsTrigger
                value="raw"
                className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_16px_35px_-25px_rgba(99,102,241,0.6)]"
              >
                Raw prompt
              </TabsTrigger>
              <TabsTrigger
                value="diff"
                className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_16px_35px_-25px_rgba(99,102,241,0.6)]"
              >
                Diff view
              </TabsTrigger>
            </TabsList>
            <TabsContent value="diff" className="space-y-4 focus-visible:outline-none">
              <DiffView
                lines={diffWithLineNumbers}
                selectedRevision={selectedRevision}
                compareRevision={compareRevision}
              />
            </TabsContent>
            <TabsContent value="raw" className="focus-visible:outline-none">
              <RawView content={selectedRevision.content} />
            </TabsContent>
          </Tabs>
          <CommentsSection revision={selectedRevision} />
        </CardContent>
      </Card>
      <div className="w-full 2xl:w-[320px] 2xl:flex-shrink-0">
        <RevisionTimeline
          prompt={prompt}
          revisions={revisions}
          selectedRevisionId={selectedRevision.id}
          onSelectCompare={(revisionId) => setCompareRevisionId(revisionId)}
          compareRevisionId={compareRevision?.id ?? null}
        />
      </div>
    </div>
  );
}

function RevisionTimeline({
  prompt,
  revisions,
  selectedRevisionId,
  onSelectCompare,
  compareRevisionId,
}: {
  prompt: PromptData;
  revisions: PromptData["revisions"];
  selectedRevisionId: string;
  onSelectCompare: (id: string | null) => void;
  compareRevisionId: string | null;
}) {
  return (
    <Card className="h-fit rounded-3xl border border-white/70 bg-white/75 shadow-[0_40px_110px_-65px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:shadow-[0_45px_120px_-70px_rgba(2,8,23,0.85)] xl:sticky xl:top-8">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Revision History
        </CardTitle>
        <p className="text-xs text-muted-foreground/90">
          Select a version to inspect and optionally compare
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px] px-4 pb-2 sm:h-[420px] xl:h-[640px] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
          <div className="space-y-3 pb-5 pt-3">
            {revisions.map((revision) => {
              const isActive = revision.id === selectedRevisionId;
              const isCompare = revision.id === compareRevisionId;
              const isDisabled = revision.id === selectedRevisionId;

              return (
                <div
                  key={revision.id}
                  className={cn(
                    "rounded-2xl border border-transparent bg-white/55 p-3 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.25)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-border/60 hover:bg-white/85 dark:bg-slate-900/55 dark:hover:border-white/10 dark:hover:bg-slate-900/75",
                    isActive
                      ? "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_20px_50px_-32px_rgba(73,103,214,0.6)] dark:bg-primary/15"
                      : ""
                  )}
                >
                  <Link
                    href={`/?project=${prompt.projectId}&prompt=${prompt.id}&revision=${revision.id}`}
                    className="flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold leading-tight">
                        v{revision.version}
                      </span>
                      <span className="text-xs text-muted-foreground/80">
                        {new Date(revision.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {revision.changeLog ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground/90">
                        {revision.changeLog}
                      </p>
                    ) : null}
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      disabled={isDisabled}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold transition",
                        isCompare
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:bg-muted/60",
                        isDisabled &&
                          "cursor-not-allowed opacity-50"
                      )}
                      onClick={() => {
                        if (isDisabled) return;
                        onSelectCompare(isCompare ? null : revision.id);
                      }}
                    >
                      {isDisabled
                        ? "Active"
                        : isCompare
                          ? "Comparing"
                          : "Compare"}
                    </button>
                    <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-medium text-muted-foreground dark:bg-white/[0.08]">
                      {revision.comments.length} 💬
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function RevisionMeta({
  revision,
  compareRevision,
  revisions,
  onChangeCompare,
}: {
  revision: PromptData["revisions"][number];
  compareRevision: PromptData["revisions"][number] | undefined;
  revisions: PromptData["revisions"];
  onChangeCompare: (id: string | null) => void;
}) {
  const createdLabel = new Date(revision.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/65 px-4 py-4 text-sm text-muted-foreground shadow-[0_12px_34px_-26px_rgba(15,23,42,0.25)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_16px_42px_-32px_rgba(2,8,23,0.6)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-primary/30 bg-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary dark:border-primary/50 dark:bg-primary/20 dark:text-white">
          v{revision.version}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/80">
          <span className="font-medium text-foreground dark:text-white">
            Viewing version {revision.version}
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span>Created {createdLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
          Compare to
        </span>
        <Select
          value={compareRevision?.id ?? "previous"}
          onValueChange={(value) =>
            onChangeCompare(value === "previous" ? null : value)
          }
        >
          <SelectTrigger
            aria-label="Select revision to compare against"
            className="h-9 min-w-[11rem] rounded-full border border-white/60 bg-white/90 px-3 text-sm font-medium text-foreground shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
          >
            <SelectValue placeholder="Previous revision" />
          </SelectTrigger>
          <SelectContent
            align="end"
            className="rounded-xl border border-border bg-background/95 p-1 text-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85 dark:border-white/10 dark:bg-background/90"
          >
            <SelectItem value="previous">Previous revision</SelectItem>
            {revisions
              .filter((rev) => rev.id !== revision.id)
              .map((rev) => (
                <SelectItem key={rev.id} value={rev.id}>
                  Version {rev.version}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DiffView({
  lines,
  selectedRevision,
  compareRevision,
}: {
  lines: DiffLine[];
  selectedRevision: PromptData["revisions"][number];
  compareRevision: PromptData["revisions"][number] | undefined;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground/90">
        <span className="font-medium text-foreground dark:text-white">
          Comparing version {selectedRevision.version} with{" "}
          {compareRevision
            ? `version ${compareRevision.version}`
            : "previous snapshot"}
        </span>
      </div>
      {lines.length === 0 ? (
        <div className="rounded-2xl border border-white/55 bg-white/92 p-5 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/10 dark:bg-white/[0.05] dark:text-muted-foreground">
          No differences detected.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/55 bg-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <ScrollArea className="max-h-[60vh] [mask-image:linear-gradient(to_bottom,transparent,black_1%,black_99%,transparent)] sm:max-h-[70vh] lg:h-[600px]">
            <div>
              <div className="sticky top-0 z-10 hidden grid-cols-[3.5rem,3.5rem,1fr] bg-white/95 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 backdrop-blur-sm dark:bg-slate-900/80 md:grid">
                <span className="text-right">Old</span>
                <span className="text-right">New</span>
                <span>Diff</span>
              </div>
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={cn(
                    "grid grid-cols-[3.5rem,3.5rem,1fr] border-b border-white/60 bg-white/55 transition last:border-b-0 dark:border-white/5 dark:bg-white/[0.05]",
                    line.hasAddition &&
                      !line.hasRemoval &&
                      "bg-emerald-400/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
                    line.hasRemoval &&
                      !line.hasAddition &&
                      "bg-rose-400/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200"
                  )}
                >
                  <div className="select-none border-r border-white/60 px-3 py-1.5 text-right text-[11px] font-semibold text-muted-foreground/80 dark:border-white/10 dark:text-muted-foreground/70">
                    {line.oldLineNumber ?? ""}
                  </div>
                  <div className="select-none border-r border-white/60 px-3 py-1.5 text-right text-[11px] font-semibold text-muted-foreground/80 dark:border-white/10 dark:text-muted-foreground/70">
                    {line.newLineNumber ?? ""}
                  </div>
                  <pre className="whitespace-pre-wrap px-4 py-1.5 font-mono text-[13px] leading-relaxed text-foreground/90 dark:text-white">
                    {line.tokens.length ? (
                      line.tokens.map((token) => (
                        <span
                          key={token.id}
                          className={cn(
                            token.type === "added" &&
                              "rounded bg-emerald-400/20 px-1 text-emerald-700 dark:bg-emerald-400/25 dark:text-emerald-100",
                            token.type === "removed" &&
                              "rounded bg-rose-400/20 px-1 text-rose-700 line-through dark:bg-rose-400/25 dark:text-rose-100"
                          )}
                        >
                          {token.value || " "}
                        </span>
                      ))
                    ) : (
                      " "
                    )}
                  </pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function RawView({ content }: { content: string }) {
  // Normalize line endings to prevent hydration errors
  const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedContent.split("\n");
  
  return (
    <div className="overflow-hidden rounded-2xl border border-white/55 bg-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <ScrollArea className="max-h-[60vh] [mask-image:linear-gradient(to_bottom,transparent,black_1%,black_99%,transparent)] sm:max-h-[70vh] lg:h-[600px]">
        <div>
          {lines.map((line, index) => (
            <div
              key={`line-${index}`}
              className="grid grid-cols-[3.5rem,1fr] border-b border-white/60 bg-white/55 transition hover:bg-white/80 last:border-b-0 dark:border-white/5 dark:bg-white/[0.05] dark:hover:bg-white/[0.1]"
            >
              <div className="select-none border-r border-white/60 bg-white/70 px-3 py-1.5 text-right text-[11px] font-semibold text-muted-foreground/80 dark:border-white/10 dark:bg-white/[0.08]">
                {index + 1}
              </div>
              <pre className="whitespace-pre-wrap px-4 py-1.5 font-mono text-[13px] leading-relaxed text-foreground/90 dark:text-white">
                {line || " "}
              </pre>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function CommentsSection({
  revision,
}: {
  revision: PromptData["revisions"][number];
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-white/55 bg-white/88 p-5 shadow-[0_10px_30px_-32px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Discussion
        </h3>
        <p className="text-sm text-muted-foreground">
          Annotate this revision with insights or open questions for your team.
        </p>
      </div>
      <div className="space-y-3">
        {revision.comments.length ? (
          revision.comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-white/60 bg-white/90 p-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Line {comment.lineNumber ?? "—"} •{" "}
                  {new Date(comment.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                {comment.resolved ? (
                  <Badge variant="outline" className="rounded-full border border-emerald-500/40 bg-emerald-500/10 text-[10px] uppercase tracking-wide text-emerald-600 dark:border-emerald-400/50 dark:bg-emerald-500/15 dark:text-emerald-200">
                    Resolved
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground dark:text-white">
                {comment.body}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No comments yet. Share what worked or what to try next.
          </p>
        )}
      </div>
      <AddCommentForm revisionId={revision.id} />
    </div>
  );
}

function buildWordDiffLines(
  previous: string,
  current: string
): DiffLine[] {
  const normalizedPrevious = previous.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const normalizedCurrent = current.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const changes = diffWords(normalizedPrevious, normalizedCurrent);
  const lines: DiffLine[] = [];
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let lineIndex = 0;

  const createLine = () => ({
    id: `line-${lineIndex}`,
    oldLineNumber: null as number | null,
    newLineNumber: null as number | null,
    tokens: [] as DiffToken[],
    hasAddition: false,
    hasRemoval: false,
  });

  let currentLine = createLine();

  const pushCurrentLine = () => {
    if (
      currentLine.tokens.length === 0 &&
      currentLine.oldLineNumber === null &&
      currentLine.newLineNumber === null
    ) {
      lineIndex += 1;
      currentLine = createLine();
      return;
    }

    const lineHasOldContent = currentLine.tokens.some(
      (token) => token.type !== "added"
    );
    const lineHasNewContent = currentLine.tokens.some(
      (token) => token.type !== "removed"
    );

    lines.push(currentLine);

    if (lineHasOldContent) {
      oldLineNumber += 1;
    }
    if (lineHasNewContent) {
      newLineNumber += 1;
    }

    lineIndex += 1;
    currentLine = createLine();
  };

  changes.forEach((change, changeIndex) => {
    const type = change.added
      ? "added"
      : change.removed
        ? "removed"
        : "unchanged";

    const parts = change.value.split("\n");

    parts.forEach((part, partIndex) => {
      const isLastPart = partIndex === parts.length - 1;
      if (isLastPart && part === "") {
        return;
      }

      if (type !== "added") {
        currentLine.oldLineNumber ??= oldLineNumber;
      }
      if (type !== "removed") {
        currentLine.newLineNumber ??= newLineNumber;
      }
      if (type === "added") {
        currentLine.hasAddition = true;
      }
      if (type === "removed") {
        currentLine.hasRemoval = true;
      }

      currentLine.tokens.push({
        id: `${changeIndex}-${partIndex}-${currentLine.tokens.length}`,
        type,
        value: part,
      });

      if (!isLastPart) {
        pushCurrentLine();
      }
    });
  });

  if (
    currentLine.tokens.length ||
    currentLine.oldLineNumber !== null ||
    currentLine.newLineNumber !== null
  ) {
    pushCurrentLine();
  }

  return lines;
}

function findPreviousRevision(
  revisions: PromptData["revisions"],
  current: PromptData["revisions"][number]
) {
  const currentIndex = revisions.findIndex((rev) => rev.id === current.id);
  return currentIndex >= 0 ? revisions[currentIndex + 1] : undefined;
}
