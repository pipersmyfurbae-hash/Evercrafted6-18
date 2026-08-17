import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, MailCheck, ShieldAlert } from "lucide-react";
import { useRoute } from "wouter";

export default function Invite() {
  const [, params] = useRoute("/invite/:token");
  const { isAuthenticated, loading } = useAuth();
  const accept = trpc.workspace.acceptInvitation.useMutation();
  const token = params?.token;
  return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] p-5"><Card className="w-full max-w-lg border-[#17202b]/10 bg-white shadow-xl"><CardHeader><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4eee6] text-[#516f5e]"><MailCheck className="h-5 w-5" /></span><CardTitle className="mt-5 text-2xl tracking-tight">Join an Evercrafted workspace</CardTitle><CardDescription>Invitation codes are bound to the email address that received them and expire after seven days.</CardDescription></CardHeader><CardContent>{loading ? <p className="text-sm text-muted-foreground">Checking your account…</p> : !isAuthenticated ? <div className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">Sign in with the invited account to validate and accept this workspace membership.</p><Button onClick={startLogin} className="w-full bg-[#17202b] hover:bg-[#2a3746]">Sign in to accept</Button></div> : accept.data ? <div className="rounded-xl bg-[#e4eee6] p-4 text-[#405c4c]"><p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-5 w-5" /> Invitation accepted</p><p className="mt-2 text-sm">Your workspace membership is active. Open the workspace dashboard to begin.</p></div> : <div className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">You are signed in. Accept this role-scoped invitation to add the workspace to your switcher.</p><Button disabled={!token || accept.isPending} onClick={() => token && accept.mutate({ token })} className="w-full bg-[#516f5e] hover:bg-[#405c4c]">{accept.isPending ? "Validating invitation…" : "Accept invitation"}</Button>{accept.error ? <p className="flex gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"><ShieldAlert className="h-4 w-4 shrink-0" />This invitation could not be accepted. Confirm that you are using the invited email and that the code has not expired.</p> : null}</div>}</CardContent></Card></main>;
}
