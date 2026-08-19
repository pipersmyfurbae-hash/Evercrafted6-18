import PersonalLayout from "@/components/PersonalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, LockKeyhole, ShieldCheck, Workflow } from "lucide-react";

export default function Personal() {
  const access = trpc.personal.commandCenterAccess.useQuery();
  const overview = trpc.personal.overview.useQuery(undefined, {
    enabled: Boolean(access.data?.allowed),
  });
  const isAllowed = Boolean(access.data?.allowed);

  return (
    <PersonalLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-[#171614] p-7 text-[#f6f0e5] md:p-9">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#dcc7a0] text-[#2b271f]"><LockKeyhole className="h-5 w-5" /></span>
            <div><p className="text-xs font-medium uppercase tracking-[.16em] text-[#dcc7a0]">Personal command</p><h1 className="font-editorial mt-1 text-4xl tracking-[-.035em]">Private platform controls, by policy.</h1></div>
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-stone-300">This space is separate from client workspace administration. It requires the configured platform-owner policy and records protected activity through the shared engine.</p>
        </section>

        {access.isLoading ? <p className="text-sm text-stone-300">Checking private access…</p> : null}
        {access.error || (access.data && !isAllowed) ? <Card className="border-[#9e5a4b] bg-[#3a211e] text-[#f6f0e5]"><CardContent className="p-6"><p className="font-medium">This area is restricted to the configured platform owner.</p><p className="mt-2 text-sm text-stone-300">Client workspace ownership does not grant access to Personal command controls.</p></CardContent></Card> : null}

        {isAllowed ? <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-white/10 bg-[#f6f0e5] shadow-none"><CardHeader><ShieldCheck className="h-5 w-5 text-[#597461]" /><CardTitle className="mt-4 text-lg">Owner access</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-[#3e5d49]">Verified</p><p className="mt-2 text-sm text-stone-600">Exact configured-owner identity match.</p></CardContent></Card>
            <Card className="border-white/10 bg-[#f6f0e5] shadow-none"><CardHeader><Activity className="h-5 w-5 text-[#a45c40]" /><CardTitle className="mt-4 text-lg">Workspaces</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{overview.data?.workspaceCount ?? "—"}</p><p className="mt-2 text-sm text-stone-600">cross-workspace platform view</p></CardContent></Card>
            <Card className="border-white/10 bg-[#f6f0e5] shadow-none"><CardHeader><Workflow className="h-5 w-5 text-[#597461]" /><CardTitle className="mt-4 text-lg">Queue state</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{overview.data?.jobHealth.counts.queued ?? 0}</p><p className="mt-2 text-sm text-stone-600">queued · {overview.data?.jobHealth.counts.running ?? 0} processing</p></CardContent></Card>
          </section>
          <section className="grid gap-5 lg:grid-cols-2">
            <Card className="border-white/10 bg-[#f6f0e5] shadow-none"><CardHeader><CardTitle>Recent workspaces</CardTitle><CardDescription>Platform-wide visibility stays private and does not change client member permissions.</CardDescription></CardHeader><CardContent className="space-y-2">{overview.data?.recentWorkspaces.map(workspace => <div key={workspace.id} className="rounded-xl border border-stone-200 p-3"><p className="text-sm font-medium">{workspace.name}</p><p className="mt-1 text-xs text-stone-500">{workspace.slug} · {workspace.kind} · {workspace.isArchived ? "archived" : "active"}</p></div>)}{overview.isLoading ? <p className="text-sm text-stone-500">Loading private overview…</p> : null}</CardContent></Card>
            <Card className="border-white/10 bg-[#f6f0e5] shadow-none"><CardHeader><CardTitle>Cross-workspace activity</CardTitle><CardDescription>Recent operational actions recorded by the shared audit engine.</CardDescription></CardHeader><CardContent className="space-y-2">{overview.data?.recentActivity.map(event => <div key={event.id} className="rounded-xl border border-stone-200 p-3"><p className="text-sm font-medium">{event.action}</p><p className="mt-1 text-xs text-stone-500">Workspace {event.workspaceId ?? "platform"} · {new Date(event.createdAt).toLocaleString()}</p></div>)}{overview.data?.recentActivity.length === 0 ? <p className="rounded-xl border border-dashed border-stone-300 p-3 text-sm text-stone-500">No platform activity records exist yet.</p> : null}</CardContent></Card>
          </section>
        </> : null}
      </div>
    </PersonalLayout>
  );
}
