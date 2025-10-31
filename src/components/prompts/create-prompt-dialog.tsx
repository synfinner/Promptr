"use client";

import { FilePlus2 } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { createPrompt, type ActionState } from "@/app/(app)/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const initialState: ActionState = {};

const promptTypeOptions = [
  { label: "User prompt", value: "USER" },
  { label: "System prompt", value: "SYSTEM" },
  { label: "Tool instruction", value: "TOOL" },
];

export function CreatePromptDialog({
  projectId,
}: {
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [promptType, setPromptType] = useState("USER");
  const [state, formAction] = useActionState(createPrompt, initialState);
  const router = useRouter();
  const { toast } = useToast();
  const errorSummary = state?.issues?.join(" ");

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      toast({
        title: state.success,
        description: "Switching to the new prompt workspace.",
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
          variant="default"
          size="sm"
          className="w-full gap-2 rounded-full px-3"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          New Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create a prompt</DialogTitle>
          <DialogDescription>
            Start with a clean version that you can iterate on over time.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="promptType" value={promptType} />
          <Field label="Title" htmlFor="prompt-title">
            <Input
              id="prompt-title"
              name="title"
              placeholder="Onboarding follow-up email"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prompt type" htmlFor="prompt-type">
              <Select
                value={promptType}
                onValueChange={setPromptType}
                defaultValue="USER"
              >
                <SelectTrigger id="prompt-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {promptTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quick summary" htmlFor="prompt-summary">
              <Input
                id="prompt-summary"
                name="summary"
                placeholder="Helps the agent nudge users back into the flow."
              />
            </Field>
            <Field
              label="Target model"
              htmlFor="prompt-model"
              description="Optional: note the model this prompt is tuned for."
            >
              <Input
                id="prompt-model"
                name="model"
                placeholder="e.g. GPT-4.1-preview, Claude 3.5 Sonnet"
              />
            </Field>
          </div>
          <Field label="Prompt content" htmlFor="prompt-content">
            <Textarea
              id="prompt-content"
              name="content"
              required
              rows={10}
              placeholder="Paste your working prompt here."
            />
          </Field>
          <Field
            label="What changed?"
            htmlFor="prompt-changelog"
            description="Optional note that captures intent or learnings."
          >
            <Textarea
              id="prompt-changelog"
              name="changeLog"
              rows={3}
              placeholder="Called out the tone adjustments after last round of feedback."
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
      {pending ? "Saving…" : "Create prompt"}
    </Button>
  );
}
