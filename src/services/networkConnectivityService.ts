import { API_ENDPOINTS, getBackendBaseUrl } from '../apiConfig';

export type ConnectivityStatus = 'unknown' | 'stable' | 'unstable' | 'poor';

interface NetworkInformationLike extends EventTarget {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  rtt?: number;
  downlink?: number;
  saveData?: boolean;
}

export interface ConnectivityMonitorConfig {
  /** Polling interval while the app tab is visible (ms). */
  checkIntervalMs: number;
  /** Maximum duration to wait for a probe response before timing out (ms). */
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
  /** Whether to automatically run a soft-refresh check when transitioning from poor (Red) back to unstable (Yellow). */
  enableRecoverySoftRefresh: boolean;
  /** Delay before firing an automatic recovery soft-refresh probe after Red -> Yellow transition (ms). */
  softRefreshDelayMs: number;
  /** Minimum cooldown between separate Red -> Yellow soft-refresh episodes to avoid battery drain on flapping links (ms). */
  softRefreshCooldownMs: number;
  /** Maximum bounded follow-up soft-refresh probes per Red -> Yellow recovery episode. */
  maxConsecutiveSoftRefreshes: number;
  /** Resolver returning the CHIXUS backend GET /health URL. */
  healthUrlResolver: () => string;
  /** Optional external probe used when /health returns static HTML or no dedicated backend is configured. */
  internetProbeUrlResolver?: () => string;
}

export interface ConnectivitySnapshot {
  status: ConnectivityStatus;
  latencyMs: number | null;
  consecutiveFailures: number;
  lastCheckedAt: number | null;
  isChecking: boolean;
  isSoftRefreshing: boolean;
  lastSoftRefreshAt: number | null;
}

export const DEFAULT_CONNECTIVITY_CONFIG: ConnectivityMonitorConfig = {
  checkIntervalMs: 15000,
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
  enableRecoverySoftRefresh: true,
  softRefreshDelayMs: 1500,
  softRefreshCooldownMs: 6000,
  maxConsecutiveSoftRefreshes: 3,
  healthUrlResolver: () => API_ENDPOINTS.HEALTH(),
  internetProbeUrlResolver: () => `https://www.gstatic.com/generate_204?_t=${Date.now()}`
};

export type ConnectivityListener = (snapshot: ConnectivitySnapshot) => void;

function getNavigatorConnection(): NetworkInformationLike | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

export class NetworkConnectivityMonitor {
  private config: ConnectivityMonitorConfig;
  private listeners = new Set<ConnectivityListener>();
  private intervalId: number | null = null;
  private activeAbortController: AbortController | null = null;
  private activeTimeoutId: number | null = null;
  private softRefreshTimeoutId: number | null = null;
  private isRunning = false;
  private latencyHistory: number[] = [];
  private consecutiveElevatedSamples = 0;
  private consecutiveSevereSamples = 0;
  private consecutiveGoodSamples = 0;
  private inSoftRefreshEpisode = false;
  private recoverySoftRefreshAttempts = 0;
  private lastSoftRefreshEpisodeAt: number | null = null;
  private attachedConnection: NetworkInformationLike | null = null;

  private snapshot: ConnectivitySnapshot = {
    status: 'unknown',
    latencyMs: null,
    consecutiveFailures: 0,
    lastCheckedAt: null,
    isChecking: false,
    isSoftRefreshing: false,
    lastSoftRefreshAt: null
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

    if (!this.config.enableRecoverySoftRefresh) {
      this.resetSoftRefreshState();
    }

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

    const conn = getNavigatorConnection();
    if (conn && typeof conn.addEventListener === 'function') {
      this.attachedConnection = conn;
      conn.addEventListener('change', this.handleNetworkInfoChange);
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
    if (this.attachedConnection && typeof this.attachedConnection.removeEventListener === 'function') {
      this.attachedConnection.removeEventListener('change', this.handleNetworkInfoChange);
      this.attachedConnection = null;
    }

    this.clearPollingTimer();
    this.resetSoftRefreshState();
    this.abortPendingRequest();
    if (this.snapshot.isSoftRefreshing || this.snapshot.isChecking) {
      this.setSnapshot({
        ...this.snapshot,
        isChecking: false,
        isSoftRefreshing: false
      });
    }
  }

  private getRadioPenaltyLatency(measuredLatencyMs: number): number {
    const conn = getNavigatorConnection();
    if (!conn) return measuredLatencyMs;
    if (conn.type === 'none') {
      return Math.max(measuredLatencyMs, this.config.poorLatencyThresholdMs + 500);
    }
    const effective = conn.effectiveType;
    const navRtt = typeof conn.rtt === 'number' && conn.rtt > 0 ? conn.rtt : 0;
    const downlink = typeof conn.downlink === 'number' && conn.downlink > 0 ? conn.downlink : null;

    if (effective === 'slow-2g') {
      return Math.max(measuredLatencyMs, this.config.poorLatencyThresholdMs + 250, navRtt);
    }
    if (effective === '2g' || (downlink !== null && downlink < 0.25) || navRtt > 1400) {
      return Math.max(measuredLatencyMs, this.config.stableLatencyThresholdMs + 250, navRtt);
    }
    if (navRtt > this.config.stableLatencyThresholdMs) {
      return Math.max(measuredLatencyMs, navRtt);
    }
    return measuredLatencyMs;
  }

  private async runInternetReachabilityProbe(signal: AbortSignal): Promise<number | null> {
    if (!this.config.internetProbeUrlResolver) return null;
    const probeStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const probeUrl = this.config.internetProbeUrlResolver();
    await fetch(probeUrl, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal
    });
    const probeEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return Math.max(1, Math.round(probeEnd - probeStart));
  }

