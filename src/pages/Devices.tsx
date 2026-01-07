import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, DeviceStatusBadge, TamperBadge } from '@/components/dashboard/StatusBadge';
import { TrashBinIcon } from '@/components/dashboard/TrashBinIcon';
import { BatteryIcon } from '@/components/dashboard/BatteryIcon';
import { Search, Filter, ArrowUpDown, ExternalLink, Plus, LayoutGrid, List, Activity, Cpu, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchDevices, subscribeDevices, createDevice } from '@/services/realtime';
import type { Device } from '@/types/device';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { auth, db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const sortedDevices = useMemo(() => {
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
  }, [search, filterFull, filterTamper, sortKey, sortOrder, realtimeDevices, liveDevices, role, uid]);

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
      <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-1000">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-4xl font-black tracking-tighter text-foreground">Devices</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Manage and monitor all GreenB smart assets
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-muted/30 backdrop-blur-md rounded-xl border border-white/5">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('grid')}
                className={cn("rounded-lg h-8 px-3 transition-all", viewMode === 'grid' && "shadow-lg")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('list')}
                className={cn("rounded-lg h-8 px-3 transition-all", viewMode === 'list' && "shadow-lg")}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>

            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 rounded-xl px-4 h-10 transition-all active:scale-95">
                  <Plus className="mr-2 h-4 w-4" />
                  Register Device
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-white/10 bg-card/90 backdrop-blur-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight">Add New Device</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-id" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Device ID</Label>
                    <Input id="add-id" value={addForm.id} onChange={(e) => setAddForm({ ...addForm, id: e.target.value })} placeholder="Ex: GNB-001" className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Friendly Name</Label>
                    <Input id="add-name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Ex: Main Office Bin" className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-type" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Asset Type</Label>
                      <Input id="add-type" value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value })} placeholder="Sensor" className="bg-white/5 border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-location" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</Label>
                      <Input id="add-location" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} placeholder="Lagos, NG" className="bg-white/5 border-white/10 rounded-xl" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpenAdd(false)} className="rounded-xl">Cancel</Button>
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
                        toast({ title: 'Success', description: `Registered ${addForm.id}` });
                        setOpenAdd(false);
                        setAddForm({ id: '', name: '', type: '', location: '' });
                      } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : String(err);
                        toast({ title: 'Error', description: message ?? 'Failed to register', variant: 'destructive' });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="bg-primary text-primary-foreground hover:shadow-lg rounded-xl px-8"
                  >
                    {saving ? 'Syncing...' : 'Complete Registration'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="p-4 rounded-2xl bg-card/30 backdrop-blur-xl border border-white/10 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID, name, or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 bg-white/5 border-white/5 rounded-xl focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3">
             <Select value={filterFull} onValueChange={setFilterFull}>
               <SelectTrigger className="w-[140px] h-11 bg-white/5 border-white/5 rounded-xl">
                 <Filter className="mr-2 h-4 w-4 opacity-50" />
                 <SelectValue placeholder="Capacity" />
               </SelectTrigger>
               <SelectContent className="rounded-xl border-white/10 bg-card/90 backdrop-blur-xl">
                 <SelectItem value="all">Total Range</SelectItem>
                 <SelectItem value="full">Critical (Full)</SelectItem>
                 <SelectItem value="not_full">Operational</SelectItem>
               </SelectContent>
             </Select>
             
             <Select value={sortKey} onValueChange={(val) => setSortKey(val as SortKey)}>
               <SelectTrigger className="w-[160px] h-11 bg-white/5 border-white/5 rounded-xl">
                 <ArrowUpDown className="mr-2 h-4 w-4 opacity-50" />
                 <SelectValue placeholder="Sort Method" />
               </SelectTrigger>
               <SelectContent className="rounded-xl border-white/10 bg-card/90 backdrop-blur-xl">
                 <SelectItem value="id">Identifier</SelectItem>
                 <SelectItem value="binPercentage">Capacity</SelectItem>
                 <SelectItem value="batteryLevel">Energy</SelectItem>
                 <SelectItem value="timestamp">Last Active</SelectItem>
               </SelectContent>
             </Select>

             <Button 
               variant="ghost" 
               size="icon" 
               className="h-11 w-11 rounded-xl bg-white/5 border border-white/5"
               onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
             >
               <ArrowUpDown className={cn("h-4 w-4 transition-transform", sortOrder === 'desc' && "rotate-180")} />
             </Button>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
             {isLoading ? (
               <Badge className="bg-muted text-muted-foreground border-transparent animate-pulse">Syncing Hub...</Badge>
             ) : (
               <Badge className="bg-success/20 text-success border-success/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest relative overflow-hidden group">
                 <span className="relative z-10 flex items-center gap-1.5">
                   <div className="h-1 w-1 rounded-full bg-success animate-ping" />
                   {sortedDevices.length} Active Nodes
                 </span>
               </Badge>
             )}
          </div>
        </div>

        {/* Dynamic View Area */}
        {viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {sortedDevices.map((device) => {
                const isHigh = device.binPercentage >= 75 && !device.isFull;
                return (
                  <Link 
                    key={device.id} 
                    to={`/devices/${device.id}`} 
                    className="group relative block animate-in fade-in slide-in-from-bottom-4 duration-500"
                  >
                    <div className={cn(
                      "h-full p-6 rounded-[2rem] bg-card/20 backdrop-blur-lg border border-white/5 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:border-white/10 hover:shadow-2xl overflow-hidden relative",
                      device.isFull && "hover:shadow-destructive/10"
                    )}>
                      <div className={cn(
                        "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-10 blur-3xl rounded-full transition-colors",
                        device.isFull ? "bg-destructive" : isHigh ? "bg-warning" : "bg-primary"
                      )} />
                      
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-start justify-between">
                          <TrashBinIcon percentage={device.binPercentage} size="md" isFull={device.isFull} />
                          <div className="text-right">
                             <div className={cn(
                               "text-3xl font-black tracking-tighter leading-none mb-1",
                               device.isFull ? "text-destructive" : isHigh ? "text-warning" : "text-foreground"
                             )}>
                               {device.binPercentage}<span className="text-sm font-bold opacity-70">%</span>
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Load Level</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="font-display font-extrabold text-lg text-foreground truncate group-hover:text-primary transition-colors">{device.name || "Unnamed Device"}</h3>
                          <p className="text-xs font-mono text-muted-foreground uppercase opacity-60 flex items-center gap-1">
                            <Cpu className="h-3 w-3" /> {device.id}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge isFull={device.isFull} size="sm" />
                          <TamperBadge tamperDetected={device.tamperDetected} />
                          <DeviceStatusBadge status={device.status} />
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5">
                            <BatteryIcon percentage={device.batteryLevel} size="xs" />
                            <span className="text-xs font-bold">{device.batteryLevel}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            <Clock className="h-3 w-3" />
                            {format(new Date(device.timestamp), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
             })}
             {sortedDevices.length === 0 && (
               <div className="col-span-full py-20 flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-white/10 bg-card/10 backdrop-blur-sm shadow-inner">
                 <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                   <Search className="h-10 w-10 text-muted-foreground/30" />
                 </div>
                 <h3 className="text-lg font-bold text-foreground">Zero Sensors Detected</h3>
                 <p className="text-sm text-muted-foreground">Modify your search parameters or check connection.</p>
               </div>
             )}
          </div>
        ) : (
          <Card className="rounded-[2rem] bg-card/20 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent px-6 bg-white/5">
                    <TableHead className="py-6 px-8 h-auto">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('id')} className="h-auto p-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-transparent hover:text-primary">
                        Component ID
                        <ArrowUpDown className="ml-1.5 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="py-6 h-auto">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('binPercentage')} className="h-auto p-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-transparent hover:text-primary">
                        Capacity
                        <ArrowUpDown className="ml-1.5 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="py-6 h-auto font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status Flag</TableHead>
                    <TableHead className="py-6 h-auto">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('batteryLevel')} className="h-auto p-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-transparent hover:text-primary">
                        Energy
                        <ArrowUpDown className="ml-1.5 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="py-6 h-auto font-black text-[10px] uppercase tracking-widest text-muted-foreground">Security</TableHead>
                    <TableHead className="py-6 h-auto hidden lg:table-cell font-black text-[10px] uppercase tracking-widest text-muted-foreground">Zone</TableHead>
                    <TableHead className="py-6 h-auto hidden md:table-cell">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('timestamp')} className="h-auto p-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-transparent hover:text-primary">
                        Synchronization
                        <ArrowUpDown className="ml-1.5 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="py-6 h-auto font-black text-[10px] uppercase tracking-widest text-muted-foreground">Network</TableHead>
                    <TableHead className="py-6 pr-8 h-auto text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDevices.map((device) => (
                    <TableRow key={device.id} className="border-white/5 bg-transparent hover:bg-card/40 group transition-colors">
                      <TableCell className="px-8 py-5">
                        <div className="space-y-0.5">
                          <div className="font-bold text-base group-hover:text-primary transition-colors">{device.name || "Anonymous Bin"}</div>
                          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-60">{device.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TrashBinIcon percentage={device.binPercentage} size="sm" isFull={device.isFull} />
                          <span className={cn(
                            'text-lg font-black tracking-tighter',
                            device.isFull ? 'text-destructive' : device.binPercentage >= 75 ? 'text-warning' : 'text-foreground'
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
                          <span className="text-sm font-bold">{device.batteryLevel}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TamperBadge tamperDetected={device.tamperDetected} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs font-medium text-muted-foreground">
                        {device.location || `${device.latitude.toFixed(4)}, ${device.longitude.toFixed(4)}`}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-semibold text-muted-foreground uppercase opacity-70">
                        {format(new Date(device.timestamp), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <DeviceStatusBadge status={device.status} />
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Link to={`/devices/${device.id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/20 hover:text-primary transition-all">
                            <ExternalLink className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedDevices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="py-20 text-center text-muted-foreground font-medium">
                        Analytical sweep complete. No active devices matched.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Devices;
