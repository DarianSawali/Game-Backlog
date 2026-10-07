"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md rounded-xl border p-6 text-center">
        <h1 className="text-2xl font-semibold">
          We couldn&apos;t load your backlog
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Steam may be temporarily unavailable. Try loading the page again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-lg bg-black px-5 py-2 text-white dark:bg-white dark:text-black"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
