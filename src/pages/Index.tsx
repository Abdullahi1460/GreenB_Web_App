import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Activity, Gauge } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { FillTrendChart } from '@/components/dashboard/FillTrendChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { TrashBinIcon } from '@/components/dashboard/TrashBinIcon';
import { BatteryIcon } from '@/components/dashboard/BatteryIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDevices, fetchAlerts, subscribeAlerts } from '@/services/realtime';
import type { Alert } from '@/types/device';

const Index = () => {
  const { data: liveDevices, isLoading, isError } = useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: 30_000,
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of your GreenB smart bin network</p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Bins Online"
            value={onlineBins}
            icon={<Trash2 className="h-6 w-6" />}
            trend={{ value: 2, isPositive: true }}
          />
          <StatCard
            title="Bins Full"
            value={fullBins}
            icon={<AlertTriangle className="h-6 w-6" />}
            variant="destructive"
          />
          <StatCard
            title="Tamper Alerts"
            value={tamperAlerts}
            icon={<Activity className="h-6 w-6" />}
            variant="warning"
          />
          <StatCard
            title="Average Fill Level"
            value={`${averageFill}%`}
            icon={<Gauge className="h-6 w-6" />}
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
    </Layout>
  );
};

export default Index;
