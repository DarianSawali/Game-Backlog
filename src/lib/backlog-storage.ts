export function parseStoredRecord<T>(
  raw: string | null,
  isValidValue: (value: unknown) => value is T
): Record<string, T> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, T] => isValidValue(entry[1])
      )
    );
  } catch {
    return {};
  }
}

export function updateStoredRecord<T>(
  record: Record<string, T>,
  appid: number,
  value: T | null
) {
  const nextRecord = { ...record };
  const key = String(appid);

  if (value === null) {
    delete nextRecord[key];
  } else {
    nextRecord[key] = value;
  }

  return nextRecord;
}

export function parseStoredStringArray(
  raw: string | null,
  allowedValues?: ReadonlySet<string>
) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return [...new Set(parsed.filter(
      (value): value is string =>
        typeof value === "string" && (!allowedValues || allowedValues.has(value))
    ))];
  } catch {
    return [];
  }
}

export function toggleStoredStringValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
