import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <main className="evercrafted-surface flex min-h-screen flex-col">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12" aria-label="Evercrafted navigation"><Link href="/" className="font-editorial text-2xl tracking-[-.04em] text-stone-900">Evercrafted</Link><Link href="/" className="text-sm font-medium text-stone-700">Home</Link></nav>
      <section className="mx-auto flex w-full max-w-7xl flex-1 items-center px-5 py-16 sm:px-8 lg:px-12"><div className="max-w-3xl"><p className="text-xs uppercase tracking-[.2em] text-stone-500">Evercrafted · 404</p><h1 className="font-editorial mt-8 text-6xl leading-[.88] tracking-[-.055em] text-stone-900 sm:text-8xl">This room is not here.</h1><p className="mt-8 max-w-xl text-base leading-7 text-stone-600">The page may have moved, or the path may not be part of Evercrafted. Return to the public collection and begin again from a known place.</p><Link href="/" className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-stone-800"><ArrowLeft className="h-4 w-4" /> Return to Evercrafted</Link></div></section>
    </main>
  );
}
