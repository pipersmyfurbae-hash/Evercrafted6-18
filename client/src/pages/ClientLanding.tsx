import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import SkipLink from "@/components/SkipLink";
import { ArrowRight, CheckCircle2, FileCheck2, FolderKanban, LockKeyhole, MessageSquareText, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";

const stages = [
  { number: "01", title: "Establish the workspace", copy: "Bring project context, people, and priorities into one private place." },
  { number: "02", title: "Keep progress visible", copy: "See active projects, essential files, decisions, and the next responsible action." },
  { number: "03", title: "Review in context", copy: "Request feedback from the right people and retain the decision with the work." },
  { number: "04", title: "Prepare delivery", copy: "Move toward handoff with a clear record of what is ready and why." },
];

const capabilities = [
  { icon: FolderKanban, title: "Projects", copy: "A shared record for active work, context, and progress." },
  { icon: MessageSquareText, title: "Reviews", copy: "Decisions and requested changes stay connected to their source." },
  { icon: FileCheck2, title: "Deliveries", copy: "Prepare intentional handoff without losing what came before." },
  { icon: ShieldCheck, title: "Workspace controls", copy: "Membership and access are scoped through the shared engine." },
];

const pageContent = {
  "/client": { eyebrow: "Evercrafted Client", title: "The work stays clear from first brief to final delivery.", body: "A shared workspace for projects, reviews, files, decisions, and delivery—built to give every client a calmer way to move work forward.", action: "Enter your workspace" },
  "/client/how-it-works": { eyebrow: "How it works", title: "A steady path through complex work.", body: "Evercrafted Client brings the project brief, active work, reviews, decisions, and delivery record into one private workspace with a clear sequence.", action: "Explore capabilities" },
  "/client/capabilities": { eyebrow: "Capabilities", title: "A complete record of the work, not another place to search.", body: "Projects, Studio, reviews, delivery, notifications, and workspace controls each have a purpose—and remain connected through the same shared context.", action: "See how it works" },
  "/client/outcomes": { eyebrow: "Client outcomes", title: "Less searching. Better decisions.", body: "The experience is designed to make project state easier to understand: what is active, what needs a response, what has changed, and what is ready to move forward.", action: "Review access" },
  "/client/access": { eyebrow: "Access", title: "Your workspace, when you are ready.", body: "Client access follows an authorized invitation or approved membership path. The workspace opens only to the records and actions your role permits.", action: "Sign in securely" },
  "/client/sign-in": { eyebrow: "Client sign-in", title: "Continue securely to your workspace.", body: "Sign in to open the projects, reviews, and delivery records assigned to your membership. Access is checked by workspace role before protected information is shown.", action: "Continue securely" },
} as const;

export default function ClientLanding() {
  const [location] = useLocation();
  const content = pageContent[location as keyof typeof pageContent] ?? pageContent["/client"];

  return (
    <><SkipLink /><main id="main-content" className="client-surface min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12" aria-label="Client SaaS navigation">
        <Link href="/client" className="flex items-center gap-3 text-sm font-medium tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs text-white">EC</span><span>Evercrafted Client</span></Link>
        <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex"><Link href="/client/how-it-works">How it works</Link><Link href="/client/capabilities">Capabilities</Link><Link href="/client/outcomes">Outcomes</Link><Link href="/client/access">Access</Link><Link href="/">Evercrafted</Link></div>
        <Button asChild className="rounded-lg bg-slate-900 text-white hover:bg-slate-800"><Link href="/client/sign-in">Sign in</Link></Button>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.18fr_.82fr] lg:px-12 lg:pb-28 lg:pt-24">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{content.eyebrow}</p>
          <h1 className="mt-6 max-w-3xl text-5xl font-medium tracking-[-0.055em] text-slate-950 sm:text-6xl">{content.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">{content.body}</p>
          <div className="mt-9 flex flex-wrap gap-3"><Button onClick={startLogin} size="lg" className="rounded-lg bg-slate-900 text-white hover:bg-slate-800">{content.action} <ArrowRight className="ml-2 h-4 w-4" /></Button><a href="#process" className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-medium text-slate-700 hover:bg-slate-100">Explore the process</a></div>
        </div>
        {location === "/client/sign-in" ? <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,.08)] sm:p-8"><span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-800"><LockKeyhole className="h-5 w-5" /></span><p className="mt-7 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Protected access</p><h2 className="mt-3 text-2xl font-medium tracking-[-.04em] text-slate-950">Your membership sets the boundary.</h2><p className="mt-4 text-sm leading-6 text-slate-600">The sign-in process verifies identity before workspace membership and role policy determine the records that can be opened.</p><Button onClick={startLogin} className="mt-7 w-full rounded-lg bg-slate-900 text-white hover:bg-slate-800">Continue securely <ArrowRight className="ml-2 h-4 w-4" /></Button></aside> : <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,.08)] sm:p-8"><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Client workspace</p><div className="mt-7 space-y-3">{["Active projects", "Reviews awaiting a response", "Delivery preparation"].map((item, index) => <div key={item} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-4"><span className="text-sm font-medium text-slate-800">{item}</span><span className="text-xs text-slate-500">0{index + 1}</span></div>)}</div><p className="mt-6 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-500">A private workspace view appears only after a member has an active role in a workspace.</p></aside>}
      </section>

      <section id="process" className="border-y border-slate-200 bg-white px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">How it works</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.05em] text-slate-950">A steady path through complex work.</h2></div><div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-4">{stages.map(stage => <article key={stage.number} className="bg-white p-6"><span className="text-xs text-slate-400">{stage.number}</span><h3 className="mt-10 text-xl font-medium tracking-tight text-slate-900">{stage.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{stage.copy}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12"><div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Capabilities</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.05em] text-slate-950">Built around the actual work.</h2></div><div className="grid gap-4 sm:grid-cols-2">{capabilities.map(capability => <article key={capability.title} className="rounded-2xl border border-slate-200 bg-white p-6"><capability.icon className="h-5 w-5 text-slate-600" /><h3 className="mt-8 text-lg font-medium text-slate-900">{capability.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{capability.copy}</p></article>)}</div></div></section>

      <section className="border-t border-slate-200 px-5 py-16 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-3xl bg-slate-900 px-7 py-10 text-white md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300">Access</p><h2 className="mt-4 max-w-xl text-3xl font-medium tracking-[-0.04em]">Your workspace, when you are ready.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Client access follows an authorized invitation or approved membership path.</p></div><Button onClick={startLogin} className="rounded-lg bg-white text-slate-900 hover:bg-slate-100">Sign in <CheckCircle2 className="ml-2 h-4 w-4" /></Button></div></section>
    </main></>
  );
}
