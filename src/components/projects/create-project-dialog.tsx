"use client";

import { FolderPlus } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

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
import { useToast } from "@/components/ui/use-toast";

const initialState: ActionState = {};

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createProject, initialState);
  const router = useRouter();
  const { toast } = useToast();

  const hasError = Boolean(state?.error);

  const errorSummary = state?.issues?.join(" ");

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      toast({
        title: state.success,
        description: "Workspace ready. Loading its prompts now.",
        variant: "success",
      });
      startTransition(() => setOpen(false));
      router.push(state.redirectTo);
    }
  }, [router, state?.redirectTo, state?.success, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="subtle"
          size="sm"
          className="w-full gap-2 rounded-full px-3"
        >
          <FolderPlus className="h-4 w-4" aria-hidden="true" />
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
