import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { FolderPlus, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function Projects() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const spaces = trpc.workspace.listMine.useQuery(undefined, { enabled: isAuthenticated });
  const [workspaceId, setWorkspaceId] = useState<number | undefined>();
  const [query, setQuery] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  useEffect(() => { if (!workspaceId && spaces.data?.[0]) setWorkspaceId(spaces.data[0].id); }, [spaces.data, workspaceId]);
  const projects = trpc.project.list.useQuery({ workspaceId: workspaceId ?? 0 }, { enabled: Boolean(workspaceId) });
  const createProject = trpc.project.create.useMutation({ onSuccess: () => { setNewProjectName(""); projects.refetch(); } });
  const visibleProjects = useMemo(() => projects.data?.filter(project => project.name.toLowerCase().includes(query.toLowerCase())) ?? [], [projects.data, query]);

  return <DashboardLayout><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c65e32]">Workspace work</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Projects with a complete trail.</h1><p className="mt-2 text-sm text-muted-foreground">Select a workspace to view only the projects you are allowed to access.</p></div><Button disabled={!workspaceId || !newProjectName.trim() || createProject.isPending} onClick={() => workspaceId && createProject.mutate({ workspaceId, name: newProjectName })} className="rounded-full bg-[#516f5e] hover:bg-[#405c4c]"><FolderPlus className="mr-1 h-4 w-4" />Create project</Button></div>
    <Card className="border-border bg-white/80"><CardContent className="grid gap-4 p-5 md:grid-cols-[0.8fr_1.2fr]"><div className="space-y-2"><label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Workspace</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={workspaceId ?? ""} onChange={event => setWorkspaceId(Number(event.target.value))}><option value="">Select a workspace</option>{spaces.data?.map(space => <option key={space.id} value={space.id}>{space.name} · {space.role}</option>)}</select></div><div className="space-y-2"><label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New project</label><Input value={newProjectName} onChange={event => setNewProjectName(event.target.value)} placeholder="e.g. Spring launch campaign" /></div></CardContent></Card>
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3"><Search className="h-4 w-4 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} className="border-0 p-0 shadow-none focus-visible:ring-0" placeholder="Search projects in this workspace" /><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /></div>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.isLoading ? <p className="text-sm text-muted-foreground">Loading workspace projects…</p> : null}{visibleProjects.map(project => <button key={project.id} onClick={() => workspaceId && setLocation(`/projects/${project.id}?workspace=${workspaceId}`)} className="text-left"><Card className="h-full border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#516f5e]/40 hover:shadow-md"><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg">{project.name}</CardTitle><span className="rounded-full bg-[#e4eee6] px-2.5 py-1 text-xs font-medium capitalize text-[#405c4c]">{project.status.replace("_", " ")}</span></div><CardDescription>{project.description || "No description has been added yet."}</CardDescription></CardHeader><CardContent><p className="text-xs text-muted-foreground">Updated {new Date(project.updatedAt).toLocaleDateString()}</p></CardContent></Card></button>)}{workspaceId && !projects.isLoading && visibleProjects.length === 0 ? <Card className="col-span-full border-dashed"><CardContent className="p-10 text-center"><FolderPlus className="mx-auto h-7 w-7 text-[#c65e32]" /><h2 className="mt-4 font-semibold">No projects match this space yet.</h2><p className="mt-2 text-sm text-muted-foreground">Create your first project to bring briefs, assets, reviews, and delivery into one context.</p></CardContent></Card> : null}</section>
  </div></DashboardLayout>;
}
