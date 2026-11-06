type ParseResult = {
  error?: string;
  fields: {
    title?: string;
    caption?: string;
    sortOrder?: number;
  };
};

function readString(value: FormDataEntryValue | unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function readSortOrder(value: FormDataEntryValue | unknown): number | undefined {
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  return undefined;
}

export function parseLookbookFields(
  source: FormData | Record<string, unknown>,
  options?: { partial?: boolean },
): ParseResult {
  const partial = options?.partial ?? false;
  const get = (key: string): FormDataEntryValue | unknown =>
    source instanceof FormData ? source.get(key) : source[key];

  const title = readString(get("title"));
  const caption = readString(get("caption"));
  const sortOrder = readSortOrder(get("sortOrder"));

  if (!partial && !title) {
    return { error: "Le titre est requis.", fields: {} };
  }

  return {
    fields: {
      ...(title ? { title } : {}),
      ...(caption || partial ? { caption } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    },
  };
}
