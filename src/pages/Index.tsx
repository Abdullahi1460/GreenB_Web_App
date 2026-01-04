import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Activity, Gauge, Truck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { FillTrendChart } from '@/components/dashboard/FillTrendChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { TrashBinIcon } from '@/components/dashboard/TrashBinIcon';
import { BatteryIcon } from '@/components/dashboard/BatteryIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDevices, fetchAlerts, subscribeAlerts } from '@/services/realtime';
import { push, ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { Alert } from '@/types/device';

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const snapshot = await get(ref(db, `users/${user.uid}/role`));
        if (snapshot.exists() && snapshot.val() === 'admin') {
          setIsAdmin(true);
          navigate('/admin');
          // Keep loading true while redirecting
        } else {
          setLoading(false);
        }
      } else {
        setUid('');
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEmergencyRequest = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setRequesting(true);
    try {
      await push(ref(db, 'requests'), {
        uid: user.uid,
        email: user.email,
        type: 'emergency_pickup',
        status: 'pending',
        timestamp: Date.now()
      });
      toast({ title: "Request Sent", description: "Emergency pickup team has been notified." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to send request.", variant: "destructive" });
    } finally {
      setRequesting(false);
    }
  };

  const queryUid = isAdmin ? undefined : (uid || undefined);

  const { data: liveDevices, isLoading, isError } = useQuery({
    queryKey: ['devices', queryUid],
    queryFn: () => fetchDevices(queryUid),
    staleTime: 30_000,
    enabled: isAdmin || !!uid,
  });

  const devices = (!isError && liveDevices) ? liveDevices : [];

  const totalBins = devices.length;
  const onlineBins = devices.filter(d => d.status === 'online').length;
  const fullBins = devices.filter(d => d.isFull).length;
  const tamperAlerts = devices.filter(d => d.tamperDetected).length;
  const averageFill = devices.length > 0
    ? Math.round(devices.reduce((acc, d) => acc + d.binPercentage, 0) / devices.length)
    : 0;

  // Alerts from Firebase (remove mock alerts)
  const { data: alertsData } = useQuery({ queryKey: ['alerts'], queryFn: fetchAlerts, staleTime: 30000 });
  const [alerts, setAlerts] = useState<Alert[]>(alertsData ?? []);
  useEffect(() => { setAlerts(alertsData ?? []); }, [alertsData]);
  useEffect(() => {
    const unsubscribe = subscribeAlerts((live) => setAlerts(live));
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Real-time overview of your GreenB smart bin network</p>
          </div>
          {!isAdmin && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-success/0 via-success/30 to-success/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 rounded-md" />
              <Button 
                variant="default" 
                className="relative bg-gradient-to-r from-success to-green-600 hover:from-success/90 hover:to-green-700 text-success-foreground backdrop-blur-sm border border-success/30 hover:border-success/50 shadow-lg hover:shadow-2xl hover:shadow-success/30 hover:scale-105 hover:-translate-y-1 transition-all duration-500" 
                onClick={handleEmergencyRequest} 
                disabled={requesting}
              >
                <Truck className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold">{requesting ? "Requesting..." : "Trash Pickup"}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Bins Online"
            value={onlineBins}
            icon={<Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />}
            trend={{ value: 2, isPositive: true }}
          />
          <StatCard
            title="Bins Full"
            value={fullBins}
            icon={<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="destructive"
          />
          <StatCard
            title="Tamper Alerts"
            value={tamperAlerts}
            icon={<Activity className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="warning"
          />
          <StatCard
            title="Average Fill Level"
            value={`${averageFill}%`}
            icon={<Gauge className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant={averageFill > 75 ? 'warning' : 'success'}
          />
        </div>

        {/* Charts and Alerts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FillTrendChart />
          </div>
          <div>
            <AlertsPanel alerts={alerts} />
          </div>
        </div>

        {/* Quick Device Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Device Quick View {isLoading ? '(loading...)' : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {devices.slice(0, 4).map((device) => (
                <Link
                  key={device.id}
                  to={`/devices/${device.id}`}
                  className="group"
                >
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-card-hover">
                    <TrashBinIcon
                      percentage={device.binPercentage}
                      size="sm"
                      isFull={device.isFull}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {device.id}
                      </p>
                      <StatusBadge isFull={device.isFull} size="sm" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BatteryIcon percentage={device.batteryLevel} size="sm" />
                        <span>{device.batteryLevel}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout >
  );
};

export default Index;
