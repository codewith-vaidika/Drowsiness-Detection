import { useState, useEffect, useCallback, useRef } from "react";
import type { Alert, AlertsResponse } from "../types";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/alerts`;
const POLL_INTERVAL_MS = 10_000; // 10 seconds

interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Custom hook that fetches alerts from the backend, auto-polls every 10s,
 * and exposes a manual refresh function.
 *
 * Cleans up the interval timer on unmount to prevent memory leaks.
 */
export function useAlerts(): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Ref to avoid stale closures inside setInterval
  const isMountedRef = useRef(true);

  const fetchAlerts = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const res = await fetch(API_URL);

      if (!res.ok) {
        throw new Error(`Server responded with HTTP ${res.status}`);
      }

      const json: AlertsResponse = await res.json();

      if (isMountedRef.current) {
        setAlerts(json.data);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to connect to backend API"
        );
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  // Initial fetch + polling interval
  useEffect(() => {
    isMountedRef.current = true;
    fetchAlerts(true);

    const intervalId = setInterval(() => {
      fetchAlerts(false); // Silent refresh — no loading spinner
    }, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchAlerts]);

  // Manual refresh (shows spinner)
  const refresh = useCallback(() => fetchAlerts(true), [fetchAlerts]);

  return { alerts, loading, error, refresh, lastUpdated };
}
