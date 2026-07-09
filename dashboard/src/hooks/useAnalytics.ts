import { useState, useEffect, useRef } from "react";
import { AnalyticsData, AnalyticsResponse } from "../types";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/analytics`;

export function useAnalytics(pollIntervalMs = 10000) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json: AnalyticsResponse = await response.json();
      
      if (isMounted.current && json.success) {
        setData(json.data);
        setError(null);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message || "Failed to fetch analytics");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    // Initial fetch
    fetchAnalytics();

    // Polling setup
    let intervalId: NodeJS.Timeout;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(fetchAnalytics, pollIntervalMs);
    }

    return () => {
      isMounted.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollIntervalMs]);

  return { data, loading, error, refetch: fetchAnalytics };
}
