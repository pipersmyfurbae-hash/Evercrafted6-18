export default function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return <a href={`#${targetId}`} className="fixed left-4 top-4 z-[100] -translate-y-16 rounded-md bg-stone-950 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform focus:translate-y-0">Skip to main content</a>;
}
