import React, { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { ApiKeyModal } from "./ApiKeyModal";

export function VehicleRegistration() {
  const [vehicleName, setVehicleName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/vehicles/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vehicleName, ownerName, licensePlate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register vehicle");
      }

      setGeneratedApiKey(data.data.apiKey);
      setVehicleName("");
      setOwnerName("");
      setLicensePlate("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Fleet Registration</h2>
        <p className="text-slate-400">Add a new vehicle to your fleet to generate a secure edge API key.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="p-8 relative space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="vehicleName" className="block text-sm font-medium text-slate-300 mb-1">
                Vehicle Name (e.g. Truck #42)
              </label>
              <input
                id="vehicleName"
                type="text"
                required
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter vehicle name"
              />
            </div>
            
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-slate-300 mb-1">
                Owner / Assigned Driver Name
              </label>
              <input
                id="ownerName"
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter owner name"
              />
            </div>

            <div>
              <label htmlFor="licensePlate" className="block text-sm font-medium text-slate-300 mb-1">
                License Plate
              </label>
              <input
                id="licensePlate"
                type="text"
                required
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white uppercase rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="ABC-1234"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  Register Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {generatedApiKey && (
        <ApiKeyModal
          apiKey={generatedApiKey}
          onClose={() => setGeneratedApiKey(null)}
        />
      )}
    </div>
  );
}
