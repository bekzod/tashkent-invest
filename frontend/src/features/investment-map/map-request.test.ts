import { afterEach, describe, expect, test, vi } from "vitest";
import { MapRequestCoordinator } from "./map-request";

afterEach(() => vi.useRealTimers());

describe("MapRequestCoordinator", () => {
  test("aborts an older request and marks only the latest request as current", () => {
    const coordinator = new MapRequestCoordinator();

    const first = coordinator.begin();
    const second = coordinator.begin();

    expect(first.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(first.id)).toBe(false);
    expect(coordinator.isCurrent(second.id)).toBe(true);
  });

  test("coalesces a burst of viewport moves into one load after 250 ms", () => {
    vi.useFakeTimers();
    const coordinator = new MapRequestCoordinator();
    const load = vi.fn();

    coordinator.debounce(load);
    vi.advanceTimersByTime(100);
    coordinator.debounce(load);
    vi.advanceTimersByTime(100);
    coordinator.debounce(load);

    expect(load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(249);
    expect(load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("aborts work and clears a pending viewport timer when disposed", () => {
    vi.useFakeTimers();
    const coordinator = new MapRequestCoordinator();
    const request = coordinator.begin();
    const load = vi.fn();

    coordinator.debounce(load);
    coordinator.dispose();
    vi.runAllTimers();

    expect(request.signal.aborted).toBe(true);
    expect(load).not.toHaveBeenCalled();
  });
});
