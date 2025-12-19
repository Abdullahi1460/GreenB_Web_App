import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, DeviceStatusBadge, TamperBadge } from '@/components/dashboard/StatusBadge';
import { TrashBinIcon } from '@/components/dashboard/TrashBinIcon';
import { BatteryIcon } from '@/components/dashboard/BatteryIcon';
// removed: import { mockDevices } from '@/data/mockData';
import { Search, Filter, ArrowUpDown, ExternalLink, HardDrive, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchDevices, subscribeDevices, createDevice } from '@/services/realtime';
import type { Device } from '@/types/device';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { usedFallback as firebaseUsingDemo } from '@/lib/firebase';

type SortKey = 'id' | 'binPercentage' | 'batteryLevel' | 'timestamp';
type SortOrder = 'asc' | 'desc';

const Devices = () => {
  const [search, setSearch] = useState('');
  const [filterFull, setFilterFull] = useState<string>('all');
  const [filterTamper, setFilterTamper] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('binPercentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [realtimeDevices, setRealtimeDevices] = useState<Device[] | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({ id: '', latitude: '', longitude: '', binPercentage: '', batteryLevel: '' });
  const { toast } = useToast();

  const { data: liveDevices, isLoading, isError, error } = useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: 30_000,
  });

  useEffect(() => {
    const unsubscribe = subscribeDevices((devices) => {
      setRealtimeDevices(devices);
    });
    return () => {
      // Firebase onValue returns unsubscribe function
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const devices = useMemo(() => {
    const base = (realtimeDevices && realtimeDevices.length > 0)
      ? realtimeDevices
      : (liveDevices && liveDevices.length > 0)
        ? liveDevices
        : [];

    let list = [...base];

    // Search filter
    if (search) {
      list = list.filter(d => 
        d.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Full filter
    if (filterFull !== 'all') {
      list = list.filter(d => 
        filterFull === 'full' ? d.isFull : !d.isFull
      );
    }

    // Tamper filter
    if (filterTamper !== 'all') {
      list = list.filter(d => 
        filterTamper === 'tampered' ? d.tamperDetected : !d.tamperDetected
      );
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'binPercentage':
          comparison = a.binPercentage - b.binPercentage;
          break;
        case 'batteryLevel':
          comparison = a.batteryLevel - b.batteryLevel;
          break;
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [search, filterFull, filterTamper, sortKey, sortOrder, realtimeDevices, liveDevices]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground">Devices</h1>
          <p className="text-muted-foreground">Manage and monitor all GreenB smart bins</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <HardDrive className="h-5 w-5 text-primary" />
                All Devices ({devices.length}) {isLoading ? '(loading...)' : ''}
              </CardTitle>
              <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Device
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Device</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-id">Device ID</Label>
                      <Input id="add-id" value={addForm.id} onChange={(e) => setAddForm({ ...addForm, id: e.target.value })} placeholder="device123" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-lat">Latitude</Label>
                        <Input id="add-lat" value={addForm.latitude} onChange={(e) => setAddForm({ ...addForm, latitude: e.target.value })} placeholder="11.973206" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-lng">Longitude</Label>
                        <Input id="add-lng" value={addForm.longitude} onChange={(e) => setAddForm({ ...addForm, longitude: e.target.value })} placeholder="8.554036" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-fill">Initial Fill (%)</Label>
                        <Input id="add-fill" value={addForm.binPercentage} onChange={(e) => setAddForm({ ...addForm, binPercentage: e.target.value })} placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-battery">Battery (%)</Label>
                        <Input id="add-battery" value={addForm.batteryLevel} onChange={(e) => setAddForm({ ...addForm, batteryLevel: e.target.value })} placeholder="100" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                    <Button
                      onClick={async () => {
                        if (!addForm.id || !addForm.latitude || !addForm.longitude) {
                          toast({ title: 'Missing fields', description: 'Provide ID, latitude and longitude', variant: 'destructive' });
                          return;
                        }
                        setSaving(true);
                        try {
                          await createDevice({
                            id: addForm.id,
                            latitude: Number(addForm.latitude),
                            longitude: Number(addForm.longitude),
                            binPercentage: addForm.binPercentage ? Number(addForm.binPercentage) : 0,
                            batteryLevel: addForm.batteryLevel ? Number(addForm.batteryLevel) : 100,
                          });
                          toast({ title: 'Device added', description: `Created ${addForm.id}` });
                          setOpenAdd(false);
                          setAddForm({ id: '', latitude: '', longitude: '', binPercentage: '', batteryLevel: '' });
                        } catch (err: unknown) {
                          const message = err instanceof Error ? err.message : String(err);
                          toast({ title: 'Error', description: message ?? 'Failed to add device', variant: 'destructive' });
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {isError ? (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">RTDB Error</Badge>
              ) : (realtimeDevices && realtimeDevices.length > 0) ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">Connected (live)</Badge>
              ) : (liveDevices && liveDevices.length > 0) ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">Connected</Badge>
              ) : firebaseUsingDemo ? (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Demo config active</Badge>
              ) : isLoading ? (
                <Badge variant="outline" className="bg-muted/30 text-muted-foreground">Loading…</Badge>
              ) : (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">No data</Badge>
              )}
              {isError && error instanceof Error && (
                <span className="text-xs text-muted-foreground">{error.message}</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterFull} onValueChange={setFilterFull}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Fill Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="full">Full Only</SelectItem>
                  <SelectItem value="not_full">Not Full</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTamper} onValueChange={setFilterTamper}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tamper Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tamper</SelectItem>
                  <SelectItem value="tampered">Tampered</SelectItem>
                  <SelectItem value="secure">Secure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="block md:hidden space-y-2">
              {devices.map((device) => (
                <Link key={device.id} to={`/devices/${device.id}`} className="block">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrashBinIcon percentage={device.binPercentage} size="sm" isFull={device.isFull} />
                        <span className="text-sm font-semibold text-foreground">{device.id}</span>
                      </div>
                      <span className={cn(
                        'text-sm font-semibold',
                        device.isFull ? 'text-destructive' : device.binPercentage >= 75 ? 'text-warning' : 'text-success'
                      )}>
                        {device.binPercentage}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge isFull={device.isFull} size="sm" />
                        <TamperBadge tamperDetected={device.tamperDetected} />
                      </div>
                      <div className="flex items-center gap-2">
                        <BatteryIcon percentage={device.batteryLevel} size="sm" />
                        <span className="text-xs text-muted-foreground">{device.batteryLevel}%</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(device.timestamp), 'MMM d, HH:mm')}
                      </span>
                      <DeviceStatusBadge status={device.status} />
                    </div>
                  </div>
                </Link>
              ))}
              {devices.length === 0 && (
                <div className="rounded-lg border border-border p-3 text-center text-sm text-muted-foreground">
                  No devices found in Firebase.
                </div>
              )}
            </div>

            <div className="hidden md:block rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px]">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('id')} className="h-8 -ml-3">
                        Device ID
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('binPercentage')} className="h-8 -ml-3">
                        Fill (%)
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Is Full</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('batteryLevel')} className="h-8 -ml-3">
                        Battery
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Tamper</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('timestamp')} className="h-8 -ml-3">
                        Timestamp
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{device.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrashBinIcon percentage={device.binPercentage} size="sm" isFull={device.isFull} />
                          <span className={cn(
                            'font-semibold',
                            device.isFull ? 'text-destructive' : device.binPercentage >= 75 ? 'text-warning' : 'text-success'
                          )}>
                            {device.binPercentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge isFull={device.isFull} size="sm" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BatteryIcon percentage={device.batteryLevel} size="sm" />
                          <span className="text-sm">{device.batteryLevel}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TamperBadge tamperDetected={device.tamperDetected} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(device.timestamp), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <DeviceStatusBadge status={device.status} />
                      </TableCell>
                      <TableCell>
                        <Link to={`/devices/${device.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {devices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-sm text-muted-foreground">
                        No devices found in Firebase.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Devices;
