export interface Vehicle {
  _id: string;
  vehicleName: string;
  ownerName: string;
  licensePlate: string;
  apiKey?: string;
  totalAlerts?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  _id: string;
  vehicle: Vehicle; // Populated by backend
  timestamp: string;
  alertDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface HourlyData {
  hour: number;
  count: number;
}

export interface AnalyticsData {
  totalVehicles: number;
  totalAlerts: number;
  hourlyData: HourlyData[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
}

export interface VehiclesResponse {
  success: boolean;
  count: number;
  data: Vehicle[];
}

export interface AlertsResponse {
  success: boolean;
  count: number;
  data: Alert[];
}
