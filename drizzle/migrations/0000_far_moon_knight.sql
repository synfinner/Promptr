CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prompt_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`revision_id` text NOT NULL,
	`line_number` integer,
	`body` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`resolved` integer DEFAULT false NOT NULL,
	`resolved_at` text,
	`resolved_by` text,
	FOREIGN KEY (`revision_id`) REFERENCES `prompt_revisions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prompt_comments_revision_idx` ON `prompt_comments` (`revision_id`);--> statement-breakpoint
CREATE TABLE `prompt_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`change_log` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_revisions_prompt_version_idx` ON `prompt_revisions` (`prompt_id`,`version`);--> statement-breakpoint
CREATE INDEX `prompt_revisions_prompt_created_at_idx` ON `prompt_revisions` (`prompt_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`prompt_type` text DEFAULT 'USER' NOT NULL,
	`summary` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prompts_project_id_idx` ON `prompts` (`project_id`);