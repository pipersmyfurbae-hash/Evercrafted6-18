import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { ArrowRight, Boxes, Check, FolderKanban, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";

const platformPillars = [
  { icon: Boxes, title: "One governed engine", copy: "Workspaces, studio activity, access rules, and audit history all share one typed operational core." },
  { icon: Sparkles, title: "A studio built into the flow", copy: "Move creative projects from brief through review, approval, delivery, and publishing without splitting your team across systems." },
  { icon: ShieldCheck, title: "Trust by design", copy: "Tenant scope, roles, entitlement checks, and activity records are enforced on the server—not improvised in the interface." },
];

const included = ["Personal workspace on sign-in", "Organization-ready collaboration", "Moodoor Studio workflow", "Auditable operational controls"];

export default function Home() {
  const [email, setEmail] = useState("");
  const leadCapture = trpc.lead.capture.useMutation();
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f5ef] text-[#17202b]">
      <section className="relative border-b border-[#17202b]/10 px-5 pb-20 pt-5 sm:px-8 lg:px-12">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_12%_20%,rgba(204,229,211,0.85),transparent_35%),radial-gradient(circle_at_86%_12%,rgba(255,203,153,0.7),transparent_30%),linear-gradient(115deg,#f8f6f0_15%,#efe9dc)]" />
        <div className="relative mx-auto max-w-7xl">
          <nav className="flex items-center justify-between gap-4 py-3" aria-label="Primary navigation">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-[-0.03em] text-[#17202b]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#17202b] text-sm font-bold text-[#f8f6f0]">E</span>
              <span>Evercrafted</span>
            </Link>
            <div className="hidden items-center gap-7 text-sm text-[#17202b]/70 md:flex">
              <Link href="/product" className="transition-colors hover:text-[#17202b]">Platform</Link>
              <a href="#studio" className="transition-colors hover:text-[#17202b]">Studio</a>
              <Link href="/pricing" className="transition-colors hover:text-[#17202b]">Pricing</Link>
            </div>
            <Button onClick={startLogin} className="rounded-full bg-[#17202b] px-5 text-[#f8f6f0] hover:bg-[#2a3746]">
              Sign in <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </nav>

          <div className="grid gap-12 pb-3 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:pt-28">
            <div className="max-w-3xl">
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#17202b]/15 bg-white/50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.13em] text-[#53616e]">
                <Waypoints className="h-3.5 w-3.5" /> The connected operating system for creative work
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.96] tracking-[-0.065em] text-[#17202b] sm:text-6xl lg:text-7xl">
                Craft the work.
                <span className="block text-[#516f5e]">Keep the whole system.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#43515d]">
                Evercrafted brings client work, team operations, and Moodoor Studio together in one deliberate workspace—without giving up the controls serious teams need.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button onClick={startLogin} size="lg" className="rounded-full bg-[#df6e39] px-6 text-white hover:bg-[#c45d2e]">
                  Create your space <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <Link href="/app" className="inline-flex h-11 items-center rounded-full border border-[#17202b]/15 bg-white/70 px-5 text-sm font-medium transition-colors hover:bg-white">
                  Explore the workspace
                </Link>
              </div>
            </div>

            <div className="relative rounded-[2rem] border border-white/70 bg-[#17202b] p-5 shadow-[0_30px_70px_rgba(23,32,43,0.2)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5 text-[#f7f5ef]">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#d1d7d1]/70">Workspace pulse</p>
                  <p className="mt-1 text-lg font-medium">The campaign room</p>
                </div>
                <span className="rounded-full bg-[#c7e5d1] px-3 py-1 text-xs font-semibold text-[#2b563c]">Active</span>
              </div>
              <div className="grid gap-3 py-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/8 p-4 text-[#f7f5ef]">
                  <p className="text-xs text-[#d1d7d1]/65">Review cycle</p>
                  <p className="mt-2 text-2xl font-medium tracking-tight">02</p>
                  <p className="mt-3 text-sm text-[#d1d7d1]/75">Clear approvals, no lost context.</p>
                </div>
                <div className="rounded-2xl bg-[#d9ae72] p-4 text-[#2b241b]">
                  <p className="text-xs text-[#2b241b]/65">Studio delivery</p>
                  <p className="mt-2 text-2xl font-medium tracking-tight">Ready</p>
                  <p className="mt-3 text-sm text-[#2b241b]/75">Assets and decisions travel together.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#d1d7d1]">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#9ed5b0]" /> Every action is tenant-scoped and traceable.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c65e32]">Designed as a whole</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">A workspace that does not fragment as you grow.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {platformPillars.map(item => (
              <article key={item.title} className="rounded-3xl border border-[#17202b]/10 bg-white/70 p-6 shadow-sm">
                <item.icon className="h-6 w-6 text-[#516f5e]" />
                <h3 className="mt-7 text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5b6872]">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="studio" className="bg-[#e7dfd0] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-[#f7f5ef] p-7 shadow-sm lg:grid-cols-[1fr_0.9fr] lg:p-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c65e32]">Moodoor Studio</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">From first brief to final delivery, in the same context.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#5b6872]">Build projects, organize assets, collect reviews, move approvals forward, and package delivery from the workspace your team already uses.</p>
          </div>
          <div className="rounded-3xl bg-[#516f5e] p-7 text-[#f7f5ef]">
            <FolderKanban className="h-7 w-7 text-[#f3d5aa]" />
            <p className="mt-12 text-2xl font-medium tracking-tight">One project record.</p>
            <p className="mt-2 text-[#e8eee9]/75">Shared assets, decisions, delivery status, and activity—without copying information into a second tool.</p>
            <div className="mt-8 border-t border-white/15 pt-5 text-sm text-[#e8eee9]/85">Studio modules are governed by the same workspace role and entitlement rules as the rest of the platform.</div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
        <div className="rounded-[2rem] bg-[#17202b] px-7 py-10 text-[#f7f5ef] lg:flex lg:items-end lg:justify-between lg:px-12 lg:py-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#f3d5aa]">Start with a space of your own</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Your personal workspace is ready when you are.</h2>
            <div className="mt-7 grid gap-2 text-sm text-[#d1d7d1] sm:grid-cols-2">
              {included.map(item => <p key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#9ed5b0]" /> {item}</p>)}
            </div>
          </div>
          <Button onClick={startLogin} size="lg" className="mt-8 rounded-full bg-[#f3d5aa] px-6 text-[#2b241b] hover:bg-[#f8dfbc] lg:mt-0">
            Begin with Evercrafted <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="border-t border-[#17202b]/10 bg-white/55 px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-[1fr_auto] md:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c65e32]">Build with intention</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Want the platform story in your inbox?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#5b6872]">Leave an email for thoughtful launch and platform updates. Or create a workspace now—your personal space is provisioned at first authenticated access.</p></div>
          <form onSubmit={event => { event.preventDefault(); if (email) leadCapture.mutate({ email, interest: "platform_updates" }); }} className="flex w-full max-w-md flex-col gap-2 sm:flex-row"><input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" className="h-11 flex-1 rounded-full border border-[#17202b]/15 bg-white px-4 text-sm outline-none ring-[#516f5e] focus:ring-2" /><Button type="submit" disabled={leadCapture.isPending} className="rounded-full bg-[#516f5e] px-5 hover:bg-[#405c4c]">{leadCapture.isSuccess ? "Received" : leadCapture.isPending ? "Sending…" : "Keep me posted"}</Button></form>
          {leadCapture.error ? <p className="md:col-span-2 text-sm text-destructive">We could not save that request. Please try again.</p> : null}
        </div>
      </section>
    </main>
  );
}
