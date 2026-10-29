export const VIEWED_THRESHOLD_MS = 1000;

export function qualifiesWordView(durationMs: number, foreground: boolean): boolean {
  return foreground && Number.isFinite(durationMs) && durationMs >= VIEWED_THRESHOLD_MS;
}

export class ViewedExposureTracker {
  private readonly visibleSince = new Map<string, number>();
  private readonly recorded = new Set<string>();

  markVisible(itemId: string, now: number, foreground: boolean): void {
    if (foreground && !this.visibleSince.has(itemId)) this.visibleSince.set(itemId, now);
  }

  markHidden(itemId: string): void { this.visibleSince.delete(itemId); }

  markBackground(): void { this.visibleSince.clear(); }

  qualifying(now: number, foreground: boolean): string[] {
    if (!foreground) return [];
    const result: string[] = [];
    for (const [itemId, since] of this.visibleSince) {
      if (!this.recorded.has(itemId) && qualifiesWordView(now - since, foreground)) {
        this.recorded.add(itemId);
        result.push(itemId);
      }
    }
    return result;
  }
}
