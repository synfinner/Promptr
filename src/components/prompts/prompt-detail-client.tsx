"use client";

import { diffWords } from "diff";
import {
  ChevronRight,
  Clock3,
  Cpu,
  FileText,
  Folder,
  GitCompare,
  Layers,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { AddCommentForm } from "@/components/prompts/add-comment-form";
import { CreateRevisionSheet } from "@/components/prompts/create-revision-sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
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

  const [viewMode, setViewMode] = useState<"raw" | "diff">("raw");
  const [compareRevisionId, setCompareRevisionId] = useState<string | null>(
    defaultCompareRevisionId
  );
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const compareRevision =
    compareRevisionId &&
    revisions.find((revision) => revision.id === compareRevisionId)
      ? revisions.find((revision) => revision.id === compareRevisionId)
      : findPreviousRevision(revisions, selectedRevision);

  const diffWithLineNumbers = useMemo(
    () =>
      buildWordDiffLines(
        compareRevision?.content ?? "",
        selectedRevision.content
      ),
    [compareRevision?.content, selectedRevision.content]
  );

  const formattedUpdatedAt = new Date(prompt.updatedAt).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

  const metadata: {
    label: string;
    value: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "Model",
      value: prompt.model ?? "—",
      icon: Cpu,
    },
    {
      label: "Project",
      value: prompt.project?.name ?? "Unknown",
      icon: Folder,
    },
    {
      label: "Latest Update",
      value: formattedUpdatedAt,
      icon: Clock3,
    },
    {
      label: "Total Revisions",
      value: revisions.length.toString(),
      icon: Layers,
    },
  ];

  const breadcrumbs = [
    {
      label: "Projects",
      href: "/",
    },
    {
      label: prompt.project?.name ?? "Project",
      href: `/?project=${prompt.projectId}`,
    },
    {
      label: prompt.title,
      href: `/?project=${prompt.projectId}&prompt=${prompt.id}`,
    },
    {
      label: `v${selectedRevision.version}`,
      href: undefined,
    },
  ];

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    },
    []
  );

  async function handleCopyRawPrompt() {
    if (!navigator?.clipboard?.writeText) {
      console.error("Clipboard API not available");
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedRevision.content);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed", error);
    }
  }

  return (
    <Tabs
      value={viewMode}
      onValueChange={(value) => setViewMode(value as "raw" | "diff")}
      className="flex min-h-0 flex-col"
    >
      <div className="grid min-h-0 w-full grid-cols-1 gap-6 pt-4 md:pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-8">
        <div className="flex min-h-0 flex-col">
          <div className="flex-1 pr-1 pb-10">
            <div className="flex flex-col gap-6">
              <Card className="relative flex flex-col rounded-3xl border border-border/70 bg-card/95 shadow-lg shadow-black/5">
                <CardHeader className="space-y-3 border-b border-border/60 px-6 py-6 md:py-7">
                  <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
                    <div className="space-y-3">
                      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground">
                        {breadcrumbs.map((crumb, index) => {
                          const isLast = index === breadcrumbs.length - 1;
                          const key = `${crumb.label}-${index}`;
                          const content =
                            crumb.href && !isLast ? (
                              <Link
                                href={crumb.href}
                                className="flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
                              >
                                {crumb.label}
                              </Link>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                                {crumb.label}
                              </span>
                            );

                          return (
                            <div
                              key={key}
                              className={cn(
                                "flex items-center gap-1",
                                isLast && "text-foreground"
                              )}
                            >
                              {content}
                              {!isLast ? (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                              ) : null}
                            </div>
                          );
                        })}
                      </nav>
                      <div className="space-y-3">
                        <Badge
                          variant="outline"
                          className="rounded-full border-primary/50 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary"
                        >
                          {prompt.promptType.toLowerCase()}
                        </Badge>
                        <div className="space-y-1.5">
                          <CardTitle className="text-2xl font-semibold tracking-tight">
                            {prompt.title}
                          </CardTitle>
                          {prompt.summary ? (
                            <p className="max-w-2xl text-base leading-snug text-muted-foreground">
                              {prompt.summary}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <TabsList className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 p-1 shadow-sm shadow-black/5">
                        <TabsTrigger
                          value="raw"
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                        >
                          <FileText className="h-4 w-4" aria-hidden="true" />
                          Raw prompt
                        </TabsTrigger>
                        <TabsTrigger
                          value="diff"
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                        >
                          <GitCompare className="h-4 w-4" aria-hidden="true" />
                          Diff view
                        </TabsTrigger>
                      </TabsList>
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 rounded-full px-4"
                        onClick={handleCopyRawPrompt}
                      >
                        {copied ? "Copied!" : "Copy Raw Prompt"}
                      </Button>
                      <CreateRevisionSheet
                        promptId={prompt.id}
                        currentContent={selectedRevision.content}
                      />
                    </div>
                  </div>
                  <dl className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    {metadata.map((item) => (
                      <div key={item.label} className="flex flex-col gap-1">
                        <dt className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                          <item.icon className="h-3.5 w-3.5 text-primary" />
                          {item.label}
                        </dt>
                        <dd className="text-sm font-medium text-foreground leading-tight">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardHeader>
                <CardContent className="space-y-4 px-6 py-5">
                  <RevisionMeta
                    revision={selectedRevision}
                    compareRevision={compareRevision}
                    onChangeCompare={setCompareRevisionId}
                    revisions={revisions}
                  />
                </CardContent>
              </Card>
              <section className="space-y-6">
                <TabsContent
                  value="raw"
                  className="focus-visible:outline-none [&[data-state=inactive]]:hidden"
                >
                  <RawView content={selectedRevision.content} />
                </TabsContent>
                <TabsContent
                  value="diff"
                  className="focus-visible:outline-none [&[data-state=inactive]]:hidden"
                >
                  <DiffView
                    lines={diffWithLineNumbers}
                    selectedRevision={selectedRevision}
                    compareRevision={compareRevision}
                  />
                </TabsContent>
                <div className="border-t border-border/40 pt-6">
                  <RevisionTimeline
                    prompt={prompt}
                    revisions={revisions}
                    selectedRevisionId={selectedRevision.id}
                    onSelectCompare={(revisionId) =>
                      setCompareRevisionId(revisionId)
                    }
                    compareRevisionId={compareRevision?.id ?? null}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
        <aside className="flex h-full min-h-0 flex-col">
          <CollaborationPanel revision={selectedRevision} />
        </aside>
      </div>
    </Tabs>
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
    <Card className="flex flex-col rounded-3xl border border-border/70 bg-card/95 shadow-lg shadow-black/5">
      <div className="flex flex-1 flex-col min-h-0">
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background/90 px-5 py-4 backdrop-blur-sm">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Revision history
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Jump between versions and select one to compare or review.
          </p>
        </div>
        <div className="flex-1 px-4 py-3 pb-6 shadow-inner">
          <div className="space-y-2">
            {revisions.map((revision) => {
              const isActive = revision.id === selectedRevisionId;
              const isCompare = revision.id === compareRevisionId;
              const isDisabled = revision.id === selectedRevisionId;

              return (
                <div
                  key={revision.id}
                  className={cn(
                    "rounded-xl border border-transparent bg-card/70 px-3 py-2 text-sm transition hover:border-border/70 hover:bg-muted/60",
                    isActive &&
                      "border-primary/70 bg-primary/15 text-primary",
                    !isActive &&
                      isCompare &&
                      "border-primary/50 bg-primary/10 text-primary"
                  )}
                >
                  <Link
                    href={`/?project=${prompt.projectId}&prompt=${prompt.id}&revision=${revision.id}`}
                    className="flex flex-col gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold leading-tight">
                        v{revision.version}
                      </span>
                      <span className="text-xs text-muted-foreground/70">
                        {new Date(revision.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {revision.changeLog ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {revision.changeLog}
                      </p>
                    ) : null}
                  </Link>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground/80">
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        onSelectCompare(isCompare ? null : revision.id);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition",
                        isCompare && !isDisabled
                          ? "bg-primary/20 text-primary"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                        isDisabled &&
                          "cursor-not-allowed bg-transparent text-muted-foreground/80 opacity-60"
                      )}
                    >
                      <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
                      {isDisabled
                        ? "Active"
                        : isCompare
                          ? "Comparing"
                          : "Compare"}
                    </button>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      {revision.comments.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CollaborationPanel({
  revision,
}: {
  revision: PromptData["revisions"][number];
}) {
  return (
    <Card className="flex flex-col rounded-3xl border border-border/60 bg-muted/30 shadow-lg shadow-black/5 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="border-b border-border/50 bg-background/70 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
          Collaboration
        </p>
        <h3 className="text-base font-semibold text-foreground">
          Discussion for current revision
        </h3>
      </div>
      <div className="flex-1 px-6 py-5">
        <CommentsSection revision={revision} />
      </div>
      <div className="border-t border-border/50 bg-background/95 px-6 py-4">
        <AddCommentForm revisionId={revision.id} />
      </div>
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
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-4 text-sm text-muted-foreground supports-[backdrop-filter]:backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          v{revision.version}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
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
            className="h-9 min-w-[11rem] rounded-full border border-border/70 bg-card/80 px-3 text-sm font-medium text-foreground transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SelectValue placeholder="Previous revision" />
          </SelectTrigger>
          <SelectContent
            align="end"
            className="rounded-xl border border-border bg-card/95 p-1 text-foreground shadow-lg supports-[backdrop-filter]:backdrop-blur-sm"
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
        <span className="font-medium text-foreground">
          Comparing version {selectedRevision.version} with{" "}
          {compareRevision
            ? `version ${compareRevision.version}`
            : "previous snapshot"}
        </span>
      </div>
      {lines.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
          No differences detected.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-sm shadow-black/5">
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 z-10 hidden grid-cols-[3.5rem,3.5rem,1fr] bg-card/95 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 backdrop-blur-sm md:grid">
              <span className="text-right">Prev</span>
              <span className="text-right">Next</span>
              <span>Changes</span>
            </div>
            {lines.map((line) => (
              <div
                key={line.id}
                className={cn(
                  "grid grid-cols-[3.5rem,3.5rem,1fr] border-b border-border/60 border-l-2 border-l-transparent bg-card/80 transition last:border-b-0",
                  line.hasAddition &&
                    line.hasRemoval &&
                    "border-l-amber-400 dark:border-l-amber-300",
                  line.hasAddition &&
                    !line.hasRemoval &&
                    "border-l-emerald-500 dark:border-l-emerald-400",
                  line.hasRemoval &&
                    !line.hasAddition &&
                    "border-l-rose-500 dark:border-l-rose-400"
                )}
              >
                <div className="select-none border-r border-border/60 px-3 py-1.5 text-right text-[11px] font-semibold text-muted-foreground/80">
                  {line.oldLineNumber ?? ""}
                </div>
                <div className="select-none border-r border-border/60 px-3 py-1.5 text-right text-[11px] font-semibold text-muted-foreground/80">
                  {line.newLineNumber ?? ""}
                </div>
                <pre className="whitespace-pre-wrap px-4 py-1.5 font-mono text-[13px] leading-relaxed text-foreground/90">
                  {line.tokens.length ? (
                    line.tokens.map((token) => (
                      <span
                        key={token.id}
                        className={cn(
                          token.type === "added" &&
                            "rounded bg-emerald-500/15 px-1 text-emerald-700 dark:text-emerald-200",
                          token.type === "removed" &&
                            "rounded bg-rose-500/15 px-1 text-rose-700 line-through dark:text-rose-200"
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
        </div>
      )}
    </div>
  );
}

function RawView({ content }: { content: string }) {
  const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedContent.split("\n");

  return (
    <Card className="overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-lg shadow-black/5 supports-[backdrop-filter]:backdrop-blur-md">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-card/90 px-5 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Revision content
          </p>
          <h3 className="text-lg font-semibold text-foreground">
            Raw prompt
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          {lines.length} lines
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="text-sm">
            {lines.map((line, index) => (
              <div
                key={`line-${index}`}
                className="grid grid-cols-[3.5rem,1fr] border-b border-border/60 bg-card/80 transition last:border-b-0 hover:bg-card/70"
              >
                <div className="select-none border-r border-border/60 bg-muted/60 px-3 py-1.5 text-right text-[11px] font-semibold text-muted-foreground">
                  {index + 1}
                </div>
                <pre className="whitespace-pre-wrap px-4 py-1.5 font-mono text-[13px] leading-relaxed text-foreground/90">
                  {line || " "}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentsSection({
  revision,
}: {
  revision: PromptData["revisions"][number];
}) {
  if (!revision.comments.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
        <p>No comments yet. Start the conversation with an insight or question.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {revision.comments.map((comment, index) => {
        const formattedDate = new Date(comment.createdAt).toLocaleString(
          undefined,
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        );
        return (
          <article
            key={comment.id}
            className={cn(
              "rounded-2xl border px-4 py-4 shadow-sm shadow-black/5 transition hover:border-border/60 hover:shadow-md",
              index % 2 === 0
                ? "border-border/50 bg-card/95"
                : "border-border/40 bg-muted/50"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {comment.lineNumber ? `L${comment.lineNumber}` : "Note"}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/80">
                  <span className="font-semibold text-foreground/90">
                    {comment.lineNumber
                      ? `Line ${comment.lineNumber}`
                      : "General"}
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{formattedDate}</span>
                  {comment.resolved ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200"
                    >
                      Resolved
                    </Badge>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {comment.body}
                </p>
              </div>
            </div>
          </article>
        );
      })}
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
