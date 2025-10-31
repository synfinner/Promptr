"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { deleteProjectAction } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  promptCount: number;
  revisionCount: number;
};

type ProjectSidebarProps = {
  projects: ProjectSummary[];
  selectedProjectId?: string | null;
  className?: string;
};

export function ProjectSidebar({
  projects,
  selectedProjectId,
  className,
}: ProjectSidebarProps) {
  const [optimisticProjects, removeProjectOptimistic] = useOptimistic(
    projects,
    (currentProjects: ProjectSummary[], projectId: string) =>
      currentProjects.filter((project) => project.id !== projectId)
  );
  const hasProjects = optimisticProjects.length > 0;
  const router = useRouter();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeleteProject = (project: ProjectSummary) => {
    const confirmed = window.confirm(
      `Delete project “${project.name}”? This will remove all prompts and revisions within it.`
    );

    if (!confirmed) return;

    startTransition(() => {
      removeProjectOptimistic(project.id);
      setPendingId(project.id);

      void (async () => {
        const result = await deleteProjectAction({
          projectId: project.id,
        });

        if (result?.error) {
          toast({
            title: "Project was not deleted",
            description: result.error,
            variant: "destructive",
          });
        } else {
          toast({
            title: result?.success ?? "Project deleted.",
          });
        }

        router.replace("/");
        router.refresh();
        setPendingId(null);
      })();
    });
  };

  return (
    <Card
      className={cn(
        "flex h-fit flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-md shadow-black/5 supports-[backdrop-filter]:backdrop-blur-md transition-colors dark:shadow-none",
        className
      )}
    >
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Projects
          </CardTitle>
          <CreateProjectDialog />
        </div>
        <p className="text-xs text-muted-foreground/90">
          Organize related prompts into focused workspaces.
        </p>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        {hasProjects ? (
          <ScrollArea className="h-full px-4 pb-4">
            <div className="space-y-3 pb-3 pt-2">
              {optimisticProjects.map((project) => {
                const isActive = project.id === selectedProjectId;
                const isDeleting = pendingId === project.id && isPending;

                return (
                  <article
                    key={project.id}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border border-transparent bg-card/70 p-3 shadow-sm shadow-black/5 transition hover:-translate-y-[1px] hover:border-border/80 hover:bg-card hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                      isActive
                        ? "border-primary/70 bg-primary/10 text-primary"
                        : ""
                    )}
                  >
                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <Link
                          href={`/?project=${project.id}`}
                          className="text-sm font-semibold leading-tight tracking-tight text-foreground transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {project.name}
                        </Link>
                        {project.description ? (
                          <p className="text-xs text-muted-foreground">
                            {project.description}
                          </p>
                        ) : null}
                        <div className="text-xs text-muted-foreground">
                          <span>{project.promptCount} prompts</span>
                          <span className="mx-1">•</span>
                          <span>{project.revisionCount} revisions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                        >
                          {project.promptCount}
                        </Badge>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteProject(project);
                          }}
                          disabled={isDeleting}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/80 transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            "opacity-0 group-hover:opacity-100",
                            isDeleting && "opacity-100"
                          )}
                          aria-label={`Delete project ${project.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">
        You don&apos;t have any projects yet. Create one to begin curating your
        prompt workflows.
      </p>
      <CreateProjectDialog />
    </div>
  );
}
