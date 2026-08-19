import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import SkipLink from "@/components/SkipLink";
import { ArrowLeft, ArrowRight, ArrowUpRight, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type EditorialPage = {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  kind: "overview" | "detail" | "article" | "contact" | "legal" | "account";
  action?: { label: string; href: string };
};

const sharedImage = "/manus-storage/evercrafted-neutral-interior_7597196d.jpg";

const pages: Record<string, EditorialPage> = {
  "/collections": {
    eyebrow: "Evercrafted collections",
    title: "Curated by material, not momentum.",
    body: "An evolving edit of material stories, considered pairings, and pieces selected to work together without asking for attention.",
    image: "/manus-storage/evercrafted-stone-vessel_520e889f.png",
    imageAlt: "Stone vessel on a textured surface",
    kind: "overview",
    action: { label: "Read the material study", href: "/collections/material-studies" },
  },
  "/collections/material-studies": {
    eyebrow: "Collection study · 01",
    title: "Material studies: stone, surface, and restraint.",
    body: "A collection route for reviewing the relationship between texture, proportion, and the daily use of a room. Specific catalogue availability and product detail will be published only from verified commerce records.",
    image: "/manus-storage/evercrafted-stone-vessel_520e889f.png",
    imageAlt: "Stone vessel on a textured surface",
    kind: "detail",
    action: { label: "Return to collections", href: "/collections" },
  },
  "/journal": {
    eyebrow: "Evercrafted journal",
    title: "The record of a room.",
    body: "Notes on material, process, spaces, and the work that gives lasting objects their point of view.",
    image: "/manus-storage/evercrafted-studio-workspace_9400a257.jpg",
    imageAlt: "Minimal studio workspace",
    kind: "overview",
    action: { label: "Read a journal note", href: "/journal/the-patience-of-material" },
  },
  "/journal/the-patience-of-material": {
    eyebrow: "Journal · Material",
    title: "The patience of material.",
    body: "A room does not need to announce itself to feel complete. Often, clarity emerges from a slower sequence: observe the light, understand the surface, and choose only what supports the way a space is actually used.",
    image: "/manus-storage/evercrafted-studio-workspace_9400a257.jpg",
    imageAlt: "Minimal studio workspace",
    kind: "article",
    action: { label: "Return to the journal", href: "/journal" },
  },
  "/about": {
    eyebrow: "About Evercrafted",
    title: "Built around the long view.",
    body: "Evercrafted is interested in objects that make daily life more grounded: pieces with material presence, practical intelligence, and a reason to stay.",
    image: sharedImage,
    imageAlt: "Calm neutral interior with architectural detailing",
    kind: "overview",
    action: { label: "Read the journal", href: "/journal" },
  },
  "/contact": {
    eyebrow: "Contact",
    title: "Start a conversation.",
    body: "For collection questions, sourcing inquiries, product details, or a specific space, send a note and we will respond with the information needed to move forward.",
    image: sharedImage,
    imageAlt: "Calm neutral interior with architectural detailing",
    kind: "contact",
    action: { label: "Return to Evercrafted", href: "/" },
  },
  "/privacy": {
    eyebrow: "Evercrafted legal",
    title: "Privacy, stated plainly.",
    body: "Evercrafted collects only the information necessary to respond to an inquiry, manage an account where one is offered, and maintain required operational records. The published privacy policy will be completed with verified legal and commerce details before release.",
    image: sharedImage,
    imageAlt: "Calm neutral interior with architectural detailing",
    kind: "legal",
    action: { label: "Read terms", href: "/terms" },
  },
  "/terms": {
    eyebrow: "Evercrafted legal",
    title: "Terms for a considered exchange.",
    body: "This route reserves a clear, public home for the terms that will govern transactions and account use. Final terms, fulfilment information, and returns language will be published only once the corresponding verified business information is available.",
    image: sharedImage,
    imageAlt: "Calm neutral interior with architectural detailing",
    kind: "legal",
    action: { label: "Read privacy", href: "/privacy" },
  },
  "/account": {
    eyebrow: "Evercrafted account",
    title: "A quieter way to return.",
    body: "Use your existing Evercrafted sign-in to reach your protected account and workspace information. The public editorial experience remains separate from client operations.",
    image: sharedImage,
    imageAlt: "Calm neutral interior with architectural detailing",
    kind: "account",
  },
  "/sign-in": {
    eyebrow: "Evercrafted account",
    title: "Sign in to continue.",
    body: "Sign-in protects account and workspace data. It does not alter access to public Evercrafted collections or journal notes.",
    image: sharedImage,
    imageAlt: "Calm neutral interior with architectural detailing",
    kind: "account",
  },
};

function EditorialNavigation() {
  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12" aria-label="Evercrafted navigation">
      <Link href="/" className="font-editorial text-2xl tracking-[-.04em] text-stone-900">Evercrafted</Link>
      <div className="hidden gap-6 text-sm text-stone-600 md:flex">
        <Link href="/collections">Collections</Link><Link href="/journal">Journal</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link>
      </div>
      <Link href="/account" className="text-sm font-medium text-stone-800">Account</Link>
    </nav>
  );
}

