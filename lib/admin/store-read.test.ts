import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.hoisted(() => vi.fn());
const putMock = vi.hoisted(() => vi.fn());

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

describe("readBlobSnapshot via withStoreOptimistic", () => {
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
  });

  it("get en échec ne déclenche aucun put", async () => {
    getMock.mockRejectedValue(new Error("network timeout"));
    const { insertOrderIfNew, StoreUnavailableError } = await import("@/lib/admin/store");
    await expect(
      insertOrderIfNew({
        id: "TEST-ORDER",
        customerName: "Test",
        email: "t@test.fr",
        total: 35,
        items: ["Tee"],
        status: "En attente",
        createdAt: new Date().toISOString(),
        source: "paypal",
      }),
    ).rejects.toBeInstanceOf(StoreUnavailableError);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("JSON blob invalide ne déclenche aucun put", async () => {
    getMock.mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("{not-json"));
          controller.close();
        },
      }),
      blob: { etag: "etag-1" },
    });
    const { insertOrderIfNew, StoreUnavailableError } = await import("@/lib/admin/store");
    await expect(
      insertOrderIfNew({
        id: "TEST-ORDER-2",
        customerName: "Test",
        email: "t@test.fr",
        total: 35,
        items: ["Tee"],
        status: "En attente",
        createdAt: new Date().toISOString(),
        source: "paypal",
      }),
    ).rejects.toBeInstanceOf(StoreUnavailableError);
    expect(putMock).not.toHaveBeenCalled();
  });
});

describe("loadStoreReadOnly en production", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    getMock.mockReset();
  });

  it("erreur réseau → StoreUnavailableError (pas de seed)", async () => {
    getMock.mockRejectedValue(new Error("503"));
    const { loadStoreReadOnly, StoreUnavailableError } = await import("@/lib/admin/store");
    await expect(loadStoreReadOnly()).rejects.toBeInstanceOf(StoreUnavailableError);
  });

  it("preview Vercel sans blob → catalogue seed", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    const { loadStoreReadOnly } = await import("@/lib/admin/store");
    const store = await loadStoreReadOnly();
    expect(store.products.length).toBeGreaterThan(0);
  });

  it("preview Vercel avec token blob : erreur réseau → StoreUnavailableError", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
    getMock.mockRejectedValue(new Error("network"));
    const { loadStoreReadOnly, StoreUnavailableError } = await import("@/lib/admin/store");
    await expect(loadStoreReadOnly()).rejects.toBeInstanceOf(StoreUnavailableError);
  });
});
