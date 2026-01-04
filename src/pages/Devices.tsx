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
import { usedFallback as firebaseUsingDemo, auth, db } from '@/lib/firebase';
import { ref, get, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [addForm, setAddForm] = useState({ id: '', name: '', type: '', location: '' });
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [uid, setUid] = useState<string>('');
  const { toast } = useToast();

  const { data: liveDevices, isLoading, isError, error } = useQuery({
    queryKey: ['devices'],
    queryFn: () => fetchDevices(),
    staleTime: 30_000,
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        const roleRef = ref(db, `users/${user.uid}/role`);
        onValue(roleRef, (snapshot) => {
          const r = snapshot.val();
          setRole(r === 'admin' ? 'admin' : 'user');
        });
      } else {
        setUid('');
        setRole('user');
      }
    });

    const unsubscribeDevices = subscribeDevices((devices) => {
      setRealtimeDevices(devices);
    });

    return () => {
      unsubscribeAuth();
      if (typeof unsubscribeDevices === 'function') unsubscribeDevices();
    };
  }, []);

  const devices = useMemo(() => {
    const base = (realtimeDevices && realtimeDevices.length > 0)
      ? realtimeDevices
      : (liveDevices && liveDevices.length > 0)
        ? liveDevices
        : [];

    let list = [...base];

    // Filter by Owner unless Admin
    if (role !== 'admin' && uid) {
      list = list.filter(d => d.ownerId === uid);
    }

    // Search filter
    if (search) {
      list = list.filter(d =>
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.location?.toLowerCase().includes(search.toLowerCase())
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
                      <Input id="add-id" value={addForm.id} onChange={(e) => setAddForm({ ...addForm, id: e.target.value })} placeholder="Ex: GNB-001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-type">Device Type</Label>
                      <Input id="add-type" value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value })} placeholder="Ex: Sensor, Smart Bin, Truck" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-name">Device Name</Label>
                      <Input id="add-name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Ex: Main Office Bin" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-location">Device Location</Label>
                      <Input id="add-location" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} placeholder="Ex: 55 Marina Road, Lagos" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                    <Button
                      onClick={async () => {
                        if (!addForm.id || !addForm.name || !addForm.type || !addForm.location) {
                          toast({ title: 'Missing fields', description: 'Please fill all fields', variant: 'destructive' });
                          return;
                        }
                        setSaving(true);
                        try {
                          const user = auth.currentUser;
                          if (!user) throw new Error("User not authenticated");

                          await createDevice({
                            id: addForm.id,
                            name: addForm.name,
                            type: addForm.type,
                            location: addForm.location,
                            ownerId: user.uid,
                            ownerEmail: user.email || '',
                            latitude: 0,
                            longitude: 0,
                          });
                          toast({ title: 'Device added', description: `Created ${addForm.id}` });
                          setOpenAdd(false);
                          setAddForm({ id: '', name: '', type: '', location: '' });
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

            <div className="grid md:hidden grid-cols-2 gap-3">
              {devices.map((device) => {
                const isHigh = device.binPercentage >= 75 && !device.isFull;
                const isNormal = device.binPercentage < 75;
                const statusColor = device.isFull 
                  ? { border: 'border-destructive/30', gradient: 'from-destructive/10 via-card to-destructive/5', shadow: 'hover:shadow-destructive/20', icon: 'text-destructive', shimmer: 'from-destructive/0 via-destructive/10 to-destructive/0' }
                  : isHigh
                  ? { border: 'border-orange-500/30', gradient: 'from-orange-500/10 via-card to-orange-600/5', shadow: 'hover:shadow-orange-500/20', icon: 'text-orange-500', shimmer: 'from-orange-500/0 via-orange-500/10 to-orange-500/0' }
                  : { border: 'border-success/30', gradient: 'from-success/10 via-card to-success/5', shadow: 'hover:shadow-success/20', icon: 'text-success', shimmer: 'from-success/0 via-success/10 to-success/0' };

                return (
                  <Link key={device.id} to={`/devices/${device.id}`} className="block group">
                    <div className={cn(
                      "relative overflow-hidden rounded-xl border backdrop-blur-sm p-3 transition-all duration-500 hover:scale-105 hover:-translate-y-1 hover:shadow-xl",
                      statusColor.border,
                      statusColor.gradient,
                      statusColor.shadow
                    )}>
                      <div className={cn("absolute inset-0 bg-gradient-to-r translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000", statusColor.shimmer)} />
                      
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between">
                          <TrashBinIcon percentage={device.binPercentage} size="sm" isFull={device.isFull} />
                          <span className={cn(
                            'text-sm font-bold',
                            device.isFull ? 'text-destructive' : isHigh ? 'text-orange-500' : 'text-success'
                          )}>
                            {device.binPercentage}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-foreground truncate">{device.name || device.id}</h3>
                          <p className="text-[10px] text-muted-foreground truncate">{device.id}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge isFull={device.isFull} size="sm" />
                          <TamperBadge tamperDetected={device.tamperDetected} />
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                          <div className="flex items-center gap-1">
                            <BatteryIcon percentage={device.batteryLevel} size="xs" />
                            <span className="text-[10px] text-muted-foreground font-medium">{device.batteryLevel}%</span>
                          </div>
                          <DeviceStatusBadge status={device.status} />
                        </div>
                        
                        <div className="text-[9px] text-muted-foreground/60 text-right italic">
                          {format(new Date(device.timestamp), 'MMM d, HH:mm')}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {devices.length === 0 && (
                <div className="col-span-2 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground backdrop-blur-sm">
                  No devices found.
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
                      <TableCell className="font-medium">
                        <div>{device.name || device.id}</div>
                        <div className="text-xs text-muted-foreground">{device.id}</div>
                      </TableCell>
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
                        {device.location || `${device.latitude.toFixed(4)}, ${device.longitude.toFixed(4)}`}
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
