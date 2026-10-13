export type PerformanceSnapshot = {
  metadataRequests: number;
  metadataRetries: number;
  lastLibraryRenderMs: number;
};

const initialSnapshot: PerformanceSnapshot = {
  metadataRequests: 0,
  metadataRetries: 0,
  lastLibraryRenderMs: 0,
};

let snapshot = initialSnapshot;
const listeners = new Set<() => void>();

function updateSnapshot(update: Partial<PerformanceSnapshot>) {
  snapshot = { ...snapshot, ...update };
  listeners.forEach((listener) => listener());
}

export function recordMetadataRequest() {
  updateSnapshot({ metadataRequests: snapshot.metadataRequests + 1 });
}

export function recordMetadataRetry() {
  updateSnapshot({ metadataRetries: snapshot.metadataRetries + 1 });
}

export function recordLibraryRender(durationMs: number) {
  updateSnapshot({ lastLibraryRenderMs: durationMs });
}

export function getPerformanceSnapshot() {
  return snapshot;
}

export function getServerPerformanceSnapshot() {
  return initialSnapshot;
}

export function subscribePerformance(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetPerformanceMetrics() {
  snapshot = initialSnapshot;
  listeners.forEach((listener) => listener());
}
