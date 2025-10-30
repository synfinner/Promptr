import Link from "next/link";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const hasProjects = projects.length > 0;

  return (
    <Card
      className={cn(
        "flex h-fit flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-slate-900/65 dark:shadow-[0_35px_90px_-50px_rgba(2,8,23,0.9)]",
        className,
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
          <ScrollArea className="h-full px-4 pb-2 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
            <div className="space-y-3 pb-5 pt-3">
              {projects.map((project) => {
                const isActive = project.id === selectedProjectId;
                return (
                  <Link
                    key={project.id}
                    href={`/?project=${project.id}`}
                    className={cn(
                      "block rounded-xl border border-transparent bg-white/60 p-3 ring-1 ring-black/0 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-border/70 hover:bg-white/90 hover:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.32)] hover:ring-primary/10 dark:bg-slate-900/60 dark:hover:border-white/10 dark:hover:bg-slate-900/85",
                      isActive
                        ? "border-primary/70 bg-primary/10 shadow-[0_20px_40px_-32px_rgba(99,102,241,0.55)] hover:border-primary/70 hover:bg-primary/12"
                        : ""
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold leading-tight tracking-tight">
                        {project.name}
                      </span>
                      <Badge
                        variant={isActive ? "default" : "outline"}
                        className="rounded-full text-xs font-semibold"
                      >
                        {project.promptCount}
                      </Badge>
                    </div>
                    {project.description ? (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {project.description}
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{project.revisionCount} revisions</span>
                    </div>
                  </Link>
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
        You don&apos;t have any projects yet. Create one to begin curating your prompt workflows.
      </p>
      <CreateProjectDialog />
    </div>
  );
}
