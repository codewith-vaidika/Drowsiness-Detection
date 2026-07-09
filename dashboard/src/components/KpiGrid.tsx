import type { Alert } from "../types";
import KpiCard from "./KpiCard";

interface KpiGridProps {
  alerts: Alert[];
}

/* ─── SVG Icons (inline to avoid external deps) ──────────────────────────── */
const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const VehicleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const StatusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

/**
 * Renders a row of three KPI metric cards:
 * 1. Total Alerts Registered
 * 2. Active Vehicles Monitored  (unique vehicleIds)
 * 3. Critical Alert Status      (any alert in the last 60s?)
 */
export default function KpiGrid({ alerts }: KpiGridProps) {
  const totalAlerts = alerts.length;

  // Count unique vehicle IDs
  const uniqueVehicles = new Set(alerts.map((a) => a.vehicleId)).size;

  // Check if there's been an alert within the last 60 seconds
  const now = Date.now();
  const hasCritical = alerts.some(
    (a) => now - new Date(a.timestamp).getTime() < 60_000
  );

  return (
    <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Total Alerts Registered"
        value={totalAlerts}
        subtitle={totalAlerts === 1 ? "drowsiness event" : "drowsiness events"}
        icon={<AlertIcon />}
        gradient="var(--gradient-indigo)"
      />
      <KpiCard
        title="Active Vehicles Monitored"
        value={uniqueVehicles}
        subtitle="unique vehicles"
        icon={<VehicleIcon />}
        gradient="var(--gradient-emerald)"
      />
      <KpiCard
        title="Critical Alert Status"
        value={hasCritical ? "ACTIVE" : "ALL CLEAR"}
        subtitle={hasCritical ? "Alert within last 60 seconds" : "No recent incidents"}
        icon={<StatusIcon />}
        gradient={hasCritical ? "var(--gradient-rose)" : "var(--gradient-emerald)"}
      />
    </div>
  );
}
