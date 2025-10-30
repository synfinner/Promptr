"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useFormStatus } from "react-dom";

import { addComment, type ActionState } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

export function AddCommentForm({ revisionId }: { revisionId: string }) {
  const [state, formAction] = useActionState(addComment, initialState);
  const formId = `add-comment-form-${revisionId}`;

  useEffect(() => {
    if (state?.success) {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      form?.reset();
    }
  }, [formId, state?.success]);

  const issues = useMemo(() => state?.issues ?? [], [state?.issues]);

  return (
    <form
      id={formId}
      action={formAction}
      className="space-y-3 rounded-lg border p-4"
    >
      <input type="hidden" name="revisionId" value={revisionId} />
      <div className="grid gap-3 sm:grid-cols-[120px,1fr]">
        <div className="space-y-1">
          <Label htmlFor="comment-line-number">Line number</Label>
          <Input
            id="comment-line-number"
            name="lineNumber"
            placeholder="Optional"
            type="number"
            min={0}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="comment-body">Comment</Label>
          <Textarea
            id="comment-body"
            name="body"
            required
            rows={3}
            placeholder="What did you observe? What should change?"
          />
        </div>
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
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Add comment"}
    </Button>
  );
}
