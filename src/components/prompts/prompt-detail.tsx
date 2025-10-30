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
      <Card className="flex h-full min-h-[320px] flex-col">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Prompt details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center justify-center text-center text-sm text-muted-foreground">
          Select a prompt to view its revision history, add notes, and create new iterations.
        </CardContent>
      </Card>
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
