"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { promptComments, promptRevisions, prompts, projects } from "@/db/schema";

const projectInputSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required.")
    .max(80, "Keep project names under 80 characters."),
  description: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : null)),
});

const promptInputSchema = z.object({
  projectId: z.string().min(1, "Project id is required."),
  title: z
    .string()
    .min(1, "Prompt title is required.")
    .max(120, "Keep prompt titles under 120 characters."),
  promptType: z
    .enum(["SYSTEM", "USER", "TOOL"])
    .default("USER"),
  summary: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : null)),
  model: z
    .string()
    .optional()
    .transform((value) =>
      value && value.trim().length > 0 ? value.trim() : null
    ),
  content: z
    .string()
    .min(1, "Prompt content cannot be empty."),
  changeLog: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : null)),
});

const revisionInputSchema = z.object({
  promptId: z.string().min(1, "Prompt id is required."),
  content: z.string().min(1, "Please provide the updated prompt text."),
  changeLog: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : null)),
});

const commentInputSchema = z.object({
  revisionId: z.string().min(1, "Revision id missing."),
  lineNumber: z
    .string()
    .optional()
    .transform((value) =>
      value && value.trim().length > 0 ? Number.parseInt(value, 10) : null
    )
    .refine(
      (value) => value === null || (Number.isInteger(value) && value >= 0),
      "Line number must be a positive integer."
    ),
  body: z.string().min(1, "Comment text cannot be empty."),
});

type ActionState = {
  success?: string;
  error?: string;
  issues?: string[];
  redirectTo?: string;
};

function now() {
  return new Date().toISOString();
}

export async function createProject(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = projectInputSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const id = crypto.randomUUID();
  const timestamp = now();

  await db.insert(projects).values({
    id,
    name: parsed.data.name,
    description: parsed.data.description,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  revalidatePath("/", "layout");

  return {
    success: "Project created.",
    redirectTo: `/?project=${id}`,
  };
}

export async function createPrompt(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = promptInputSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    return {
      error: "We couldn’t save the prompt yet.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const promptId = crypto.randomUUID();
  const revisionId = crypto.randomUUID();
  const timestamp = now();

  await db.insert(prompts).values({
    id: promptId,
    projectId: parsed.data.projectId,
    title: parsed.data.title,
    promptType: parsed.data.promptType,
    summary: parsed.data.summary,
    model: parsed.data.model,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await db.insert(promptRevisions).values({
    id: revisionId,
    promptId,
    version: 1,
    content: parsed.data.content,
    changeLog: parsed.data.changeLog,
    createdAt: timestamp,
  });

  await db
    .update(projects)
    .set({ updatedAt: timestamp })
    .where(eq(projects.id, parsed.data.projectId));

  revalidatePath("/", "layout");

  return {
    success: "Prompt captured.",
    redirectTo: `/?project=${parsed.data.projectId}&prompt=${promptId}`,
  };
}

export async function createRevision(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = revisionInputSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    return {
      error: "Please review the revision details.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const timestamp = now();

  const [latest] = await db
    .select({
      version: promptRevisions.version,
    })
    .from(promptRevisions)
    .where(eq(promptRevisions.promptId, parsed.data.promptId))
    .orderBy(desc(promptRevisions.version))
    .limit(1);

  const nextVersion = (latest?.version ?? 0) + 1;
  const revisionId = crypto.randomUUID();

  await db.insert(promptRevisions).values({
    id: revisionId,
    promptId: parsed.data.promptId,
    version: nextVersion,
    content: parsed.data.content,
    changeLog: parsed.data.changeLog,
    createdAt: timestamp,
  });

  await db
    .update(prompts)
    .set({ updatedAt: timestamp })
    .where(eq(prompts.id, parsed.data.promptId));

  const [prompt] = await db
    .select({
      projectId: prompts.projectId,
    })
    .from(prompts)
    .where(eq(prompts.id, parsed.data.promptId))
    .limit(1);

  if (prompt) {
    await db
      .update(projects)
      .set({ updatedAt: timestamp })
      .where(eq(projects.id, prompt.projectId));
  }

  revalidatePath("/", "layout");

  return {
    success: "New revision created.",
    redirectTo: `/?project=${prompt?.projectId ?? ""}&prompt=${parsed.data.promptId}&revision=${revisionId}`,
  };
}

export async function deletePromptAction({
  promptId,
  projectId,
}: {
  promptId: string;
  projectId: string;
}): Promise<ActionState> {
  if (!promptId) {
    return { error: "Prompt id missing." };
  }

  try {
    const timestamp = now();
    const revisionIds = await db
      .select({ id: promptRevisions.id })
      .from(promptRevisions)
      .where(eq(promptRevisions.promptId, promptId));

    const revisionIdValues = revisionIds.map((rev) => rev.id);

    if (revisionIdValues.length) {
      await db
        .delete(promptComments)
        .where(inArray(promptComments.revisionId, revisionIdValues));
      await db
        .delete(promptRevisions)
        .where(eq(promptRevisions.promptId, promptId));
    }

    await db.delete(prompts).where(eq(prompts.id, promptId));

    if (projectId) {
      await db
        .update(projects)
        .set({ updatedAt: timestamp })
        .where(eq(projects.id, projectId));
    }

    revalidatePath("/", "layout");
    return { success: "Prompt deleted." };
  } catch (error) {
    console.error("Failed to delete prompt", error);
    return { error: "Unable to delete prompt. Please try again." };
  }
}

export async function deleteProjectAction({
  projectId,
}: {
  projectId: string;
}): Promise<ActionState> {
  if (!projectId) {
    return { error: "Project id missing." };
  }

  try {
    const projectPrompts = await db
      .select({ id: prompts.id })
      .from(prompts)
      .where(eq(prompts.projectId, projectId));

    if (projectPrompts.length) {
      const promptIds = projectPrompts.map((prompt) => prompt.id);
      const projectRevisions = await db
        .select({ id: promptRevisions.id })
        .from(promptRevisions)
        .where(inArray(promptRevisions.promptId, promptIds));

      if (projectRevisions.length) {
        const revisionIds = projectRevisions.map((revision) => revision.id);
        await db
          .delete(promptComments)
          .where(inArray(promptComments.revisionId, revisionIds));
      }

      await db
        .delete(promptRevisions)
        .where(inArray(promptRevisions.promptId, promptIds));
      await db.delete(prompts).where(inArray(prompts.id, promptIds));
    }

    await db.delete(projects).where(eq(projects.id, projectId));
    revalidatePath("/", "layout");
    return { success: "Project deleted." };
  } catch (error) {
    console.error("Failed to delete project", error);
    return { error: "Unable to delete project. Please try again." };
  }
}

export async function addComment(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = commentInputSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    return {
      error: "Could not add the comment.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const timestamp = now();
  const commentId = crypto.randomUUID();

  await db.insert(promptComments).values({
    id: commentId,
    revisionId: parsed.data.revisionId,
    lineNumber: parsed.data.lineNumber,
    body: parsed.data.body,
    createdAt: timestamp,
    resolved: false,
  });

  revalidatePath("/", "layout");

  return {
    success: "Comment added.",
  };
}

export type { ActionState };
