import { db } from '@/lib/firebase';
import { ref, get, onValue, DataSnapshot, set, query, orderByChild, equalTo } from 'firebase/database';
import type { Device, Alert } from '@/types/device';

function snapshotToArray<T extends { id: string }>(snapshot: DataSnapshot): T[] {
  const val = snapshot.val();
  if (!val) return [];
  if (Array.isArray(val)) {
    return (val.filter(Boolean) as any[]).map((item, idx) => ({ id: item.id ?? String(idx), ...item }));
  }
  return Object.keys(val).map((key) => ({ id: key, ...val[key] }));
}

export async function fetchDevices(ownerId?: string): Promise<Device[]> {
  const targetPath = ownerId ? `devices/${ownerId}` : 'devices';
  const snap = await get(ref(db, targetPath));

  if (!snap.exists()) return [];
  const val = snap.val();

  let rawItems: any[] = [];
  if (ownerId) {
    // Single user structure: { "001": {...}, "002": {...} }
    rawItems = Object.keys(val).map(id => ({
      id,
      ...val[id],
      ownerId: val[id].ownerId || ownerId
    }));
  } else {
    // Admin/Global structure: { "UID1": { "001": {...} }, "UID2": {...} }
    Object.keys(val).forEach(uid => {
      const userDevices = val[uid];
      if (userDevices && typeof userDevices === 'object') {
        // Skip legacy flat-structure entries: if it has 'id' or 'binPercentage', it's a device, not a user node
        if ('id' in userDevices || 'binPercentage' in userDevices) return;

        Object.keys(userDevices).forEach(did => {
          rawItems.push({
            id: did,
            ...userDevices[did],
            ownerId: userDevices[did].ownerId || uid
          });
        });
      }
    });
  }

  return rawItems.map((d: any) => ({
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
    name: d.name,
    type: d.type,
    location: d.location,
    ownerId: d.ownerId,
    ownerEmail: d.ownerEmail,
  }));
}

export async function fetchAlerts(ownerId?: string): Promise<Alert[]> {
  const dbRef = ref(db, 'alerts');
  const q = ownerId
    ? query(dbRef, orderByChild('ownerId'), equalTo(ownerId))
    : dbRef;

  const snap = await get(q);
  const items = snapshotToArray<any>(snap);
  return items.map((a: any) => ({
    id: String(a.id),
    deviceId: String(a.deviceId ?? a.deviceId),
    ownerId: a.ownerId,
    type: (a.type as Alert['type']) ?? 'full',
    binPercentage: Number(a.binPercentage ?? 0),
    isFull: Boolean(a.isFull ?? (Number(a.binPercentage ?? 0) >= 100)),
    timestamp: String(a.timestamp ?? new Date().toISOString()),
    message: String(a.message ?? ''),
    acknowledged: Boolean(a.acknowledged ?? false),
  }));
}

export function subscribeDevices(onDevices: (devices: Device[]) => void, ownerId?: string) {
  const targetPath = ownerId ? `devices/${ownerId}` : 'devices';
  const dbRef = ref(db, targetPath);

  return onValue(dbRef, (snapshot) => {
    if (!snapshot.exists()) {
      onDevices([]);
      return;
    }
    const val = snapshot.val();
    let rawItems: any[] = [];

    if (ownerId) {
      rawItems = Object.keys(val).map(id => ({
        id,
        ...val[id],
        ownerId: val[id].ownerId || ownerId
      }));
    } else {
      Object.keys(val).forEach(uid => {
        const userDevices = val[uid];
        if (userDevices && typeof userDevices === 'object') {
          // Skip legacy flat-structure entries
          if ('id' in userDevices || 'binPercentage' in userDevices) return;

          Object.keys(userDevices).forEach(did => {
            rawItems.push({
              id: did,
              ...userDevices[did],
              ownerId: userDevices[did].ownerId || uid
            });
          });
        }
      });
    }

    onDevices(rawItems.map((d: any) => ({
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
      name: d.name,
      type: d.type,
      location: d.location,
      ownerId: d.ownerId,
      ownerEmail: d.ownerEmail,
    })));
  });
}

