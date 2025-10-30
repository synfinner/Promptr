"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { createRevision, type ActionState } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

export function CreateRevisionSheet({
  promptId,
  currentContent,
}: {
  promptId: string;
  currentContent: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createRevision, initialState);
  const errorSummary = state?.issues?.join(" ");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">New Revision</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>Capture a revision</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Save a new revision when you tweak the prompt so you can compare it
            against earlier versions.
          </p>
        </SheetHeader>
        <form action={formAction} className="flex flex-1 flex-col gap-4">
          <input type="hidden" name="promptId" value={promptId} />
          <Field label="Prompt text" htmlFor="revision-content">
            <Textarea
              id="revision-content"
              name="content"
              defaultValue={currentContent}
              rows={18}
              required
            />
          </Field>
          <Field
            label="What changed?"
            htmlFor="revision-changelog"
            description="Capture experiment notes or why this iteration matters."
          >
            <Textarea
              id="revision-changelog"
              name="changeLog"
              rows={4}
              placeholder="Documented better hand-off to support before closing the loop."
            />
          </Field>
          {state?.error && (
            <p className="text-sm text-destructive">
              {errorSummary ?? state.error}
            </p>
          )}
          <SheetFooter className="mt-auto gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <SubmitButton />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  htmlFor,
  children,
  description,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save revision"}
    </Button>
  );
}