function AccountAction() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <p className="mt-10 text-sm text-stone-600">Checking your account…</p>;
  if (isAuthenticated) {
    return <Button asChild className="mt-10 rounded-full bg-stone-900 px-6 text-white hover:bg-stone-700"><Link href="/profile">Open account</Link></Button>;
  }
  return <Button onClick={startLogin} className="mt-10 rounded-full bg-stone-900 px-6 text-white hover:bg-stone-700">Sign in <LogIn className="ml-2 h-4 w-4" /></Button>;
}

export default function EvercraftedPages() {
  const [location] = useLocation();
  const page = pages[location] ?? pages["/collections"];
  const isReading = page.kind === "article" || page.kind === "legal";

  return (
    <><SkipLink /><main id="main-content" className="evercrafted-surface min-h-screen">
      <EditorialNavigation />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[.86fr_1.14fr] lg:px-12 lg:pb-24 lg:pt-24">
        <div className="flex flex-col justify-center">
          {isReading ? <Link href={page.kind === "article" ? "/journal" : "/"} className="mb-12 inline-flex items-center gap-2 text-sm text-stone-600"><ArrowLeft className="h-4 w-4" /> Back</Link> : null}
          <p className="text-xs uppercase tracking-[.2em] text-stone-500">{page.eyebrow}</p>
          <h1 className="font-editorial mt-7 text-5xl leading-[.9] tracking-[-.055em] text-stone-900 sm:text-7xl">{page.title}</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-stone-600">{page.body}</p>
          {page.kind === "account" ? <AccountAction /> : page.action ? <Link href={page.action.href} className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-stone-800">{page.action.label} <ArrowRight className="h-4 w-4" /></Link> : null}
        </div>
        <div className="overflow-hidden rounded-[2rem] bg-stone-200"><img src={page.image} alt={page.imageAlt} className="h-full min-h-[420px] w-full object-cover" /></div>
      </section>
      {page.kind === "detail" ? <section className="border-y border-stone-300 bg-[#ece8df] px-5 py-16 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3"><p className="font-editorial text-3xl text-stone-900">A collection begins with relationship.</p><p className="text-sm leading-7 text-stone-600">Surface, scale, and the passing of light are considered together before any object is asked to occupy a room.</p><p className="text-sm leading-7 text-stone-600">Verified catalog records will determine product availability, specifications, and commerce actions when they are ready to be published.</p></div></section> : null}
      {page.kind === "contact" ? <section className="border-t border-stone-300 bg-[#e4ded2] px-5 py-16 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><p className="font-editorial max-w-2xl text-3xl tracking-[-.035em] text-stone-900">For a considered start, use the inquiry form on the Evercrafted home page.</p><Link href="/#contact" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-stone-800">Open inquiry form <ArrowUpRight className="h-4 w-4" /></Link></div></section> : null}
      <footer className="border-t border-stone-300 px-5 py-8 text-sm text-stone-500 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>Evercrafted</span><div className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/client">Client workspace</Link></div></div></footer>
    </main></>
  );
}
