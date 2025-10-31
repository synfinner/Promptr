import { notFound } from "next/navigation";

import { PromptDetailClient } from "@/components/prompts/prompt-detail-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { fetchPromptDetails } from "@/server/queries";
type PromptDetailData = Awaited<ReturnType<typeof fetchPromptDetails>>;

export function PromptDetail({
  prompt,
  selectedRevisionId,
}: {
  prompt: PromptDetailData;
  selectedRevisionId?: string | null;
}) {
  if (!prompt) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="flex min-h-[calc(100vh-8rem)] max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-lg shadow-black/5">
          <CardHeader className="border-b border-border/60 bg-card/95 px-5 py-6">
            <CardTitle className="text-base font-semibold">
              Prompt details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center text-sm text-muted-foreground">
            Select a prompt to view its revision history, add notes, and create
            new iterations.
          </CardContent>
        </Card>
      </div>
    );
  }

  const revisions = prompt.revisions ?? [];

  if (revisions.length === 0) {
    notFound();
  }

  const activeRevisionId =
    selectedRevisionId && revisions.some((rev) => rev.id === selectedRevisionId)
      ? selectedRevisionId
      : revisions[0]?.id;

  const previousRevision = revisions[1];

  return (
    <PromptDetailClient
      prompt={prompt}
      selectedRevisionId={activeRevisionId}
      defaultCompareRevisionId={previousRevision?.id ?? null}
    />
  );
}
