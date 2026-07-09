import React from "react";
import type { Alert } from "../types";
import { Clock, ShieldAlert, CarFront } from "lucide-react";

interface AlertTableProps {
  alerts: Alert[];
  loading: boolean;
}

export function AlertTable({ alerts, loading }: AlertTableProps) {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[400px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShieldAlert className="w-8 h-8 text-slate-700" />
          <div className="text-slate-600 font-medium">Loading alerts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            Live Alert Feed
          </h3>
          <p className="text-sm text-slate-400 mt-1">Real-time incident stream</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm text-slate-400 font-medium">Live</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Vehicle</th>
              <th className="px-6 py-4 font-semibold">Driver</th>
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <ShieldAlert className="w-10 h-10 opacity-20" />
                    <p>All Fleet Drivers Safe</p>
                  </div>
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                // Determine severity based on time since alert and duration
                const ageMs = Date.now() - new Date(alert.timestamp).getTime();
                const isRecent = ageMs < 5 * 60 * 1000; // < 5 mins
                const isCritical = isRecent && alert.alertDuration > 6;

                return (
                  <tr 
                    key={alert._id}
                    className={`transition-colors hover:bg-slate-800/50 ${
                      isCritical ? "bg-red-500/5 border-l-2 border-red-500" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                          <CarFront className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-medium ${isCritical ? 'text-red-400' : 'text-slate-200'}`}>
                            {alert.vehicle?.vehicleName || "Unknown Vehicle"}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {alert.vehicle?.licensePlate || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {alert.vehicle?.ownerName || "Unknown Driver"}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {new Date(alert.timestamp).toLocaleString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.alertDuration > 5 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {alert.alertDuration}s
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
