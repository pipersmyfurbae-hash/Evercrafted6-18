import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRoundCheck } from "lucide-react";

type Review = { id: number; requestNote: string | null; reviewerUserId: number | null; status: string };
type Member = { userId: number; name: string | null; email: string | null; role: string };

export default function StudioReviewerAssignments({ reviews, members }: { reviews: Review[]; members: Member[] }) {
  if (!reviews.length) return null;
  return <Card className="border-border bg-white"><CardHeader><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4eee6] text-[#405c4c]"><UserRoundCheck className="h-5 w-5" /></span><div><CardTitle>Reviewer assignment</CardTitle><CardDescription>Review responsibility remains visible in the shared workflow record.</CardDescription></div></div></CardHeader><CardContent className="space-y-3">{reviews.map(review => { const assigned = members.find(member => member.userId === review.reviewerUserId); const assignee = review.reviewerUserId ? assigned?.name || assigned?.email || `Workspace member #${review.reviewerUserId}` : "Open to eligible workspace members"; return <div key={review.id} className="flex flex-col justify-between gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">{review.requestNote || "Review requested"}</p><p className="mt-1 text-xs text-muted-foreground">Assigned to: {assignee}</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{review.status.replace("_", " ")}</span></div>; })}</CardContent></Card>;
}
