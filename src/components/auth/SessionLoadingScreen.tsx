export default function SessionLoadingScreen() {
  return (
    <main className="min-h-screen bg-[#070806] px-6 py-6 text-[#f4f0e6] sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1600px] animate-pulse">
        <div className="flex items-center justify-between border-b border-[#d8c79a]/15 pb-5">
          <div className="h-10 w-48 rounded bg-white/[.06]" />
          <div className="h-8 w-56 rounded bg-white/[.04]" />
          <div className="h-10 w-24 rounded bg-white/[.04]" />
        </div>
        <div className="grid min-h-[75vh] items-center gap-12 py-12 lg:grid-cols-[.75fr_1.25fr]">
          <div className="space-y-5">
            <div className="h-3 w-28 rounded bg-[#e4c66a]/20" />
            <div className="h-16 w-4/5 rounded bg-white/[.07]" />
            <div className="h-16 w-3/5 rounded bg-white/[.05]" />
            <div className="h-10 w-36 rounded bg-[#e4c66a]/15" />
          </div>
          <div className="aspect-video rounded-xl border border-white/5 bg-white/[.035]" />
        </div>
      </div>
      <p className="sr-only" role="status">Loading your session</p>
    </main>
  );
}
