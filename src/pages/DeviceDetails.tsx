import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrashBinIcon } from '@/components/dashboard/TrashBinIcon';
import { StatusBadge, DeviceStatusBadge, TamperBadge } from '@/components/dashboard/StatusBadge';

import { ArrowLeft, Battery, Zap, MapPin, Clock, Activity, Cpu, Signal } from 'lucide-react';
import { BatteryIcon } from '@/components/dashboard/BatteryIcon';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Device } from '@/types/device';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDeviceById, subscribeDevice } from '@/services/realtime';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const DeviceDetails = () => {
  const { deviceId } = useParams();
  const { data: initialDevice } = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => deviceId ? fetchDeviceById(deviceId) : Promise.resolve(null),
    staleTime: 30000,
  });
  const [device, setDevice] = useState<Device | null>(initialDevice ?? null);
 
  // MapLibre refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const MAPTILER_KEY = (import.meta as any).env?.VITE_MAPTILER_KEY || 'tBvtabTNxhFc7RfCBn1T';

  useEffect(() => {
    setDevice(initialDevice ?? null);
  }, [initialDevice]);
 
  useEffect(() => {
    if (!deviceId) return;
    const unsubscribe = subscribeDevice(deviceId, (live) => setDevice(live ?? (initialDevice ?? null)));
    return () => unsubscribe();
  }, [deviceId, initialDevice]);
 
  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
        center: [0, 0],
        zoom: 2,
      });
      mapRef.current = map;
    } catch (e) {
      console.error('DeviceDetails map init failed', e);
    }
    return () => {
      try {
        mapRef.current?.remove();
      } finally {
        mapRef.current = null;
      }
    };
  }, [MAPTILER_KEY]);

  // Update marker
  useEffect(() => {
    if (!device || !mapRef.current) return;
    try {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      const color = device.isFull ? '#EF4444' : device.binPercentage >= 75 ? '#F59E0B' : '#22C55E';
      markerRef.current = new maplibregl.Marker({ color })
        .setLngLat([device.longitude, device.latitude])
        .addTo(mapRef.current);
      mapRef.current.flyTo({ center: [device.longitude, device.latitude], zoom: 14, essential: true });
    } catch (e) {
      console.error('DeviceDetails marker update failed', e);
    }
  }, [device]);

  const deviceEvents = device && (device as any).events ? (device as any).events : [];


  if (!device) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="font-display text-2xl font-bold">Device Not Found</h1>
          <p className="text-muted-foreground mb-4">The device "{deviceId}" could not be found.</p>
          <Link to="/devices">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Devices
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const getMarkerColor = () => {
    if (device.isFull) return 'bg-destructive';
    if (device.binPercentage >= 75) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/devices">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{device.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <DeviceStatusBadge status={device.status} />
              </div>
            </div>
          </div>
          <StatusBadge isFull={device.isFull} size="md" />
        </div>

        {/* Main Info Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center p-6">
            <TrashBinIcon percentage={device.binPercentage} size="lg" isFull={device.isFull} />
            <div className="mt-4 flex flex-col items-center">
              <span className="font-display text-2xl font-bold text-foreground">{device.binPercentage}%</span>
              <p className="text-sm text-muted-foreground">Current Fill Level</p>
            </div>
            <StatusBadge isFull={device.isFull} computed={device.binPercentage >= 90 && !device.isFull} />
          </Card>

          {/* Battery Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Battery className={cn(
                  'h-5 w-5',
                  device.batteryLevel > 50 ? 'text-success' : device.batteryLevel > 20 ? 'text-warning' : 'text-destructive'
                )} />
                Battery Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <div className="flex items-center gap-3">
                  <BatteryIcon percentage={device.batteryLevel} size="md" />
                  <span className="font-display text-2xl font-bold">{device.batteryLevel}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Voltage</p>
                <p className="font-display text-xl font-semibold">{device.batteryVoltage}V</p>
              </div>
            </CardContent>
          </Card>

          {/* Device Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="h-5 w-5 text-primary" />
                Device Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Wakeup Reason</span>
                <Badge variant="outline">{device.wakeupReason}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Boot Count</span>
                <span className="font-semibold">{device.bootCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tamper Status</span>
                <TamperBadge tamperDetected={device.tamperDetected} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sensor Data & Map */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Raw Sensor Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Signal className="h-5 w-5 text-primary" />
                Real-time Sensor Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'binPercentage', value: device.binPercentage, unit: '%' },
                  { label: 'isFull', value: device.isFull ? 'true' : 'false', highlight: device.isFull },
                  { label: 'latitude', value: device.latitude.toFixed(6) },
                  { label: 'longitude', value: device.longitude.toFixed(6) },
                  { label: 'altitude', value: device.altitude || 'N/A', unit: 'm' },
                  { label: 'batteryLevel', value: device.batteryLevel, unit: '%' },
                  { label: 'batteryVoltage', value: device.batteryVoltage, unit: 'V' },
                  { label: 'tamperDetected', value: device.tamperDetected ? 'true' : 'false', highlight: device.tamperDetected },
                  { label: 'wakeupReason', value: device.wakeupReason },
                  { label: 'bootCount', value: device.bootCount },
                  { label: 'timestamp', value: format(new Date(device.timestamp), 'yyyy-MM-dd HH:mm:ss'), fullWidth: true },
                  { label: 'message', value: device.message || 'N/A', fullWidth: true },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      'rounded-lg border border-border bg-muted/30 p-3',
                      item.fullWidth && 'col-span-2'
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    <p className={cn(
                      'font-mono text-sm font-semibold',
                      item.highlight ? 'text-destructive' : 'text-foreground'
                    )}>
                      {item.value}{item.unit || ''}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg bg-muted overflow-hidden">
                <div ref={mapContainerRef} className="absolute inset-0" />
                
                <div className="absolute bottom-3 left-3 rounded-md bg-card/90 backdrop-blur px-3 py-2">
                  <p className="text-xs font-medium">{device.latitude.toFixed(6)}, {device.longitude.toFixed(6)}</p>
                </div>
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <Badge className="bg-success text-success-foreground">OK</Badge>
                  <Badge className="bg-warning text-warning-foreground">≥75%</Badge>
                  <Badge className="bg-destructive text-destructive-foreground">Full</Badge>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Powered by MapTiler / MapLibre
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Event Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Event Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {deviceEvents.length > 0 ? (
                <div className="space-y-3">
                  {deviceEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{event.eventType.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.previousValue !== undefined && (
                              <>
                                <span className="text-muted-foreground">{String(event.previousValue)}</span>
                                <span className="mx-1">→</span>
                              </>
                            )}
                            <span className="text-foreground font-medium">{String(event.newValue)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  No events recorded for this device
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DeviceDetails;
