import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Building2, FolderKanban, Plus, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function AppHome() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const workspaces = trpc.workspace.listMine.useQuery(undefined, { enabled: isAuthenticated });
  const createWorkspace = trpc.workspace.createOrganization.useMutation({ onSuccess: result => setLocation(`/projects?workspace=${result.workspaceId}`) });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-[#17202b] p-7 text-[#f7f5ef] shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f3d5aa]">Evercrafted workspace</p>
          <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">A clear place to move work forward.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d1d7d1]">Your personal space is provisioned on first access. Create an organization when the work needs a team around it.</p>
            </div>
            {!loading && !isAuthenticated ? <Button onClick={startLogin} className="rounded-full bg-[#f3d5aa] text-[#2b241b] hover:bg-[#f8dfbc]">Sign in to begin <ArrowRight className="ml-1 h-4 w-4" /></Button> : null}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <Card className="border-[#17202b]/10 bg-white/75 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Your spaces</CardTitle>
              <CardDescription>Every space is separated by server-enforced membership and workspace policy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {workspaces.isLoading ? <p className="text-sm text-muted-foreground">Preparing your workspace…</p> : null}
              {workspaces.data?.map(workspace => (
                <button key={workspace.id} onClick={() => setLocation(`/projects?workspace=${workspace.id}`)} className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-background p-4 text-left transition hover:border-[#516f5e]/40 hover:bg-[#f2f6f2]">
                  <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e4eee6] text-[#516f5e]"><Building2 className="h-4 w-4" /></span><span><span className="block font-medium">{workspace.name}</span><span className="text-xs text-muted-foreground">{workspace.kind} · {workspace.role}</span></span></span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {isAuthenticated && workspaces.data?.length === 0 ? <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Your first personal space is being prepared. Refresh shortly if it does not appear.</p> : null}
              {workspaces.error ? <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">We could not load your spaces. Please try again.</p> : null}
            </CardContent>
          </Card>

          <Card className="border-[#17202b]/10 bg-[#e7dfd0] shadow-sm">
            <CardHeader><CardTitle className="text-xl">Make space for a team</CardTitle><CardDescription>Create a collaborative organization workspace.</CardDescription></CardHeader>
            <CardContent>
              <Button disabled={!isAuthenticated || createWorkspace.isPending} onClick={() => createWorkspace.mutate({ organizationName: "New Evercrafted organization" })} className="w-full rounded-xl bg-[#516f5e] hover:bg-[#405c4c]">
                <Plus className="mr-1 h-4 w-4" /> {createWorkspace.isPending ? "Creating…" : "Create organization"}
              </Button>
              <p className="mt-4 text-xs leading-5 text-[#596359]">You become the workspace owner. Invite, billing, and role controls are available through the evolving platform controls.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <button onClick={() => setLocation("/projects")} className="rounded-3xl border border-border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><FolderKanban className="h-6 w-6 text-[#c65e32]" /><h2 className="mt-8 text-xl font-semibold">Projects</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Create, organize, and track the work that connects every workflow.</p></button>
          <button onClick={() => setLocation("/studio")} className="rounded-3xl border border-border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><Sparkles className="h-6 w-6 text-[#516f5e]" /><h2 className="mt-8 text-xl font-semibold">Moodoor Studio</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Bring assets, review cycles, decisions, and delivery into the project context.</p></button>
        </section>
      </div>
    </DashboardLayout>
  );
}
