import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// removed mockDevices; using Firebase devices via fetchDevices/subscribeDevices
import { MapPin, Trash2, Battery, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { BatteryIcon } from '@/components/dashboard/BatteryIcon';
import { cn } from '@/lib/utils';
import { Device } from '@/types/device';
import { StatusBadge, TamperBadge } from '@/components/dashboard/StatusBadge';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDevices, subscribeDevices } from '@/services/realtime';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapView = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [realtimeDevices, setRealtimeDevices] = useState<Device[] | null>(null);

  const { data: liveDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: 30_000,
  });

  useEffect(() => {
    const unsubscribe = subscribeDevices((devices) => setRealtimeDevices(devices));
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const devices = (realtimeDevices && realtimeDevices.length > 0)
    ? realtimeDevices
    : (liveDevices && liveDevices.length > 0)
      ? liveDevices
      : [];

  // MapLibre/MapTiler setup
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const MAPTILER_KEY = (import.meta as any).env?.VITE_MAPTILER_KEY || 'tBvtabTNxhFc7RfCBn1T';

  // Helper for device list item color
  const getMarkerColor = (device: Device) => {
    if (device.isFull) return 'bg-destructive';
    if (device.binPercentage >= 75) return 'bg-warning';
    return 'bg-success';
  };

  // Initialize map once
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
      console.error('Map initialization failed', e);
    }

    return () => {
      try {
        mapRef.current?.remove();
      } finally {
        mapRef.current = null;
      }
    };
  }, [MAPTILER_KEY]);

  // Update markers when devices change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      // Remove old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      devices.forEach((device) => {
        if (typeof device.longitude !== 'number' || typeof device.latitude !== 'number') return;
        const color = device.isFull ? '#EF4444' : device.binPercentage >= 75 ? '#F59E0B' : '#22C55E';
        const marker = new maplibregl.Marker({ color })
          .setLngLat([device.longitude, device.latitude])
          .addTo(map);
        marker.getElement().addEventListener('click', () => setSelectedDevice(device));
        markersRef.current.push(marker);
      });

      // Fit to bounds if we have devices
      if (devices.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        devices.forEach((d) => {
          if (typeof d.longitude === 'number' && typeof d.latitude === 'number') {
            bounds.extend([d.longitude, d.latitude]);
          }
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 14 });
        }
      }
    } catch (e) {
      console.error('Updating markers failed', e);
    }
  }, [devices]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground">Map View</h1>
          <p className="text-muted-foreground">City-wide overview of all GreenB devices</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Map */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Device Locations
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-success text-success-foreground">OK</Badge>
                  <Badge className="bg-warning text-warning-foreground">≥75%</Badge>
                  <Badge className="bg-destructive text-destructive-foreground">Full</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <div ref={mapContainerRef} className="absolute inset-0" />
                {/* MapLibre container only; removed old background overlays */}

                {/* MapLibre markers handled via maplibre-gl; removed demo overlay */}

                {/* Selected device popup */}
                {selectedDevice && (
                  <div className="absolute bottom-4 left-4 right-4 z-30 animate-slide-in sm:left-auto sm:w-80">
                    <Card className="shadow-lg">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Trash2 className="h-4 w-4 text-primary" />
                            {selectedDevice.id}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setSelectedDevice(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Fill Level</span>
                          <span className={cn(
                            'font-semibold',
                            selectedDevice.isFull ? 'text-destructive' : selectedDevice.binPercentage >= 75 ? 'text-warning' : 'text-success'
                          )}>
                            {selectedDevice.binPercentage}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <StatusBadge isFull={selectedDevice.isFull} size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Battery</span>
                          <div className="flex items-center gap-2">
                            <BatteryIcon percentage={selectedDevice.batteryLevel} size="sm" />
                            <span className="text-sm font-medium">{selectedDevice.batteryLevel}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Tamper</span>
                          <TamperBadge tamperDetected={selectedDevice.tamperDetected} />
                        </div>
                        <Link to={`/devices/${selectedDevice.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Map info */}
                <div className="absolute bottom-3 left-3 rounded-md bg-card/90 backdrop-blur px-3 py-2">
                  <p className="text-xs font-medium">{devices.length} devices</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Powered by MapTiler / MapLibre
              </p>
            </CardContent>
          </Card>

          {/* Device List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">All Devices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={cn(
                    'w-full rounded-lg border border-border p-3 text-left transition-all hover:bg-muted/50',
                    selectedDevice?.id === device.id && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'h-3 w-3 rounded-full',
                        getMarkerColor(device)
                      )} />
                      <span className="text-sm font-medium">{device.id}</span>
                    </div>
                    <span className={cn(
                      'text-sm font-semibold',
                      device.isFull ? 'text-destructive' : device.binPercentage >= 75 ? 'text-warning' : 'text-success'
                    )}>
                      {device.binPercentage}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>isFull: {device.isFull ? 'true' : 'false'}</span>
                    {device.tamperDetected && (
                      <AlertTriangle className="h-3 w-3 text-warning" />
                    )}
                  </div>
                </button>
              ))}
              {devices.length === 0 && (
                <p className="text-sm text-muted-foreground">No devices found in Firebase.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MapView;
