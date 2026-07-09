import React from "react";
import { ShieldAlert, CarFront, Activity } from "lucide-react";
import { AnalyticsData, Alert, Vehicle } from "../types";
import { HourlyAlertsChart } from "./HourlyAlertsChart";
import { VehicleGrid } from "./VehicleGrid";
import { AlertTable } from "./AlertTable";

interface DashboardProps {
  analytics: AnalyticsData | null;
  analyticsLoading: boolean;
  alerts: Alert[];
  alertsLoading: boolean;
  vehicles: Vehicle[];
  vehiclesLoading: boolean;
}

export function Dashboard({ 
  analytics, analyticsLoading, 
  alerts, alertsLoading,
  vehicles, vehiclesLoading
}: DashboardProps) {

  // Check if there's been an alert within the last 60 seconds
  const now = Date.now();
  const hasCritical = alerts.some(
    (a) => now - new Date(a.timestamp).getTime() < 60_000
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start relative">
            <div>
              <p className="text-slate-400 font-medium text-sm">Total Incidents</p>
              <p className="text-4xl font-bold text-white mt-2">
                {analyticsLoading ? "..." : analytics?.totalAlerts || 0}
              </p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start relative">
            <div>
              <p className="text-slate-400 font-medium text-sm">Fleet Coverage</p>
              <p className="text-4xl font-bold text-white mt-2">
                {analyticsLoading ? "..." : analytics?.totalVehicles || 0}
              </p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <CarFront className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className={`border rounded-2xl p-6 relative overflow-hidden transition-colors duration-500 ${
          hasCritical 
            ? "bg-red-950/20 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]" 
            : "bg-slate-900 border-slate-800"
        }`}>
          <div className="flex justify-between items-start relative">
            <div>
              <p className="text-slate-400 font-medium text-sm">Fleet Status</p>
              <div className="flex items-center gap-3 mt-2">
                {hasCritical && (
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                )}
                <p className={`text-2xl font-bold ${hasCritical ? "text-red-400" : "text-emerald-400"}`}>
                  {hasCritical ? "High Risk" : "Normal"}
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-xl ${hasCritical ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
              <Activity className={`w-6 h-6 ${hasCritical ? "text-red-400" : "text-emerald-400"}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Grid & Table */}
        <div className="lg:col-span-2 space-y-8">
          <VehicleGrid vehicles={vehicles} loading={vehiclesLoading} />
          <AlertTable alerts={alerts} loading={alertsLoading} />
        </div>
        
        {/* Right Column: Analytics Chart */}
        <div className="lg:col-span-1">
          <HourlyAlertsChart data={analytics?.hourlyData || []} loading={analyticsLoading} />
        </div>
      </div>
    </div>
  );
}
