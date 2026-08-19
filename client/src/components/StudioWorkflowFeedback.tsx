import { Button } from "@/components/ui/button";
import { AlertCircle, BadgeCheck, RefreshCw } from "lucide-react";

type QueryFeedback = { label: string; error: unknown; retry: () => void | Promise<unknown> };
type MutationFeedback = { label: string; error: unknown };

export default function StudioWorkflowFeedback({ queries, mutations, notice }: { queries: QueryFeedback[]; mutations: MutationFeedback[]; notice: string | null }) {
  const failedQueries = queries.filter(item => item.error);
  const failedMutations = mutations.filter(item => item.error);
  if (!failedQueries.length && !failedMutations.length && !notice) return null;
  return <section className="space-y-3" aria-live="polite">{failedQueries.map(item => <div key={item.label} role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><span>We could not load {item.label.toLowerCase()}.</span><Button size="sm" variant="outline" onClick={() => item.retry()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></div>)}{failedMutations.map(item => <div key={item.label} role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{item.label} could not be completed. Please try again.</div>)}{notice ? <div role="status" className="flex items-center gap-2 rounded-xl bg-[#e4eee6] p-4 text-sm text-[#405c4c]"><BadgeCheck className="h-4 w-4" />{notice}</div> : null}</section>;
}
