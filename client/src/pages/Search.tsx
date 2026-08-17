import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Search() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const results = trpc.search.projects.useQuery({ query }, { enabled: query.trim().length >= 2 });
  return <DashboardLayout><div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c65e32]">Global search</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Find work across the spaces you belong to.</h1><p className="mt-2 text-sm text-muted-foreground">Search respects active workspace membership and never returns projects from outside your authorized scope.</p><div className="mt-7 flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"><SearchIcon className="h-5 w-5 text-[#516f5e]" /><Input autoFocus value={query} onChange={event => setQuery(event.target.value)} className="border-0 p-0 text-base shadow-none focus-visible:ring-0" placeholder="Search project names" /></div><div className="mt-5 space-y-3">{query.length < 2 ? <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">Enter at least two characters to search your workspace projects.</p> : null}{results.isLoading ? <p className="text-sm text-muted-foreground">Searching permitted projects…</p> : null}{results.data?.map(project => <button key={project.id} onClick={() => setLocation(`/projects?workspace=${project.workspaceId}`)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-white p-5 text-left shadow-sm transition hover:border-[#516f5e]/40"><span><span className="block font-medium">{project.name}</span><span className="mt-1 block text-sm text-muted-foreground">{project.workspaceName} · {project.status.replace("_", " ")}</span>{project.description ? <span className="mt-2 block line-clamp-1 text-sm text-muted-foreground">{project.description}</span> : null}</span><span className="text-xs font-semibold uppercase tracking-wide text-[#c65e32]">Open workspace</span></button>)}{results.data?.length === 0 && query.length >= 2 && !results.isLoading ? <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No permitted projects match “{query}”.</p> : null}</div></div></DashboardLayout>;
}
