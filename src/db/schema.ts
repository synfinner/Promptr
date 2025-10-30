import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  prompts: many(prompts),
}));

export const prompts = sqliteTable(
  "prompts",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    promptType: text("prompt_type").notNull().default("USER"),
    summary: text("summary"),
    model: text("model"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    projectIdx: index("prompts_project_id_idx").on(table.projectId),
  })
);

export const promptsRelations = relations(prompts, ({ many, one }) => ({
  project: one(projects, {
    fields: [prompts.projectId],
    references: [projects.id],
  }),
  revisions: many(promptRevisions),
}));

export const promptRevisions = sqliteTable(
  "prompt_revisions",
  {
    id: text("id").primaryKey(),
    promptId: text("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    content: text("content").notNull(),
    changeLog: text("change_log"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    promptVersionUnique: uniqueIndex("prompt_revisions_prompt_version_idx").on(
      table.promptId,
      table.version
    ),
    promptCreatedAtIdx: index("prompt_revisions_prompt_created_at_idx").on(
      table.promptId,
      table.createdAt
    ),
  })
);

export const promptRevisionsRelations = relations(
  promptRevisions,
  ({ many, one }) => ({
    prompt: one(prompts, {
      fields: [promptRevisions.promptId],
      references: [prompts.id],
    }),
    comments: many(promptComments),
  })
);

export const promptComments = sqliteTable(
  "prompt_comments",
  {
    id: text("id").primaryKey(),
    revisionId: text("revision_id")
      .notNull()
      .references(() => promptRevisions.id, { onDelete: "cascade" }),
    lineNumber: integer("line_number"),
    body: text("body").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    resolved: integer("resolved", { mode: "boolean" })
      .notNull()
      .default(false),
    resolvedAt: text("resolved_at"),
    resolvedBy: text("resolved_by"),
  },
  (table) => ({
    revisionIdx: index("prompt_comments_revision_idx").on(table.revisionId),
  })
);

export const promptCommentsRelations = relations(
  promptComments,
  ({ one }) => ({
    revision: one(promptRevisions, {
      fields: [promptComments.revisionId],
      references: [promptRevisions.id],
    }),
  })
);

export type Project = typeof projects.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type PromptRevision = typeof promptRevisions.$inferSelect;
export type PromptComment = typeof promptComments.$inferSelect;