export function subscribeAlerts(onAlerts: (alerts: Alert[]) => void, ownerId?: string) {
  const alertsRef = ref(db, 'alerts');
  const q = ownerId
    ? query(alertsRef, orderByChild('ownerId'), equalTo(ownerId))
    : alertsRef;

  return onValue(q, (snapshot) => {
    const items = snapshotToArray<any>(snapshot);
    onAlerts(items.map((a: any) => ({
      id: String(a.id),
      deviceId: String(a.deviceId ?? a.deviceId),
      ownerId: a.ownerId,
      type: (a.type as Alert['type']) ?? 'full',
      binPercentage: Number(a.binPercentage ?? 0),
      isFull: Boolean(a.isFull ?? (Number(a.binPercentage ?? 0) >= 100)),
      timestamp: String(a.timestamp ?? new Date().toISOString()),
      message: String(a.message ?? ''),
      acknowledged: Boolean(a.acknowledged ?? false),
    })));
  });
}

export function subscribeEvents(onEvents: (events: any[]) => void) {
  const eventsRef = ref(db, 'events');
  return onValue(eventsRef, (snapshot) => {
    const items = snapshotToArray<any>(snapshot);
    onEvents(items.map((e: any) => ({
      id: String(e.id),
      deviceId: String(e.deviceId),
      eventType: String(e.eventType),
      previousValue: e.previousValue,
      newValue: e.newValue,
      timestamp: String(e.timestamp ?? new Date().toISOString()),
    })));
  });
}

export async function fetchDeviceById(id: string, ownerId?: string): Promise<Device | null> {
  if (!ownerId) {
    // Fallback: scan list if ownerId is not known (Admin view)
    const all = await fetchDevices();
    return all.find(x => x.id === id) ?? null;
  }

  const snap = await get(ref(db, `devices/${ownerId}/${id}`));
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
      name: d.name,
      type: d.type,
      location: d.location,
      ownerId: d.ownerId || ownerId,
      ownerEmail: d.ownerEmail,
    };
  }
  return null;
}

export function subscribeDevice(id: string, onDevice: (device: Device | null) => void, ownerId?: string) {
  if (!ownerId) {
    onDevice(null);
    return () => { };
  }
  const deviceRef = ref(db, `devices/${ownerId}/${id}`);
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
      name: d.name,
      type: d.type,
      location: d.location,
      ownerId: d.ownerId || ownerId,
      ownerEmail: d.ownerEmail,
    });
  });
}

export async function createDevice(input: {
  name?: string;
  type?: string;
  location?: string;
  ownerId: string;
  ownerEmail?: string;
  latitude?: number;
  longitude?: number;
  binPercentage?: number;
  batteryLevel?: number;
}) {
  const { ownerId } = input;
  if (!ownerId) throw new Error('Owner ID is required');

  // Generate Auto ID (001, 002, ...)
  const userDevicesRef = ref(db, `devices/${ownerId}`);
  const snap = await get(userDevicesRef);
  const count = snap.exists() ? Object.keys(snap.val()).length : 0;
  const deviceId = (count + 1).toString().padStart(3, '0');

  const lat = Number(input.latitude ?? 0);
  const lng = Number(input.longitude ?? 0);
  const now = new Date().toISOString();
  const bin = Number(input.binPercentage ?? 0);
  const battery = Number(input.batteryLevel ?? 100);

  const payload = {
    id: deviceId,
    name: input.name ?? `Bin ${deviceId}`,
    type: input.type ?? 'Smart Bin',
    location: input.location ?? '',
    ownerId: ownerId,
    ownerEmail: input.ownerEmail ?? '',
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

  await set(ref(db, `devices/${ownerId}/${deviceId}`), payload);
  return {
    ...payload,
    altitude: undefined,
    gpsTime: undefined,
    message: undefined,
    randomValue: undefined,
    status: 'online' as Device['status'],
  } as Device;
}
