"use client";

import { useSyncExternalStore } from "react";
import {
  getPerformanceSnapshot,
  getServerPerformanceSnapshot,
  subscribePerformance,
} from "@/lib/performance";

export default function PerformanceSummary() {
  const metrics = useSyncExternalStore(
    subscribePerformance,
    getPerformanceSnapshot,
    getServerPerformanceSnapshot
  );

  return (
    <details className="mt-4 text-xs text-gray-500">
      <summary className="cursor-pointer">Performance details</summary>
      <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-3">
        <div>
          <dt>Last grid render</dt>
          <dd>{metrics.lastLibraryRenderMs.toFixed(1)} ms</dd>
        </div>
        <div>
          <dt>Metadata requests</dt>
          <dd>{metrics.metadataRequests}</dd>
        </div>
        <div>
          <dt>Metadata retries</dt>
          <dd>{metrics.metadataRetries}</dd>
        </div>
      </dl>
    </details>
  );
}
