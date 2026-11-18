import React, { useEffect, useMemo, useState } from 'react';
import { Wifi } from 'lucide-react';
import {
  type ConnectivityMonitorConfig,
  type ConnectivitySnapshot,
  type ConnectivityStatus,
  createNetworkConnectivityMonitor,
  sharedNetworkConnectivityMonitor
} from '../services/networkConnectivityService';

export interface NetworkStatusIconProps {
  /** Optional monitor threshold overrides for custom environments. */
  configOverrides?: Partial<ConnectivityMonitorConfig>;
  /** Optional click handler to trigger an interactive network resync. */
  onClick?: () => void;
  title?: string;
}

const STATUS_COLOR_CLASSES: Record<ConnectivityStatus, string> = {
  unknown: 'text-amber-400',
  stable: 'text-amber-400',
  unstable: 'text-amber-400',
  poor: 'text-red-400'
};

const STATUS_ARIA_LABELS: Record<ConnectivityStatus, string> = {
  unknown: 'Checking network connectivity',
  stable: 'Network connection stable — tap to resync',
  unstable: 'Network connection unstable — tap to resync',
  poor: 'Network connection poor or unavailable — tap to retry'
};

export const NetworkStatusIcon: React.FC<NetworkStatusIconProps> = ({
  configOverrides,
  onClick,
  title
}) => {
  const monitor = useMemo(() => {
    if (!configOverrides) {
      return sharedNetworkConnectivityMonitor;
    }
    return createNetworkConnectivityMonitor(configOverrides);
  }, [configOverrides]);

  const [snapshot, setSnapshot] = useState<ConnectivitySnapshot>(() => monitor.getSnapshot());

  useEffect(() => {
    const unsubscribe = monitor.subscribe((next) => {
      setSnapshot(next);
    });
    return () => {
      unsubscribe();
    };
  }, [monitor]);

  const colorClass = STATUS_COLOR_CLASSES[snapshot.status];
  const ariaLabel = STATUS_ARIA_LABELS[snapshot.status];
  const isPoor = snapshot.status === 'poor';

  return (
    <button
      type="button"
      id="header-network-status-indicator"
      onClick={() => {
        void monitor.checkNow({ force: true });
        onClick?.();
      }}
      title={title || ariaLabel}
      aria-label={ariaLabel}
      aria-live="polite"
      className={`flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 select-none items-center justify-center rounded-[11px] border transition-all duration-200 cursor-pointer ${
        isPoor
          ? 'border-red-500/45 bg-red-500/10 shadow-[0_0_16px_rgba(239,68,68,0.2)]'
          : 'border-amber-400/50 bg-[#0d131f] hover:border-amber-400/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(245,158,11,0.18)]'
      }`}
    >
      <Wifi
        aria-hidden="true"
        className={`h-[17px] w-[17px] lg:h-[18px] lg:w-[18px] transition-colors duration-300 ${colorClass} ${
          snapshot.isChecking || snapshot.isSoftRefreshing ? 'animate-pulse' : ''
        }`}
        strokeWidth={2.25}
      />
    </button>
  );
};

export default NetworkStatusIcon;
