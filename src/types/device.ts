export interface Device {
  id: string;
  binPercentage: number;
  isFull: boolean;
  latitude: number;
  longitude: number;
  altitude?: number;
  tamperDetected: boolean;
  batteryLevel: number;
  batteryVoltage: number;
  timestamp: string;
  gpsTime?: string;
  message?: string;
  wakeupReason: number;
  bootCount: number;
  randomValue?: number;
  status: 'online' | 'offline' | 'maintenance';
  name?: string;
  type?: string;
  location?: string;
  ownerId?: string;
  ownerEmail?: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  type: 'full' | 'tamper' | 'low_battery' | 'wake';
  binPercentage: number;
  isFull: boolean;
  timestamp: string;
  message: string;
  acknowledged: boolean;
}

export interface DeviceEvent {
  id: string;
  deviceId: string;
  eventType: string;
  previousValue?: number | boolean;
  newValue?: number | boolean;
  timestamp: string;
}
