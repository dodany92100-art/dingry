import { describe, expect, it, vi } from "vitest";
import {
  finishDingryRouteProgress,
  startDingryRouteProgress,
  subscribeDingryRouteProgress,
} from "@/lib/dingry-route-progress";

describe("dingry-route-progress", () => {
  it("start puis finish", () => {
    vi.useFakeTimers();
    const values: number[] = [];
    const unsub = subscribeDingryRouteProgress((v, visible) => {
      if (visible) values.push(v);
    });
    startDingryRouteProgress();
    expect(values[0]).toBeGreaterThan(0);
    finishDingryRouteProgress();
    expect(values.at(-1)).toBe(1);
    vi.advanceTimersByTime(400);
    unsub();
    vi.useRealTimers();
  });
});