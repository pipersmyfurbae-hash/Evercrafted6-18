import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

export default function Profile() {
  const { user } = useAuth();
  const profile = trpc.profile.me.useQuery();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => { if (profile.data) { setName(profile.data.name ?? ""); setEmail(profile.data.email ?? ""); } }, [profile.data]);
  const update = trpc.profile.update.useMutation({ onSuccess: () => profile.refetch() });
  return <DashboardLayout><div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c65e32]">Account</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Profile and identity</h1><p className="mt-2 text-sm text-muted-foreground">Update the account name and contact email shown across permitted workspace experiences. Your role and platform owner status cannot be edited here.</p><Card className="mt-7 border-border bg-white shadow-sm"><CardHeader><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4eee6] text-[#516f5e]"><UserRound className="h-5 w-5" /></span><div><CardTitle>Your profile</CardTitle><CardDescription>{user?.openId ? "Authenticated platform identity" : "Loading identity"}</CardDescription></div></div></CardHeader><CardContent className="space-y-4"><label className="block space-y-2"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Display name</span><Input value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /></label><label className="block space-y-2"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email address</span><Input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></label><div className="flex flex-wrap items-center gap-3"><Button disabled={!name.trim() || update.isPending} onClick={() => update.mutate({ name, email: email || undefined })} className="bg-[#516f5e] hover:bg-[#405c4c]">{update.isPending ? "Saving…" : "Save changes"}</Button>{update.isSuccess ? <p className="flex items-center gap-1 text-sm text-[#405c4c]"><BadgeCheck className="h-4 w-4" />Profile updated</p> : null}{update.error ? <p className="text-sm text-destructive">We could not save the profile. Check the entered details and try again.</p> : null}</div></CardContent></Card></div></DashboardLayout>;
}
