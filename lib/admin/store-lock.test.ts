import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.hoisted(() => vi.fn());
const putMock = vi.hoisted(() => vi.fn());
const redisSet = vi.hoisted(() => vi.fn());
const redisEval = vi.hoisted(() => vi.fn());

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

vi.mock("@/lib/ratelimit", () => ({
  getSharedRedis: () => ({
    set: redisSet,
    eval: redisEval,
  }),
}));

function order() {
  return {
    id: "ORD-1",
    customerName: "A",
    email: "a@b.fr",
    total: 10,
    items: [],
    status: "En attente" as const,
    createdAt: new Date().toISOString(),
    source: "paypal" as const,
  };
}

describe("verrou Redis store", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
    redisSet.mockResolvedValue("OK");
    redisEval.mockResolvedValue(1);
    putMock.mockResolvedValue({ url: "https://example/blob" });
    const body = JSON.stringify({
      version: 13,
      products: [],
      orders: [order()],
      lookbook: [],
      removedCatalogIds: [],
    });
    getMock.mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(body));
          controller.close();
        },
      }),
      blob: { etag: "etag-1" },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    getMock.mockReset();
    putMock.mockReset();
    redisSet.mockReset();
    redisEval.mockReset();
  });

  it("prend et libère dingry:store-lock autour du put", async () => {
    const { patchOrder } = await import("@/lib/admin/store");
    await patchOrder("ORD-1", () => ({ status: "Expédié" }));
    expect(redisSet).toHaveBeenCalledWith(
      "dingry:store-lock",
      expect.any(String),
      expect.objectContaining({ nx: true, ex: 20 }),
    );
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(redisEval).toHaveBeenCalled();
  });

  it(
    "StoreConflictError si le lock n'est jamais acquis",
    async () => {
      redisSet.mockResolvedValue(null);
      const { patchOrder, StoreConflictError } = await import("@/lib/admin/store");
      await expect(patchOrder("ORD-1", () => ({ status: "Expédié" }))).rejects.toBeInstanceOf(
        StoreConflictError,
      );
      expect(putMock).not.toHaveBeenCalled();
    },
    20_000,
  );
});
