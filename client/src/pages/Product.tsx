import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { ArrowRight, Boxes, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import { Link } from "wouter";

const chapters = [
  { icon: Waypoints, name: "Workspace engine", detail: "Personal and organization spaces, scoped roles, invitations, project context, and activity records begin from one canonical data model." },
  { icon: Sparkles, name: "Moodoor Studio", detail: "Creative projects use the same membership and project boundary for assets, review state, approvals, delivery, and publishing-ready work." },
  { icon: ShieldCheck, name: "Governance layer", detail: "Typed server contracts, tenant checks, audit events, feature gates, and durable job records turn operational promises into enforceable behavior." },
  { icon: Boxes, name: "Platform services", detail: "Notifications, storage metadata, entitlement foundations, support records, and asynchronous work remain shared capabilities rather than disconnected tools." },
];

export default function Product() {
  return <main className="min-h-screen bg-[#f7f5ef] text-[#17202b]"><nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12"><Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#17202b] text-sm text-[#f7f5ef]">E</span>Evercrafted</Link><div className="flex gap-3"><Link href="/pricing" className="inline-flex h-9 items-center rounded-full px-4 text-sm hover:bg-[#e7dfd0]">Pricing</Link><Button onClick={startLogin} className="h-9 rounded-full bg-[#17202b] px-4 hover:bg-[#2a3746]">Create a space</Button></div></nav><section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 lg:px-12"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c65e32]">The Evercrafted product</p><h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl">A shared engine for the work and the system around it.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[#56636d]">Evercrafted is not a collection of pages. It is one tenant-aware platform that lets the public product, customer workspace, Moodoor Studio, and owner controls evolve on the same contracts.</p><Button onClick={startLogin} size="lg" className="mt-9 rounded-full bg-[#df6e39] px-6 hover:bg-[#c45d2e]">Start with your personal space <ArrowRight className="ml-1 h-4 w-4" /></Button><div className="mt-16 grid gap-4 md:grid-cols-2">{chapters.map(chapter => <article key={chapter.name} className="rounded-3xl border border-[#17202b]/10 bg-white/70 p-7 shadow-sm"><chapter.icon className="h-6 w-6 text-[#516f5e]" /><h2 className="mt-8 text-2xl font-semibold tracking-tight">{chapter.name}</h2><p className="mt-3 text-sm leading-7 text-[#5b6872]">{chapter.detail}</p></article>)}</div></section></main>;
}
