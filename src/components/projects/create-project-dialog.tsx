"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { createProject, type ActionState } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createProject, initialState);

  const hasError = Boolean(state?.error);

  const errorSummary = state?.issues?.join(" ");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>
            Group related prompts together so you can track their evolution.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <Field
            label="Name"
            htmlFor="project-name"
            errorMessage={hasError ? "Project name is required." : undefined}
          >
            <Input
              id="project-name"
              name="name"
              placeholder="Conversational AI Onboarding"
              required
            />
          </Field>
          <Field label="Description" htmlFor="project-description">
            <Textarea
              id="project-description"
              name="description"
              placeholder="Optional context to help recall the project's goals."
            />
          </Field>
          {state?.error && (
            <p className="text-sm text-destructive">
              {errorSummary ?? state.error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
  errorMessage,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  errorMessage?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create project"}
    </Button>
  );
}
