export default function Loading() {
  return (
    <main className="min-h-screen p-8" aria-busy="true">
      <div className="h-9 w-52 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-8 h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900"
          />
        ))}
      </div>
      <p className="sr-only">Loading your Steam library</p>
    </main>
  );
}
