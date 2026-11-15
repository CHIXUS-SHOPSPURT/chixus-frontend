import { API_ENDPOINTS } from '../apiConfig';

export type ConnectivityStatus = 'unknown' | 'stable' | 'unstable' | 'poor';

export interface ConnectivityMonitorConfig {
  /** Polling interval while the app tab is visible (ms). */
  checkIntervalMs: number;
  /** Maximum duration to wait for a GET /health response before timing out (ms). */
  requestTimeoutMs: number;
  /** Latency at or below this threshold is considered fast/stable (ms). */
  stableLatencyThresholdMs: number;
  /** Latency above this threshold is considered severely degraded (ms). */
  poorLatencyThresholdMs: number;
  /** Latency fluctuation spread across recent samples considered elevated jitter (ms). */
  jitterThresholdMs: number;
  /** Consecutive elevated/fluctuating samples or failures needed before moving from stable to unstable (Yellow). */
  consecutiveDelaysForUnstable: number;
  /** Consecutive failures required before reporting poor/unavailable connectivity (Red). */
  consecutiveFailuresForPoor: number;
  /** Consecutive severe latency responses (> poorLatencyThresholdMs) before reporting poor (Red). */
  consecutiveSevereForPoor: number;
  /** Consecutive fast, steady responses needed to recover from unstable/poor back to stable (Green). */
  consecutiveGoodForStable: number;
  /** Number of recent successful latency samples kept for fluctuation analysis. */
  historyWindowSize: number;
  /** Minimum delay between event-triggered checks to prevent request bursts (ms). */
  minCheckGapMs: number;
  /** Resolver returning the CHIXUS backend GET /health URL. */
  healthUrlResolver: () => string;
}

export interface ConnectivitySnapshot {
  status: ConnectivityStatus;
  latencyMs: number | null;
  consecutiveFailures: number;
  lastCheckedAt: number | null;
  isChecking: boolean;
}

export const DEFAULT_CONNECTIVITY_CONFIG: ConnectivityMonitorConfig = {
  checkIntervalMs: 20000,
  requestTimeoutMs: 4500,
  stableLatencyThresholdMs: 900,
  poorLatencyThresholdMs: 3000,
  jitterThresholdMs: 650,
  consecutiveDelaysForUnstable: 2,
  consecutiveFailuresForPoor: 3,
  consecutiveSevereForPoor: 2,
  consecutiveGoodForStable: 2,
  historyWindowSize: 5,
  minCheckGapMs: 2500,
  healthUrlResolver: () => API_ENDPOINTS.HEALTH()
};

export type ConnectivityListener = (snapshot: ConnectivitySnapshot) => void;

export class NetworkConnectivityMonitor {
  private config: ConnectivityMonitorConfig;
  private listeners = new Set<ConnectivityListener>();
  private intervalId: number | null = null;
  private activeAbortController: AbortController | null = null;
  private activeTimeoutId: number | null = null;
  private isRunning = false;
  private latencyHistory: number[] = [];
  private consecutiveElevatedSamples = 0;
  private consecutiveSevereSamples = 0;
  private consecutiveGoodSamples = 0;

  private snapshot: ConnectivitySnapshot = {
    status: 'unknown',
    latencyMs: null,
    consecutiveFailures: 0,
    lastCheckedAt: null,
    isChecking: false
  };

  constructor(configOverrides: Partial<ConnectivityMonitorConfig> = {}) {
    this.config = {
      ...DEFAULT_CONNECTIVITY_CONFIG,
      ...configOverrides
    };
  }

  public updateConfig(configOverrides: Partial<ConnectivityMonitorConfig>): void {
    const intervalChanged =
      typeof configOverrides.checkIntervalMs === 'number' &&
      configOverrides.checkIntervalMs !== this.config.checkIntervalMs;

    this.config = {
      ...this.config,
      ...configOverrides
    };

    if (intervalChanged && this.isRunning) {
      this.restartPollingTimer();
    }
  }

  public getSnapshot(): ConnectivitySnapshot {
    return { ...this.snapshot };
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());

