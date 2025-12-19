import { db } from '@/lib/firebase';
import { ref, get, onValue, DataSnapshot, set } from 'firebase/database';
import type { Device, Alert } from '@/types/device';

function snapshotToArray<T extends { id: string }>(snapshot: DataSnapshot): T[] {
  const val = snapshot.val();
  if (!val) return [];
  if (Array.isArray(val)) {
    return (val.filter(Boolean) as any[]).map((item, idx) => ({ id: item.id ?? String(idx), ...item }));
  }
  return Object.keys(val).map((key) => ({ id: key, ...val[key] }));
}

export async function fetchDevices(): Promise<Device[]> {
  const snap = await get(ref(db, 'devices'));
  const items = snapshotToArray<any>(snap);
  return items.map((d: any) => ({
    id: String(d.id),
    binPercentage: Number(d.binPercentage ?? 0),
    isFull: Boolean(d.isFull ?? (Number(d.binPercentage ?? 0) >= 100)),
    latitude: Number(d.latitude ?? 0),
    longitude: Number(d.longitude ?? 0),
    altitude: d.altitude !== undefined ? Number(d.altitude) : undefined,
    tamperDetected: Boolean(d.tamperDetected ?? false),
    batteryLevel: Number(d.batteryLevel ?? 0),
    batteryVoltage: Number(d.batteryVoltage ?? 0),
    timestamp: String(d.timestamp ?? new Date().toISOString()),
    gpsTime: d.gpsTime ? String(d.gpsTime) : undefined,
    message: d.message ? String(d.message) : undefined,
    wakeupReason: Number(d.wakeupReason ?? 0),
    bootCount: Number(d.bootCount ?? 0),
    randomValue: d.randomValue !== undefined ? Number(d.randomValue) : undefined,
    status: (d.status as Device['status']) ?? 'online',
  }));
}

export async function fetchAlerts(): Promise<Alert[]> {
  const snap = await get(ref(db, 'alerts'));
  const items = snapshotToArray<any>(snap);
  return items.map((a: any) => ({
    id: String(a.id),
    deviceId: String(a.deviceId ?? a.deviceId),
    type: (a.type as Alert['type']) ?? 'full',
    binPercentage: Number(a.binPercentage ?? 0),
    isFull: Boolean(a.isFull ?? (Number(a.binPercentage ?? 0) >= 100)),
    timestamp: String(a.timestamp ?? new Date().toISOString()),
    message: String(a.message ?? ''),
    acknowledged: Boolean(a.acknowledged ?? false),
  }));
}

export function subscribeDevices(onDevices: (devices: Device[]) => void) {
  const devicesRef = ref(db, 'devices');
  return onValue(devicesRef, (snapshot) => {
    const items = snapshotToArray<any>(snapshot);
    onDevices(items.map((d: any) => ({
      id: String(d.id),
      binPercentage: Number(d.binPercentage ?? 0),
      isFull: Boolean(d.isFull ?? (Number(d.binPercentage ?? 0) >= 100)),
      latitude: Number(d.latitude ?? 0),
      longitude: Number(d.longitude ?? 0),
      altitude: d.altitude !== undefined ? Number(d.altitude) : undefined,
      tamperDetected: Boolean(d.tamperDetected ?? false),
      batteryLevel: Number(d.batteryLevel ?? 0),
      batteryVoltage: Number(d.batteryVoltage ?? 0),
      timestamp: String(d.timestamp ?? new Date().toISOString()),
      gpsTime: d.gpsTime ? String(d.gpsTime) : undefined,
      message: d.message ? String(d.message) : undefined,
      wakeupReason: Number(d.wakeupReason ?? 0),
      bootCount: Number(d.bootCount ?? 0),
      randomValue: d.randomValue !== undefined ? Number(d.randomValue) : undefined,
      status: (d.status as Device['status']) ?? 'online',
    })));
  });
}

export function subscribeAlerts(onAlerts: (alerts: Alert[]) => void) {
  const alertsRef = ref(db, 'alerts');
  return onValue(alertsRef, (snapshot) => {
    const items = snapshotToArray<any>(snapshot);
    onAlerts(items.map((a: any) => ({
      id: String(a.id),
      deviceId: String(a.deviceId ?? a.deviceId),
      type: (a.type as Alert['type']) ?? 'full',
      binPercentage: Number(a.binPercentage ?? 0),
      isFull: Boolean(a.isFull ?? (Number(a.binPercentage ?? 0) >= 100)),
      timestamp: String(a.timestamp ?? new Date().toISOString()),
      message: String(a.message ?? ''),
      acknowledged: Boolean(a.acknowledged ?? false),
    })));
  });
}

