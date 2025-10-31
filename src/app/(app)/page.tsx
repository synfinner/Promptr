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
    <div className="relative h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent dark:from-primary/10" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-2/3 bg-gradient-to-b from-background/70 via-background/40 to-transparent dark:from-background/80 dark:via-background/40" />
      <div className="relative z-10 grid h-full w-full grid-cols-1 gap-0 bg-transparent md:grid-cols-[minmax(320px,360px)_minmax(600px,1fr)_minmax(340px,400px)]">
        {/* Project & Prompt navigation */}
        <aside className="hidden h-full min-w-[300px] overflow-y-auto border-r border-border/40 bg-background/70 md:flex md:flex-col md:min-w-[340px] lg:min-w-[360px]">
          <div className="flex flex-1 flex-col space-y-3 px-4 py-3 pb-10 sm:px-5">
            <ProjectSidebar
              projects={projects}
              selectedProjectId={activeProjectId}
              className="min-h-0 flex-1"
            />
            <PromptList
              projectId={activeProjectId}
              prompts={prompts}
              selectedPromptId={activePromptId}
              className="min-h-0 flex-1"
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="col-span-1 flex h-full min-w-0 flex-col overflow-hidden bg-background/50 md:col-span-2">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-6 pb-10 sm:px-6 md:px-8 lg:px-10">
              <Suspense
                fallback={
                  <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-background/80 p-6 shadow-lg shadow-slate-900/5 dark:shadow-black/40">
                    Loading…
                  </div>
                }
              >
                <PromptDetail
                  prompt={promptDetails}
                  selectedRevisionId={requestedRevision}
                />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
