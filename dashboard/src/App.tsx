import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { VehicleRegistration } from "./components/VehicleRegistration";
import { useAnalytics } from "./hooks/useAnalytics";
import { useAlerts } from "./hooks/useAlerts";
import { useVehicles } from "./hooks/useVehicles";
import { AlertCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "registration">("dashboard");

  // Fetch data with auto-polling every 10s
  const { 
    data: analytics, 
    loading: analyticsLoading, 
    error: analyticsError 
  } = useAnalytics(10000);
  
  const { 
    alerts, 
    loading: alertsLoading, 
    error: alertsError 
  } = useAlerts(); // Defaults to 10s in the hook
  
  const { 
    vehicles, 
    loading: vehiclesLoading, 
    error: vehiclesError 
  } = useVehicles(10000);

  // Check for global connection errors
  const globalError = analyticsError || alertsError || vehiclesError;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {globalError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Connection Error: {globalError}</p>
        </div>
      )}

      {activeTab === "dashboard" ? (
        <Dashboard 
          analytics={analytics} 
          analyticsLoading={analyticsLoading}
          alerts={alerts}
          alertsLoading={alertsLoading}
          vehicles={vehicles}
          vehiclesLoading={vehiclesLoading}
        />
      ) : (
        <VehicleRegistration />
      )}
    </Layout>
  );
}
