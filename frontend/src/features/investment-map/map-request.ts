export type MapRequest = {
  id: number;
  signal: AbortSignal;
};

/**
 * Keeps map viewport work to one request at a time and makes stale responses
 * impossible to apply. It intentionally has no React dependency so its
 * cancellation and debounce behaviour remains easy to test.
 */
export class MapRequestCoordinator {
  private controller: AbortController | undefined;
  private currentId = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  begin(): MapRequest {
    this.controller?.abort();
    this.controller = new AbortController();
    this.currentId += 1;

    return { id: this.currentId, signal: this.controller.signal };
  }

  isCurrent(id: number) {
    return id === this.currentId && !this.controller?.signal.aborted;
  }

  debounce(callback: () => void, delay = 250) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      callback();
    }, delay);
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.controller?.abort();
    this.controller = undefined;
  }
}
