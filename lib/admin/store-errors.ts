export class StoreConflictError extends Error {
  constructor() {
    super("store-conflict");
    this.name = "StoreConflictError";
  }
}

export class StoreUnavailableError extends Error {
  constructor(message = "Magasin indisponible.") {
    super(message);
    this.name = "StoreUnavailableError";
  }
}

export function isStoreWriteConflict(error: unknown): boolean {
  return error instanceof StoreConflictError;
}

export class PriceFamilyDuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PriceFamilyDuplicateError";
  }
}

export class CatalogMakerDuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogMakerDuplicateError";
  }
}
