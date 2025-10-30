import { Suspense } from "react";

import { ProjectSidebar } from "@/components/projects/project-sidebar";
import { PromptDetail } from "@/components/prompts/prompt-detail";
import { PromptList } from "@/components/prompts/prompt-list";
import {
  fetchPromptDetails,
  fetchPromptsForProject,
  fetchProjectsSummary,
} from "@/server/queries";

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

function extractParam(value: string | string[] | undefined) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function PromptrDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedParams = await Promise.resolve(searchParams);
  const requestedProject = extractParam(resolvedParams?.project);
  const requestedPrompt = extractParam(resolvedParams?.prompt);
  const requestedRevision = extractParam(resolvedParams?.revision);

  const projects = await fetchProjectsSummary();

  const activeProjectId =
    (requestedProject &&
      projects.find((project) => project.id === requestedProject)?.id) ??
    projects[0]?.id ??
    null;

  const prompts = activeProjectId
    ? await fetchPromptsForProject(activeProjectId)
    : [];

  const activePromptId =
    (requestedPrompt &&
      prompts.find((prompt) => prompt.id === requestedPrompt)?.id) ??
    prompts[0]?.id ??
    null;

  const promptDetails = activePromptId
    ? await fetchPromptDetails(activePromptId)
    : null;

  return (
    <div className="relative isolate w-full">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_120%_at_10%_0%,rgba(99,102,241,0.14),transparent_55%)] dark:bg-[radial-gradient(70%_120%_at_10%_0%,rgba(15,23,42,0.38),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-2/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),transparent)] dark:bg-[linear-gradient(180deg,rgba(13,16,28,0.88),transparent)]" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1760px] flex-col gap-6 px-3 py-6 sm:px-4 md:px-6 lg:grid lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-10 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] xl:gap-10">
        {/* Project & Prompt navigation */}
        <aside className="order-2 flex flex-col gap-4 lg:order-1 lg:sticky lg:top-8 lg:max-h-[calc(100vh-8rem)] lg:pr-2 xl:pr-4">
          <ProjectSidebar
            projects={projects}
            selectedProjectId={activeProjectId}
            className="lg:flex-1"
          />
          <PromptList
            projectId={activeProjectId}
            prompts={prompts}
            selectedPromptId={activePromptId}
            className="lg:flex-[1.2]"
          />
        </aside>

        {/* Main Content Area */}
        <main className="order-1 flex-1 min-w-0 lg:order-2">
          <Suspense fallback={<div className="rounded-2xl border border-border/60 bg-background/70 p-6 shadow-lg shadow-slate-900/5 dark:shadow-black/40">Loading…</div>}>
            <PromptDetail
              prompt={promptDetails}
              selectedRevisionId={requestedRevision}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
