"use client";

import { startTransition, useActionState, useEffect, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { addComment, type ActionState } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const initialState: ActionState = {};

export function AddCommentForm({ revisionId }: { revisionId: string }) {
  const [state, formAction] = useActionState(addComment, initialState);
  const router = useRouter();
  const { toast } = useToast();
  const formId = `add-comment-form-${revisionId}`;

  useEffect(() => {
    if (state?.success) {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      form?.reset();
      toast({
        title: state.success,
        description: "Comment posted to this revision.",
        variant: "success",
      });
      startTransition(() => {
        router.refresh();
      });
    }
  }, [formId, router, state?.success, toast]);

  const issues = useMemo(() => state?.issues ?? [], [state?.issues]);

  return (
    <form
      id={formId}
      action={formAction}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="revisionId" value={revisionId} />
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="comment-body"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80"
        >
          Comment
        </Label>
        <Textarea
          id="comment-body"
          name="body"
          required
          rows={3}
          placeholder="Add a comment…"
          className="w-full resize-none rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm text-foreground/90 shadow-sm transition focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex flex-col gap-2 sm:w-40">
          <Label
            htmlFor="comment-line-number"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80"
          >
            Line number
          </Label>
          <Input
            id="comment-line-number"
            name="lineNumber"
            placeholder="Optional"
            type="number"
            min={0}
            className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground/90 shadow-sm transition focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
          />
        </div>
        <SubmitButton className="w-full transition sm:w-auto sm:self-end" />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {issues.length ? (
        <ul className="list-disc space-y-1 pl-5 text-xs text-destructive">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(
        "rounded-full px-5 py-2 text-sm font-semibold transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        className
      )}
    >
      {pending ? "Adding…" : "Add comment"}
    </Button>
  );
}
