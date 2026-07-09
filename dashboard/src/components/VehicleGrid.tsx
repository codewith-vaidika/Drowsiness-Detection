import React from "react";
import { Vehicle } from "../types";
import { ShieldCheck, AlertTriangle, CarFront } from "lucide-react";

interface VehicleGridProps {
  vehicles: Vehicle[];
  loading: boolean;
}

export function VehicleGrid({ vehicles, loading }: VehicleGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-32 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <CarFront className="w-5 h-5 text-indigo-400" />
        Active Fleet Status
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vehicles.map((vehicle) => {
          // In a real app, you'd check if there was a recent alert (e.g. within 5 mins)
          // For demo purposes, we will highlight vehicles with > 0 total alerts,
          // but a real implementation should check the most recent alert timestamp.
          const hasAlerts = (vehicle.totalAlerts || 0) > 0;
          
          return (
            <div 
              key={vehicle._id} 
              className={`relative overflow-hidden rounded-xl p-5 border transition-all duration-300 ${
                hasAlerts 
                  ? "bg-red-500/5 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              {hasAlerts && (
                <div className="absolute top-0 right-0 w-2 h-2 m-4 rounded-full bg-red-500 animate-ping"></div>
              )}
              {hasAlerts && (
                <div className="absolute top-0 right-0 w-2 h-2 m-4 rounded-full bg-red-500"></div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-200">{vehicle.vehicleName}</h4>
                  <p className="text-xs font-mono text-slate-500 mt-1">{vehicle.licensePlate}</p>
                </div>
                <div className={`p-2 rounded-lg ${hasAlerts ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {hasAlerts ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Driver: {vehicle.ownerName}</span>
                <span className={`font-semibold ${hasAlerts ? 'text-red-400' : 'text-slate-500'}`}>
                  {vehicle.totalAlerts} Incidents
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
