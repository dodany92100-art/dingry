import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.hoisted(() => vi.fn());
const putMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ratelimit", () => ({
  getSharedRedis: () => null,
}));

vi.mock("@vercel/blob", () => ({
  get: (...args: unknown[]) => getMock(...args),
  put: (...args: unknown[]) => putMock(...args),
  del: vi.fn(),
  BlobPreconditionFailedError: class BlobPreconditionFailedError extends Error {
    constructor() {
      super("precondition");
      this.name = "BlobPreconditionFailedError";
    }
  },
}));

function order(id: string) {
  return {
    id,
    customerName: "Client",
    email: "c@test.fr",
    total: 42,
    items: ["Article"],
    status: "En attente" as const,
    createdAt: new Date().toISOString(),
    source: "paypal" as const,
  };
}

function storeBody(orders: ReturnType<typeof order>[]) {
  return JSON.stringify({
    version: 12,
    products: [],
    orders,
    lookbook: [],
    removedCatalogIds: [],
  });
}

function blobGet(body: string, etag: string) {
  return {
    statusCode: 200,
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      },
    }),
    blob: { etag },
  };
}

describe("withStoreOptimistic concurrence Blob (prod)", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
    putMock.mockResolvedValue({ url: "https://example/blob" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    getMock.mockReset();
    putMock.mockReset();
    vi.useRealTimers();
  });

  it("deux patchOrder en parallèle : file sérialisée, deux put réussis", async () => {
    const body = storeBody([order("ORD-1"), order("ORD-2")]);
    getMock.mockImplementation(async () => blobGet(body, "etag-shared"));

    const { patchOrder } = await import("@/lib/admin/store");
    await Promise.all([
      patchOrder("ORD-1", () => ({ status: "Expédié" })),
      patchOrder("ORD-2", () => ({ status: "Expédié" })),
    ]);

    expect(putMock).toHaveBeenCalledTimes(2);
  });

  it("412 puis nouveau etag : succès au retry (pas StoreConflictError)", async () => {
    const { BlobPreconditionFailedError } = await import("@vercel/blob");
    const body = storeBody([order("ORD-1")]);
    let getCalls = 0;
    getMock.mockImplementation(async () => {
      getCalls += 1;
      const etag = getCalls === 1 ? "etag-v1" : "etag-v2";
      return blobGet(body, etag);
    });
    putMock
      .mockRejectedValueOnce(new BlobPreconditionFailedError())
      .mockResolvedValueOnce({ url: "https://example/blob" });

    const { patchOrder } = await import("@/lib/admin/store");
    await expect(patchOrder("ORD-1", () => ({ status: "Expédié" }))).resolves.toEqual(
      expect.objectContaining({ changed: true }),
    );
    expect(putMock).toHaveBeenCalledTimes(2);
    expect(putMock.mock.calls[1]?.[2]).toMatchObject({ ifMatch: "etag-v2" });
  });

  it("412 sur tous les put → StoreConflictError", async () => {
    const { BlobPreconditionFailedError } = await import("@vercel/blob");
    const body = storeBody([order("ORD-1")]);
    getMock.mockImplementation(async () => blobGet(body, "etag-stuck"));
    putMock.mockRejectedValue(new BlobPreconditionFailedError());

    const { patchOrder, StoreConflictError } = await import("@/lib/admin/store");
    await expect(patchOrder("ORD-1", () => ({ status: "Expédié" }))).rejects.toBeInstanceOf(
      StoreConflictError,
    );
    expect(putMock.mock.calls.length).toBeGreaterThanOrEqual(8);
  }, 20_000);

  it("etag absent sur Blob existant : put allowOverwrite sans ifMatch", async () => {
    const body = storeBody([order("ORD-1")]);
    getMock.mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(body));
          controller.close();
        },
      }),
      blob: {},
    });

    const { patchOrder } = await import("@/lib/admin/store");
    const result = await patchOrder("ORD-1", () => ({ status: "Expédié" }));
    expect(result.changed).toBe(true);
    expect(putMock).toHaveBeenCalledTimes(1);
    const opts = putMock.mock.calls[0]?.[2] as Record<string, unknown> | undefined;
    expect(opts?.allowOverwrite).toBe(true);
    expect(opts && "ifMatch" in opts).toBe(false);
  });
});