    if (!this.isRunning && this.listeners.size > 0) {
      this.start();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  public start(): void {
    if (this.isRunning || typeof window === 'undefined') return;
    this.isRunning = true;

    window.addEventListener('online', this.handleBrowserOnline);
    window.addEventListener('offline', this.handleBrowserOffline);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.restartPollingTimer();
    void this.checkNow({ force: true });
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleBrowserOnline);
      window.removeEventListener('offline', this.handleBrowserOffline);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.clearPollingTimer();
    this.abortPendingRequest();
  }

  public async checkNow(options: { force?: boolean } = {}): Promise<ConnectivitySnapshot> {
    if (typeof window === 'undefined') return this.getSnapshot();

    const now = Date.now();
    if (
      !options.force &&
      this.snapshot.lastCheckedAt !== null &&
      now - this.snapshot.lastCheckedAt < this.config.minCheckGapMs
    ) {
      return this.getSnapshot();
    }

    // Do not rely exclusively on navigator.onLine for positive connectivity,
    // but respect explicit OS offline state to avoid futile background requests.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.markOffline(now);
      return this.getSnapshot();
    }

    // Prevent overlapping health requests
    if (this.activeAbortController) {
      return this.getSnapshot();
    }

    const controller = new AbortController();
    this.activeAbortController = controller;
    let timedOut = false;

    this.setSnapshot({
      ...this.snapshot,
      isChecking: true
    });

