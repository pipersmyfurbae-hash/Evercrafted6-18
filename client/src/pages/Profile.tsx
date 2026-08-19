import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, Loader2, MailWarning, RefreshCw, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Profile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const profile = trpc.profile.me.useQuery();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.name ?? "");
    setEmail(profile.data.email ?? "");
  }, [profile.data]);

  const update = trpc.profile.update.useMutation({
    onSuccess: async () => {
      await Promise.all([profile.refetch(), utils.auth.me.invalidate()]);
      setValidationError(null);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    if (!normalizedName) {
      setValidationError("Enter the name you want to use across permitted workspaces.");
      return;
    }
    if (normalizedEmail && !emailPattern.test(normalizedEmail)) {
      setValidationError("Enter a valid email address or leave the field empty.");
      return;
    }
    setValidationError(null);
    update.mutate({ name: normalizedName, email: normalizedEmail || undefined });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c65e32]">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Profile and identity</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Update the account name and contact email shown across permitted workspace experiences. Your role and platform-owner status cannot be edited here.</p>

        <Card className="mt-7 border-border bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4eee6] text-[#516f5e]"><UserRound className="h-5 w-5" /></span>
              <div><CardTitle>Your profile</CardTitle><CardDescription>{user?.openId ? "Authenticated platform identity" : "Loading identity"}</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent>
            {profile.isLoading ? <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your current profile…</div> : null}
            {profile.error ? <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><span>We could not load your profile. Try again before making changes.</span><Button type="button" size="sm" variant="outline" onClick={() => profile.refetch()}><RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry</Button></div> : null}
            {!profile.isLoading && !profile.error ? <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <label className="block space-y-2" htmlFor="profile-name"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Display name</span><Input id="profile-name" value={name} onChange={event => setName(event.target.value)} placeholder="Your name" autoComplete="name" aria-invalid={Boolean(validationError && !name.trim())} aria-describedby={validationError ? "profile-form-error" : undefined} /></label>
              <label className="block space-y-2" htmlFor="profile-email"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email address</span><Input id="profile-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" aria-invalid={Boolean(validationError && email.trim())} aria-describedby={validationError ? "profile-form-error" : undefined} /></label>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={update.isPending || !name.trim()} className="bg-[#516f5e] hover:bg-[#405c4c]">{update.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}</Button>
                {update.isSuccess ? <p role="status" className="flex items-center gap-1 text-sm text-[#405c4c]"><BadgeCheck className="h-4 w-4" /> Profile updated</p> : null}
              </div>
              {validationError ? <p id="profile-form-error" role="alert" className="flex items-center gap-2 text-sm text-destructive"><MailWarning className="h-4 w-4" />{validationError}</p> : null}
              {update.error ? <p role="alert" className="text-sm text-destructive">We could not save the profile. Check the entered details and try again.</p> : null}
            </form> : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
