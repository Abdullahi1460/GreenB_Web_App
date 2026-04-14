import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// removed mockDevices; using Firebase devices via fetchDevices/subscribeDevices
import { MapPin, Trash2, Battery, AlertTriangle, X, ExternalLink, Layers } from 'lucide-react';
import { BatteryIcon } from '@/components/dashboard/BatteryIcon';
import { cn } from '@/lib/utils';
import { Device } from '@/types/device';
import { StatusBadge, TamperBadge } from '@/components/dashboard/StatusBadge';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDevices, subscribeDevices } from '@/services/realtime';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { FeatureGuard } from '@/components/FeatureGuard';
import { auth, db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

const MapView = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [realtimeDevices, setRealtimeDevices] = useState<Device[] | null>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [uid, setUid] = useState<string>('');
  const [mapType, setMapType] = useState<string>('roadmap');

  const queryUid = role === 'admin' ? undefined : (uid || undefined);

  const { data: liveDevices } = useQuery({
    queryKey: ['devices', queryUid],
    queryFn: () => fetchDevices(queryUid),
    staleTime: 30_000,
    enabled: role === 'admin' || !!uid,
  });

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    if (mapRef.current && typeof device.longitude === 'number' && typeof device.latitude === 'number') {
      mapRef.current.panTo({ lat: device.latitude, lng: device.longitude });
      mapRef.current.setZoom(21);
      setMapType('hybrid');
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        onValue(ref(db, `users/${user.uid}/role`), (snap) => {
          setRole(snap.val() === 'admin' ? 'admin' : 'user');
        });
      } else {
        setUid('');
        setRole('user');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (role === 'admin' || uid) {
      unsubscribe = subscribeDevices((devices) => setRealtimeDevices(devices), queryUid);
    }
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [role, uid, queryUid]);

  const devices = (realtimeDevices && realtimeDevices.length > 0)
    ? realtimeDevices
    : (liveDevices && liveDevices.length > 0)
      ? liveDevices
      : [];

  const mapRef = useRef<any>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyAButwja5jalAEzCJCPDzQexcK48Hn54G0'
  });

  const getStatusConfig = (device: Device) => {
    if (device.isFull) return { color: '#EF4444', bg: 'bg-destructive', shadow: 'shadow-destructive/50', glow: 'bg-destructive', gradient: 'from-destructive/20 to-transparent' };
    if (device.binPercentage >= 75) return { color: '#F59E0B', bg: 'bg-warning', shadow: 'shadow-warning/50', glow: 'bg-warning', gradient: 'from-warning/20 to-transparent' };
    return { color: '#22C55E', bg: 'bg-success', shadow: 'shadow-success/50', glow: 'bg-success', gradient: 'from-success/20 to-transparent' };
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground">Map View</h1>
          <p className="text-muted-foreground">City-wide overview of all GreenB devices</p>
        </div>

        <FeatureGuard requiredPlan="professional" allowTeaser>
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Map */}
            <Card className="lg:col-span-3 border-primary/20 bg-card/60 backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
              <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div className="flex items-center gap-2 font-display text-lg group">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-5 w-5 text-primary group-hover:animate-bounce" />
                    </div>
                    Device Locations
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Select value={mapType} onValueChange={setMapType}>
                      <SelectTrigger className="h-8 w-[140px] text-xs bg-background/50 backdrop-blur-sm border-border/50 font-medium">
                        <Layers className="h-3.5 w-3.5 mr-2 text-primary" />
                        <SelectValue placeholder="Map Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roadmap">Roadmap</SelectItem>
                        <SelectItem value="satellite">Satellite</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="terrain">Terrain</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 px-3 py-1 bg-background/50 backdrop-blur-sm rounded-full border border-border/50">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">OK</span>
                      </div>
                      <div className="h-4 w-[1px] bg-border/50 mx-1" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">≥75%</span>
                      </div>
                      <div className="h-4 w-[1px] bg-border/50 mx-1" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Full</span>
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                  {isLoaded && <GoogleMap
                    mapContainerClassName="absolute inset-0"
                    center={{ lat: 11.973194, lng: 8.553940 }}
                    zoom={12}
                    onLoad={(map) => mapRef.current = map}
                    onUnmount={() => mapRef.current = null}
                    options={{
                      disableDefaultUI: true,
                      mapTypeId: mapType,
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
                        { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                        { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                        { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
                      ]
                    }}
                  >
                    {devices.map((device) => {
                      if (typeof device.longitude !== 'number' || typeof device.latitude !== 'number') return null;
                      const config = getStatusConfig(device);
                      return (
                        <OverlayView
                          key={device.id}
                          position={{ lat: device.latitude, lng: device.longitude }}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                          <div className="-translate-x-1/2 -translate-y-1/2 cursor-pointer group" onClick={() => handleDeviceSelect(device)}>
                            <div className={cn("absolute inset-0 h-10 w-10 -m-3 rounded-full animate-ping-slow opacity-30", config.bg)} />
                            <div className={cn(
                              "relative h-4 w-4 rounded-full border-2 border-white shadow-lg animate-marker-pulse transform transition-transform group-hover:scale-125",
                              config.bg, config.shadow
                            )} />
                          </div>
                        </OverlayView>
                      );
                    })}
                  </GoogleMap>}

                  {/* Selected device popup */}
                  {selectedDevice && (
                    <div className="absolute bottom-4 left-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:left-auto sm:w-80">
                      <Card className="shadow-2xl border-primary/30 bg-card/80 backdrop-blur-lg group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <CardHeader className="pb-2 border-b border-border/50">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                              <Trash2 className="h-4 w-4 text-primary" />
                              {selectedDevice.name || selectedDevice.id}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={() => setSelectedDevice(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">{selectedDevice.id}</p>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                          <div className="flex items-center justify-between group/item">
                            <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors">Fill Level</span>
                            <span className={cn(
                              'font-bold text-base transition-all group-hover/item:scale-110',
                              selectedDevice.isFull ? 'text-destructive' : selectedDevice.binPercentage >= 75 ? 'text-orange-500' : 'text-success'
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
                              <BatteryIcon percentage={selectedDevice.batteryLevel} size="xs" />
                              <span className="text-sm font-bold">{selectedDevice.batteryLevel}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tamper</span>
                            <TamperBadge tamperDetected={selectedDevice.tamperDetected} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground italic border-t border-border/30 pt-2">
                            <span>Location: {selectedDevice.location || 'Unknown'}</span>
                            <span>{new Date(selectedDevice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <Link to={`/devices/${selectedDevice.id}?owner=${selectedDevice.ownerId}`} className="block">
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Deep Analytics
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
                  Powered by Google Maps
                </p>
              </CardContent>
            </Card>

            {/* Device List */}
            <Card className="border-primary/20 bg-card/40 backdrop-blur-md overflow-hidden">
              <CardHeader className="pb-2 border-b border-border/30 bg-background/20">
                <CardTitle className="font-display text-base flex items-center justify-between">
                  All Devices
                  <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/20 text-primary">
                    {devices.length} Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto p-3 grid grid-cols-2 lg:grid-cols-1 gap-2 custom-scrollbar">
                  {devices.map((device) => {
                    const config = getStatusConfig(device);
                    return (
                      <button
                        key={`${device.ownerId}_${device.id}`}
                        onClick={() => handleDeviceSelect(device)}
                        className={cn(
                          'w-full rounded-xl border p-3 text-left transition-all duration-300 group relative overflow-hidden',
                          selectedDevice?.id === device.id
                            ? cn('border-primary shadow-lg shadow-primary/20 bg-primary/5', config.gradient)
                            : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                'h-2 w-2 rounded-full animate-pulse',
                                config.bg,
                                config.shadow
                              )} />
                              <span className="text-xs font-bold truncate max-w-[80px]">{device.name || device.id}</span>
                            </div>
                            <span className={cn(
                              'text-xs font-black',
                              device.isFull ? 'text-destructive' : device.binPercentage >= 75 ? 'text-orange-500' : 'text-success'
                            )}>
                              {device.binPercentage}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 opacity-80 scale-75 origin-left">
                              <BatteryIcon percentage={device.batteryLevel} size="xs" />
                            </div>
                            {device.tamperDetected && (
                              <AlertTriangle className="h-3 w-3 text-destructive animate-bounce" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {devices.length === 0 && (
                    <div className="col-span-2 py-8 text-center">
                      <p className="text-xs text-muted-foreground italic">No devices synchronizing...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </FeatureGuard>
      </div>
    </Layout>
  );
};

export default MapView;