export async function fetchDeviceById(id: string): Promise<Device | null> {
  // Try direct child lookup first
  const snap = await get(ref(db, `devices/${id}`));
  if (snap.exists()) {
    const d: any = snap.val();
    return {
      id: String(id),
      binPercentage: Number(d.binPercentage ?? 0),
      isFull: Boolean(d.isFull ?? (Number(d.binPercentage ?? 0) >= 100)),
      latitude: Number(d.latitude ?? 0),
      longitude: Number(d.longitude ?? 0),
      altitude: d.altitude !== undefined ? Number(d.altitude) : undefined,
      tamperDetected: Boolean(d.tamperDetected ?? false),
      batteryLevel: Number(d.batteryLevel ?? 0),
      batteryVoltage: Number(d.batteryVoltage ?? 0),
      timestamp: String(d.timestamp ?? new Date().toISOString()),
      gpsTime: d.gpsTime ? String(d.gpsTime) : undefined,
      message: d.message ? String(d.message) : undefined,
      wakeupReason: Number(d.wakeupReason ?? 0),
      bootCount: Number(d.bootCount ?? 0),
      randomValue: d.randomValue !== undefined ? Number(d.randomValue) : undefined,
      status: (d.status as Device['status']) ?? 'online',
    };
  }
  // Fallback: scan list
  const all = await fetchDevices();
  return all.find(x => x.id === id) ?? null;
}

export function subscribeDevice(id: string, onDevice: (device: Device | null) => void) {
  const deviceRef = ref(db, `devices/${id}`);
  return onValue(deviceRef, (snapshot) => {
    if (!snapshot.exists()) {
      onDevice(null);
      return;
    }
    const d: any = snapshot.val();
    onDevice({
      id: String(id),
      binPercentage: Number(d.binPercentage ?? 0),
      isFull: Boolean(d.isFull ?? (Number(d.binPercentage ?? 0) >= 100)),
      latitude: Number(d.latitude ?? 0),
      longitude: Number(d.longitude ?? 0),
      altitude: d.altitude !== undefined ? Number(d.altitude) : undefined,
      tamperDetected: Boolean(d.tamperDetected ?? false),
      batteryLevel: Number(d.batteryLevel ?? 0),
      batteryVoltage: Number(d.batteryVoltage ?? 0),
      timestamp: String(d.timestamp ?? new Date().toISOString()),
      gpsTime: d.gpsTime ? String(d.gpsTime) : undefined,
      message: d.message ? String(d.message) : undefined,
      wakeupReason: Number(d.wakeupReason ?? 0),
      bootCount: Number(d.bootCount ?? 0),
      randomValue: d.randomValue !== undefined ? Number(d.randomValue) : undefined,
      status: (d.status as Device['status']) ?? 'online',
    });
  });
}

export async function createDevice(input: {
  id: string;
  latitude: number;
  longitude: number;
  binPercentage?: number;
  batteryLevel?: number;
}) {
  const deviceId = String(input.id).trim();
  if (!deviceId) throw new Error('Device ID is required');
  const lat = Number(input.latitude);
  const lng = Number(input.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Latitude/Longitude must be valid numbers');
  const existing = await get(ref(db, `devices/${deviceId}`));
  if (existing.exists()) throw new Error('Device already exists');
  const now = new Date().toISOString();
  const bin = Number(input.binPercentage ?? 0);
  const battery = Number(input.batteryLevel ?? 100);
  const payload = {
    id: deviceId,
    binPercentage: bin,
    isFull: bin >= 100,
    latitude: lat,
    longitude: lng,
    altitude: null,
    tamperDetected: false,
    batteryLevel: battery,
    batteryVoltage: 0,
    timestamp: now,
    wakeupReason: 0,
    bootCount: 0,
    status: 'online',
  } as const;
  await set(ref(db, `devices/${deviceId}`), payload);
  return {
    id: deviceId,
    binPercentage: bin,
    isFull: bin >= 100,
    latitude: lat,
    longitude: lng,
    altitude: undefined,
    tamperDetected: false,
    batteryLevel: battery,
    batteryVoltage: 0,
    timestamp: now,
    gpsTime: undefined,
    message: undefined,
    wakeupReason: 0,
    bootCount: 0,
    randomValue: undefined,
    status: 'online' as Device['status'],
  } as Device;
}
