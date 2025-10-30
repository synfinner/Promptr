"use server";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { promptRevisions, prompts, projects } from "@/db/schema";

export async function fetchProjectsSummary() {
  const result = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      promptCount: sql<number>`COUNT(DISTINCT ${prompts.id})`,
      revisionCount: sql<number>`COUNT(DISTINCT ${promptRevisions.id})`,
    })
    .from(projects)
    .leftJoin(prompts, eq(prompts.projectId, projects.id))
    .leftJoin(promptRevisions, eq(promptRevisions.promptId, prompts.id))
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt));

  return result;
}

export async function fetchPromptsForProject(projectId: string) {
  if (!projectId) {
    return [];
  }

  const projectPrompts = await db.query.prompts.findMany({
    where: eq(prompts.projectId, projectId),
    with: {
      revisions: {
        columns: {
          id: true,
          version: true,
          createdAt: true,
          changeLog: true,
        },
        orderBy: (revision, { desc }) => [desc(revision.version)],
      },
    },
    orderBy: (prompt, { desc }) => [desc(prompt.updatedAt)],
  });

  return projectPrompts;
}

export async function fetchPromptDetails(promptId: string) {
  if (!promptId) {
    return null;
  }

  const prompt = await db.query.prompts.findFirst({
    where: eq(prompts.id, promptId),
    with: {
      project: true,
      revisions: {
        orderBy: (revision, { desc }) => [desc(revision.version)],
        with: {
          comments: {
            orderBy: (comment, { asc }) => [asc(comment.createdAt)],
          },
        },
      },
    },
  });

  return prompt;
}
