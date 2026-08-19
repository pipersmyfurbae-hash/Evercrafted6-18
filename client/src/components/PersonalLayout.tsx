import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Activity, Blocks, LayoutDashboard, LockKeyhole, Settings2, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";

const personalNav = [
  { label: "Command", href: "/personal", icon: LayoutDashboard },
  { label: "Private projects", href: "/personal#projects", icon: Blocks },
  { label: "Operations", href: "/personal#operations", icon: Activity },
  { label: "Administration", href: "/personal#administration", icon: ShieldCheck },
  { label: "Integrations", href: "/personal#integrations", icon: Settings2 },
];

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) return <div className="personal-surface grid min-h-screen place-items-center text-sm text-stone-300">Opening private command…</div>;
  if (!user) return <div className="personal-surface grid min-h-screen place-items-center p-6"><div className="max-w-sm text-center"><LockKeyhole className="mx-auto h-7 w-7 text-[#dcc7a0]" /><h1 className="font-editorial mt-5 text-4xl">Private command</h1><p className="mt-4 text-sm leading-6 text-stone-300">Sign in to verify whether this owner-only space is available to you.</p><Button onClick={startLogin} className="mt-7 rounded-full bg-[#dcc7a0] text-stone-900 hover:bg-[#ead8b8]">Sign in</Button></div></div>;

  return <div className="personal-surface min-h-screen lg:grid lg:grid-cols-[252px_1fr]">
    <aside className="border-b border-white/10 bg-[#1b1a18] p-5 lg:min-h-screen lg:border-b-0 lg:border-r">
      <Link href="/personal" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-[#dcc7a0]"><LockKeyhole className="h-4 w-4" /></span><span><span className="block text-xs uppercase tracking-[.16em] text-stone-400">Evercrafted</span><span className="font-editorial block text-xl tracking-tight text-stone-100">Personal</span></span></Link>
      <nav className="mt-10 grid gap-1" aria-label="Personal navigation">{personalNav.map(item => <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${location === item.href ? "bg-white/10 text-white" : "text-stone-400 hover:bg-white/5 hover:text-stone-200"}`}><item.icon className="h-4 w-4" />{item.label}</Link>)}</nav>
      <div className="mt-10 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#dcc7a0] text-xs font-medium text-stone-900">{user.name?.slice(0, 1).toUpperCase() || "O"}</div><div className="min-w-0"><p className="truncate text-sm text-stone-100">{user.name || "Owner"}</p><p className="truncate text-xs text-stone-400">Private access</p></div></div>
    </aside>
    <main className="min-w-0 bg-[#262422] p-4 md:p-7 lg:p-10">{children}</main>
  </div>;
}
