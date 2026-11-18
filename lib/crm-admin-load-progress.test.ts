import { describe, expect, it } from "vitest";
import {
  finishCrmAdminLoadProgress,
  setCrmAdminLoadProgress,
  startCrmAdminLoadProgress,
  subscribeCrmAdminLoadProgress,
} from "@/lib/crm-admin-load-progress";

describe("crm-admin-load-progress", () => {
  it("publie visible puis termine", () => {
    const values: number[] = [];
    const vis: boolean[] = [];
    const unsub = subscribeCrmAdminLoadProgress((v, on) => {
      values.push(v);
      vis.push(on);
    });
    startCrmAdminLoadProgress();
    setCrmAdminLoadProgress(0.5);
    finishCrmAdminLoadProgress();
    unsub();
    expect(vis.some(Boolean)).toBe(true);
    expect(Math.max(...values)).toBe(1);
  });
});