  public async checkNow(
    options: { force?: boolean; isSoftRefresh?: boolean } = {}
  ): Promise<ConnectivitySnapshot> {
    if (typeof window === 'undefined') return this.getSnapshot();

    const now = Date.now();
    const isSoftRefresh = Boolean(options.isSoftRefresh);

    if (
      !options.force &&
      !isSoftRefresh &&
      this.snapshot.lastCheckedAt !== null &&
      now - this.snapshot.lastCheckedAt < this.config.minCheckGapMs
    ) {
      return this.getSnapshot();
    }

    const navConn = getNavigatorConnection();
    if ((typeof navigator !== 'undefined' && navigator.onLine === false) || navConn?.type === 'none') {
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
      isChecking: true,
      isSoftRefreshing: isSoftRefresh || this.inSoftRefreshEpisode,
      lastSoftRefreshAt: isSoftRefresh ? now : this.snapshot.lastSoftRefreshAt
    });

    this.activeTimeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.config.requestTimeoutMs);

    const startMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const hasExplicitBackend = Boolean(getBackendBaseUrl());

    try {
      const healthUrl = this.config.healthUrlResolver();
      const sep = healthUrl.includes('?') ? '&' : '?';
      const cacheBustedHealthUrl = `${healthUrl}${sep}_t=${Date.now()}`;
      const response = await fetch(cacheBustedHealthUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        },
        signal: controller.signal
      });

      const contentType = response.headers?.get?.('content-type') || '';
      const isHtmlRewrite = contentType.toLowerCase().includes('text/html');

      if (response.ok && !isHtmlRewrite) {
        this.clearTimeoutTimer();
        this.activeAbortController = null;
        const endMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const rawLatencyMs = Math.max(1, Math.round(endMs - startMs));
        const effectiveLatencyMs = this.getRadioPenaltyLatency(rawLatencyMs);
        this.recordSuccess(effectiveLatencyMs, Date.now(), isSoftRefresh);
        return this.getSnapshot();
      }

      // If /health returned static SPA HTML or failed when no explicit backend URL is set,
      // measure real Wi-Fi / Mobile Data internet reachability via generate_204 probe.
      if (isHtmlRewrite || !hasExplicitBackend) {
        const probeLatency = await this.runInternetReachabilityProbe(controller.signal);
        this.clearTimeoutTimer();
        this.activeAbortController = null;
        if (probeLatency !== null) {
          const effectiveLatencyMs = this.getRadioPenaltyLatency(probeLatency);
          this.recordSuccess(effectiveLatencyMs, Date.now(), isSoftRefresh);
          return this.getSnapshot();
        }
      }

      this.clearTimeoutTimer();
      this.activeAbortController = null;
      this.recordFailure(Date.now(), isSoftRefresh);
      return this.getSnapshot();
    } catch {
      if (!timedOut && !controller.signal.aborted && !hasExplicitBackend) {
        try {
          const probeLatency = await this.runInternetReachabilityProbe(controller.signal);
          this.clearTimeoutTimer();
          this.activeAbortController = null;
          if (probeLatency !== null) {
            const effectiveLatencyMs = this.getRadioPenaltyLatency(probeLatency);
            this.recordSuccess(effectiveLatencyMs, Date.now(), isSoftRefresh);
            return this.getSnapshot();
          }
        } catch {
          // Fall through to failure recording
        }
      }

      this.clearTimeoutTimer();
      const abortedByStop = controller.signal.aborted && !timedOut;
      this.activeAbortController = null;

      if (!abortedByStop) {
        this.recordFailure(Date.now(), isSoftRefresh);
      } else {
        this.setSnapshot({
          ...this.snapshot,
          isChecking: false,
          isSoftRefreshing: false
        });
      }
      return this.getSnapshot();
    }
  }

  private recordSuccess(latencyMs: number, checkedAt: number, isSoftRefresh = false): void {
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

    const transitionedPoorToUnstable = prevStatus === 'poor' && nextStatus === 'unstable';
    let shouldScheduleSoftRefresh = false;

    if (nextStatus === 'stable') {
      // Full connectivity recovered; clear soft-refresh episode and cooldown
      this.resetSoftRefreshState();
      this.lastSoftRefreshEpisodeAt = null;
    } else if (nextStatus === 'poor') {
      this.resetSoftRefreshState();
    } else if (this.config.enableRecoverySoftRefresh) {
      if (transitionedPoorToUnstable) {
        const cooldownElapsed =
          this.lastSoftRefreshEpisodeAt === null ||
          checkedAt - this.lastSoftRefreshEpisodeAt >= this.config.softRefreshCooldownMs;

        if (cooldownElapsed) {
          this.inSoftRefreshEpisode = true;
          this.recoverySoftRefreshAttempts = 0;
          this.lastSoftRefreshEpisodeAt = checkedAt;
          shouldScheduleSoftRefresh = true;
        }
      } else if (
        isSoftRefresh &&
        this.inSoftRefreshEpisode &&
        nextStatus === 'unstable' &&
        this.recoverySoftRefreshAttempts < this.config.maxConsecutiveSoftRefreshes
      ) {
        shouldScheduleSoftRefresh = true;
      } else if (isSoftRefresh) {
        this.resetSoftRefreshState();
      }
    }

    this.setSnapshot({
      status: nextStatus,
      latencyMs,
      consecutiveFailures: 0,
      lastCheckedAt: checkedAt,
      isChecking: false,
      isSoftRefreshing: shouldScheduleSoftRefresh && this.isRunning,
      lastSoftRefreshAt: isSoftRefresh ? checkedAt : this.snapshot.lastSoftRefreshAt
    });

    if (shouldScheduleSoftRefresh) {
      this.scheduleRecoverySoftRefresh();
    }
  }

  private recordFailure(checkedAt: number, isSoftRefresh = false): void {
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

    // Abort any ongoing soft-refresh episode cleanly upon failure
    if (isSoftRefresh || nextStatus === 'poor') {
      this.resetSoftRefreshState();
    }

    this.setSnapshot({
      status: nextStatus,
      latencyMs: null,
      consecutiveFailures: nextFailures,
      lastCheckedAt: checkedAt,
      isChecking: false,
      isSoftRefreshing: false,
      lastSoftRefreshAt: isSoftRefresh ? checkedAt : this.snapshot.lastSoftRefreshAt
    });
  }

  private markOffline(now: number): void {
    this.resetSoftRefreshState();
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
      isChecking: false,
      isSoftRefreshing: false,
      lastSoftRefreshAt: this.snapshot.lastSoftRefreshAt
    });
  }

  private scheduleRecoverySoftRefresh(): void {
    this.clearSoftRefreshTimer();
    if (!this.isRunning || typeof window === 'undefined') return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (this.recoverySoftRefreshAttempts >= this.config.maxConsecutiveSoftRefreshes) {
      this.resetSoftRefreshState();
      return;
    }

    const delayMs = Math.max(0, this.config.softRefreshDelayMs);
    this.softRefreshTimeoutId = window.setTimeout(() => {
      this.softRefreshTimeoutId = null;
      if (!this.isRunning) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (this.snapshot.status !== 'unstable' || !this.inSoftRefreshEpisode) return;

      this.recoverySoftRefreshAttempts += 1;
      void this.checkNow({ force: true, isSoftRefresh: true });
    }, delayMs);
  }

  private clearSoftRefreshTimer(): void {
    if (this.softRefreshTimeoutId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.softRefreshTimeoutId);
      this.softRefreshTimeoutId = null;
    }
  }

  private resetSoftRefreshState(): void {
    this.clearSoftRefreshTimer();
    this.inSoftRefreshEpisode = false;
    this.recoverySoftRefreshAttempts = 0;
  }

  private handleBrowserOnline = (): void => {
    // Verify actual reachability across Wi-Fi / Mobile Data rather than trusting navigator.onLine alone
    void this.checkNow({ force: true });
  };

  private handleBrowserOffline = (): void => {
    this.markOffline(Date.now());
  };

  private handleNetworkInfoChange = (): void => {
    const conn = getNavigatorConnection();
    if (conn?.type === 'none' || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      this.markOffline(Date.now());
      return;
    }
    void this.checkNow({ force: true });
  };

  private handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'hidden') {
      this.clearPollingTimer();
      this.resetSoftRefreshState();
      this.abortPendingRequest();
      if (this.snapshot.isSoftRefreshing || this.snapshot.isChecking) {
        this.setSnapshot({
          ...this.snapshot,
          isChecking: false,
          isSoftRefreshing: false
        });
      }
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
