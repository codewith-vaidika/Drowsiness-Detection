import { useState, useEffect, useRef } from "react";
import { Vehicle, VehiclesResponse } from "../types";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/vehicles`;

export function useVehicles(pollIntervalMs = 10000) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchVehicles = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json: VehiclesResponse = await response.json();
      
      if (isMounted.current && json.success) {
        setVehicles(json.data);
        setError(null);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message || "Failed to fetch vehicles");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    fetchVehicles();

    let intervalId: NodeJS.Timeout;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(fetchVehicles, pollIntervalMs);
    }

    return () => {
      isMounted.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollIntervalMs]);

  return { vehicles, loading, error, refetch: fetchVehicles };
}
