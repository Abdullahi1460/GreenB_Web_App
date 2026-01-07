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
      <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-1000">
        {/* Header with Glassmorphism */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-6 rounded-3xl bg-card/30 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex items-center gap-6 relative z-10">
            <Link to="/devices">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white/10 transition-all hover:scale-110">
                <ArrowLeft className="h-5 w-5 text-primary" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-4xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  {device.id}
                </h1>
                <DeviceStatusBadge status={device.status} />
              </div>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-1">
                <Cpu className="h-3.5 w-3.5" />
                System ID: <span className="text-foreground/80 font-mono uppercase">{deviceId}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <StatusBadge isFull={device.isFull} size="lg" className="shadow-lg shadow-destructive/20" />
          </div>
        </div>

        {/* Hero Section: The Bin & Vitals */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Futuristic Bin Visualization */}
          <Card className="lg:col-span-4 bg-card/20 backdrop-blur-lg border-white/5 shadow-2xl rounded-[2.5rem] flex flex-col items-center justify-center p-10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="relative z-10">
              <TrashBinIcon percentage={device.binPercentage} size="lg" isFull={device.isFull} />
            </div>
            <div className="mt-8 flex flex-col items-center relative z-10">
              <span className="font-display text-6xl font-black text-foreground tracking-tighter">
                {device.binPercentage}<span className="text-2xl text-primary font-bold">%</span>
              </span>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">Fill Intensity</p>
            </div>
            <div className="mt-6 w-full px-4 relative z-10">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-1000 ease-out",
                    device.isFull ? "bg-destructive" : device.binPercentage >= 75 ? "bg-warning" : "bg-primary"
                  )}
                  style={{ width: `${device.binPercentage}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Core Vitals Grid */}
          <div className="lg:col-span-8 grid gap-6 sm:grid-cols-2">
            {/* Battery Card */}
            <Card className="bg-card/20 backdrop-blur-lg border-white/5 shadow-xl rounded-3xl p-6 hover:border-primary/20 transition-all group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Battery className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">Energy Matrix</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Charge Level</p>
                    <div className="flex items-center gap-3">
                      <BatteryIcon percentage={device.batteryLevel} size="md" />
                      <span className="text-3xl font-black">{device.batteryLevel}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Voltage</p>
                    <p className="text-2xl font-black text-primary">{device.batteryVoltage}<span className="text-sm font-bold">V</span></p>
                  </div>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-1000"
                    style={{ width: `${device.batteryLevel}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* System Health */}
            <Card className="bg-card/20 backdrop-blur-lg border-white/5 shadow-xl rounded-3xl p-6 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">Diagnostics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                  <TamperBadge tamperDetected={device.tamperDetected} />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Boot Cyc</p>
                  <p className="text-xl font-black">{device.bootCount}</p>
                </div>
                <div className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Wake Reason</p>
                    <p className="text-sm font-bold text-primary capitalize">{device.wakeupReason}</p>
                  </div>
                  <Zap className="h-4 w-4 text-primary animate-pulse" />
                </div>
              </div>
            </Card>

            {/* Location / Signal Info */}
            <Card className="sm:col-span-2 bg-card/20 backdrop-blur-lg border-white/5 shadow-xl rounded-3xl p-6 hover:border-primary/20 transition-all flex flex-col sm:flex-row gap-6 sm:items-center">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                    <Signal className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Transmission</h3>
                    <p className="text-xs text-muted-foreground font-medium">Last active: {format(new Date(device.timestamp), 'HH:mm:ss, MMM d')}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Latitude</p>
                  <p className="text-sm font-mono font-bold">{device.latitude.toFixed(5)}</p>
                </div>
                <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Longitude</p>
                  <p className="text-sm font-mono font-bold">{device.longitude.toFixed(5)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Intelligence Grid: Map & Logs */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Cinematic Map Container */}
          <Card className="bg-card/20 backdrop-blur-lg border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden group">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-bold">Deployment Zone</h3>
              </div>
            </div>
            <div className="relative aspect-video sm:aspect-square lg:aspect-video m-4 rounded-[2rem] overflow-hidden grayscale-[0.5] contrast-[1.1] hover:grayscale-0 transition-all duration-1000">
              <div ref={mapContainerRef} className="absolute inset-0" />
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[2rem]" />

              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                <div className="rounded-2xl bg-background/80 backdrop-blur-md px-4 py-3 border border-white/10 shadow-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Geo-Coordinates</p>
                  <p className="text-xs font-mono font-bold">{device.latitude.toFixed(6)}, {device.longitude.toFixed(6)}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase">Live</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Precision Event Logs */}
          <Card className="bg-card/20 backdrop-blur-lg border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-bold">Neural Activity</h3>
              </div>
              <Badge variant="outline" className="border-white/10 text-[10px] uppercase font-bold tracking-widest">
                {deviceEvents.length} Logs
              </Badge>
            </div>
            <CardContent className="p-0">
              <ScrollArea className="h-[432px]">
                {deviceEvents.length > 0 ? (
                  <div className="p-6 space-y-4">
                    {deviceEvents.map((event, idx) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors group animate-in slide-in-from-right-4 duration-500"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                            <Zap className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight uppercase">{event.eventType.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                              {event.previousValue !== undefined && (
                                <>
                                  <span className="opacity-50 line-through">{String(event.previousValue)}</span>
                                  <span className="mx-2 text-primary">»</span>
                                </>
                              )}
                              <span className="text-foreground font-bold">{String(event.newValue)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{format(new Date(event.timestamp), 'HH:mm:ss')}</p>
                          <p className="text-[10px] font-medium text-muted-foreground/50">{format(new Date(event.timestamp), 'MMM d')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                    <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Clock className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No recent neural activity recorded.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DeviceDetails;