    this.activeTimeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.config.requestTimeoutMs);

    const startMs = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const healthUrl = this.config.healthUrlResolver();
      const response = await fetch(healthUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        },
        signal: controller.signal
      });

      this.clearTimeoutTimer();
      this.activeAbortController = null;

      if (!response.ok) {
        this.recordFailure(Date.now());
        return this.getSnapshot();
      }

      const endMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const latencyMs = Math.max(1, Math.round(endMs - startMs));
      this.recordSuccess(latencyMs, Date.now());
      return this.getSnapshot();
    } catch {
      this.clearTimeoutTimer();
      const abortedByStop = controller.signal.aborted && !timedOut;
      this.activeAbortController = null;

      if (!abortedByStop) {
        this.recordFailure(Date.now());
      } else {
        this.setSnapshot({
          ...this.snapshot,
          isChecking: false
        });
      }
      return this.getSnapshot();
    }
  }

  private recordSuccess(latencyMs: number, checkedAt: number): void {
    const prevLatency =
      this.latencyHistory.length > 0
        ? this.latencyHistory[this.latencyHistory.length - 1]
        : null;

    this.latencyHistory.push(latencyMs);
    if (this.latencyHistory.length > this.config.historyWindowSize) {
      this.latencyHistory.shift();
    }

    const isSevereLatency = latencyMs > this.config.poorLatencyThresholdMs;
    const isElevatedLatency = latencyMs > this.config.stableLatencyThresholdMs;
    const fastJumpWithinBand =
      !isElevatedLatency &&
      prevLatency !== null &&
      prevLatency <= this.config.stableLatencyThresholdMs &&
      Math.abs(latencyMs - prevLatency) > this.config.jitterThresholdMs;

    if (isSevereLatency) {
      this.consecutiveSevereSamples += 1;
      this.consecutiveElevatedSamples += 1;
      this.consecutiveGoodSamples = 0;
    } else if (isElevatedLatency || fastJumpWithinBand) {
      this.consecutiveSevereSamples = 0;
      this.consecutiveElevatedSamples += 1;
      this.consecutiveGoodSamples = 0;
    } else {
      // Fast, steady response (<= stableLatencyThresholdMs): do not penalize recovery from a prior spike
      this.consecutiveSevereSamples = 0;
      this.consecutiveElevatedSamples = 0;
      this.consecutiveGoodSamples += 1;
    }

    const elevatedInWindow = this.latencyHistory.filter(
      (sample) => sample > this.config.stableLatencyThresholdMs
    ).length;

    const prevStatus = this.snapshot.status;
    let nextStatus: ConnectivityStatus = prevStatus;

    if (prevStatus === 'unknown') {
      if (isSevereLatency && this.config.consecutiveSevereForPoor <= 1) {
        nextStatus = 'poor';
      } else if (isElevatedLatency) {
        nextStatus = 'unstable';
      } else {
        nextStatus = 'stable';
      }
    } else if (this.consecutiveSevereSamples >= this.config.consecutiveSevereForPoor) {
      nextStatus = 'poor';
    } else if (
      this.consecutiveElevatedSamples >= this.config.consecutiveDelaysForUnstable ||
      (isElevatedLatency && elevatedInWindow >= this.config.consecutiveDelaysForUnstable)
    ) {
      nextStatus = 'unstable';
    } else if (!isElevatedLatency && !fastJumpWithinBand) {
      if (prevStatus === 'poor' || prevStatus === 'unstable') {
        nextStatus =
          this.consecutiveGoodSamples >= this.config.consecutiveGoodForStable
            ? 'stable'
            : 'unstable';
      } else {
        nextStatus = 'stable';
      }
    }
    // Single temporary delay while 'stable' leaves status as 'stable' (anti-flicker hysteresis).

    this.setSnapshot({
      status: nextStatus,
      latencyMs,
      consecutiveFailures: 0,
      lastCheckedAt: checkedAt,
      isChecking: false
    });
  }

  private recordFailure(checkedAt: number): void {
    const nextFailures = this.snapshot.consecutiveFailures + 1;
    this.consecutiveGoodSamples = 0;
    this.consecutiveElevatedSamples += 1;
    this.consecutiveSevereSamples += 1;

    const prevStatus = this.snapshot.status;
    let nextStatus: ConnectivityStatus = prevStatus;

    if (nextFailures >= this.config.consecutiveFailuresForPoor) {
      nextStatus = 'poor';
    } else if (prevStatus === 'unknown') {
      // Do not display green when initial health check fails
      nextStatus = 'unstable';
    } else if (
      prevStatus === 'stable' &&
      nextFailures >= this.config.consecutiveDelaysForUnstable
    ) {
      nextStatus = 'unstable';
    }
    // Single transient failure when already 'stable' (consecutiveDelaysForUnstable > 1)
    // does not immediately flip colour until repeated failure/delay confirms instability.

    this.setSnapshot({
      status: nextStatus,
      latencyMs: null,
      consecutiveFailures: nextFailures,
      lastCheckedAt: checkedAt,
      isChecking: false
    });
  }

  private markOffline(now: number): void {
    this.abortPendingRequest();
    this.latencyHistory = [];
    this.consecutiveGoodSamples = 0;
    this.consecutiveElevatedSamples = this.config.consecutiveDelaysForUnstable;
    this.consecutiveSevereSamples = this.config.consecutiveSevereForPoor;

    this.setSnapshot({
      status: 'poor',
      latencyMs: null,
      consecutiveFailures: Math.max(
        this.snapshot.consecutiveFailures + 1,
        this.config.consecutiveFailuresForPoor
      ),
      lastCheckedAt: now,
      isChecking: false
    });
  }

  private handleBrowserOnline = (): void => {
    // Verify actual backend reachability rather than trusting navigator.onLine alone
    void this.checkNow({ force: true });
  };

  private handleBrowserOffline = (): void => {
    this.markOffline(Date.now());
  };

  private handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'hidden') {
      this.clearPollingTimer();
      this.abortPendingRequest();
    } else if (document.visibilityState === 'visible' && this.isRunning) {
      this.restartPollingTimer();
      void this.checkNow({ force: false });
    }
  };

  private restartPollingTimer(): void {
    this.clearPollingTimer();
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    this.intervalId = window.setInterval(() => {
      void this.checkNow({ force: true });
    }, this.config.checkIntervalMs);
  }

  private clearPollingTimer(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private clearTimeoutTimer(): void {
    if (this.activeTimeoutId !== null) {
      window.clearTimeout(this.activeTimeoutId);
      this.activeTimeoutId = null;
    }
  }

  private abortPendingRequest(): void {
    this.clearTimeoutTimer();
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  private setSnapshot(next: ConnectivitySnapshot): void {
    this.snapshot = next;
    const emitted = this.getSnapshot();
    this.listeners.forEach((listener) => {
      try {
        listener(emitted);
      } catch {
        // Isolate listener failures
      }
    });
  }
}

export function createNetworkConnectivityMonitor(
  configOverrides: Partial<ConnectivityMonitorConfig> = {}
): NetworkConnectivityMonitor {
  return new NetworkConnectivityMonitor(configOverrides);
}

export const sharedNetworkConnectivityMonitor = new NetworkConnectivityMonitor();
