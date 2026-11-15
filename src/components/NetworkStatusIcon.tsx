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
}

const STATUS_COLOR_CLASSES: Record<ConnectivityStatus, string> = {
  unknown: 'text-slate-400',
  stable: 'text-emerald-500',
  unstable: 'text-yellow-400',
  poor: 'text-red-500'
};

const STATUS_ARIA_LABELS: Record<ConnectivityStatus, string> = {
  unknown: 'Checking network connectivity',
  stable: 'Network connection stable',
  unstable: 'Network connection unstable',
  poor: 'Network connection poor or unavailable'
};

export const NetworkStatusIcon: React.FC<NetworkStatusIconProps> = ({ configOverrides }) => {
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

  return (
    <div
      id="header-network-status-indicator"
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-[10px] border border-[#2e3540] bg-[#161920] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.4)]"
    >
      <Wifi
        aria-hidden="true"
        className={`h-[17px] w-[17px] transition-colors duration-300 ${colorClass}`}
        strokeWidth={2.25}
      />
    </div>
  );
};

export default NetworkStatusIcon;
