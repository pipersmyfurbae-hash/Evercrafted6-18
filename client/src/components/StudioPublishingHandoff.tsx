import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";

export default function StudioPublishingHandoff({ workspaceId, projectId }: { workspaceId: number; projectId: number }) {
  const deliveries = trpc.studio.listDeliveries.useQuery({ workspaceId, projectId });
  const [notice, setNotice] = useState<string | null>(null);
  const handoff = trpc.studio.queuePublishingHandoff.useMutation({
    onSuccess: result => {
      setNotice(`Publishing handoff queued as job #${result.job.id}. No external provider has been called.`);
      deliveries.refetch();
    },
  });
  const readyDeliveries = deliveries.data?.filter(delivery => delivery.status === "ready") ?? [];

  return <Card className="border-border bg-white"><CardHeader><CardTitle>Provider-neutral publishing handoff</CardTitle><CardDescription>Queue a durable handoff record only after delivery is ready. An external publishing provider remains disconnected until separately configured and approved.</CardDescription></CardHeader><CardContent className="space-y-3">{deliveries.isLoading ? <p className="text-sm text-muted-foreground">Checking delivery readiness…</p> : null}{readyDeliveries.map(delivery => <div key={delivery.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium capitalize">{delivery.destinationType.replace("_", " ")}</p><p className="mt-1 text-xs text-muted-foreground">{delivery.destinationRef || "No external reference"} · ready for handoff</p></div><Button disabled={handoff.isPending} onClick={() => handoff.mutate({ workspaceId, deliveryId: delivery.id })} className="bg-[#17202b] hover:bg-[#2a3746]"><Send className="mr-2 h-4 w-4" />{handoff.isPending ? "Queueing…" : "Queue handoff"}</Button></div>)}{!deliveries.isLoading && readyDeliveries.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Mark a delivery ready before it can be handed off for provider-neutral publishing.</p> : null}{notice ? <p role="status" className="flex items-center gap-2 rounded-xl bg-[#e4eee6] p-3 text-sm text-[#405c4c]"><CheckCircle2 className="h-4 w-4" />{notice}</p> : null}{handoff.error ? <p role="alert" className="text-sm text-destructive">We could not queue that publishing handoff. Confirm the delivery is still ready and try again.</p> : null}</CardContent></Card>;
}
