import { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { fetchAlerts, subscribeAlerts } from '@/services/realtime';
import { AlertCircle, AlertTriangle, Battery, Zap, Search, Filter, Check, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert } from '@/types/device';

const Alerts = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAcknowledged, setFilterAcknowledged] = useState<string>('all');

  const { data: alertsData } = useQuery({ queryKey: ['alerts'], queryFn: fetchAlerts, staleTime: 30000 });

  const [alerts, setAlerts] = useState<Alert[]>(alertsData ?? []);

  useEffect(() => {
    setAlerts(alertsData ?? []);
  }, [alertsData]);

  useEffect(() => {
    const unsubscribe = subscribeAlerts((live) => setAlerts(live));
    return () => unsubscribe();
  }, []);

  const filteredAlerts = useMemo(() => {
    let list = [...alerts];

    if (search) {
      list = list.filter(a => 
        a.deviceId.toLowerCase().includes(search.toLowerCase()) ||
        a.message.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      list = list.filter(a => a.type === filterType);
    }

    if (filterAcknowledged !== 'all') {
      list = list.filter(a => 
        filterAcknowledged === 'new' ? !a.acknowledged : a.acknowledged
      );
    }

    return list.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [alerts, search, filterType, filterAcknowledged]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'full':
        return <AlertCircle className="h-5 w-5" />;
      case 'tamper':
        return <AlertTriangle className="h-5 w-5" />;
      case 'low_battery':
        return <Battery className="h-5 w-5" />;
      case 'wake':
        return <Zap className="h-5 w-5" />;
    }
  };

  const getAlertStyle = (type: Alert['type']) => {
    switch (type) {
      case 'full':
        return {
          bg: 'bg-destructive/10',
          border: 'border-destructive/20',
          icon: 'text-destructive',
        };
      case 'tamper':
        return {
          bg: 'bg-warning/10',
          border: 'border-warning/20',
          icon: 'text-warning',
        };
      case 'low_battery':
        return {
          bg: 'bg-warning/10',
          border: 'border-warning/20',
          icon: 'text-warning',
        };
      case 'wake':
        return {
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          icon: 'text-primary',
        };
    }
  };

  const getAlertLabel = (type: Alert['type']) => {
    switch (type) {
      case 'full':
        return 'Full Bin';
      case 'tamper':
        return 'Tamper Alert';
      case 'low_battery':
        return 'Low Battery';
      case 'wake':
        return 'Wake Event';
    }
  };

  const alertStats = {
    total: alerts.length,
    new: alerts.filter(a => !a.acknowledged).length,
    full: alerts.filter(a => a.type === 'full').length,
    tamper: alerts.filter(a => a.type === 'tamper').length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground">Monitor and manage system alerts</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="font-display text-2xl font-bold">{alertStats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unacknowledged</p>
                <p className="font-display text-2xl font-bold text-destructive">{alertStats.new}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full Bin Alerts</p>
                <p className="font-display text-2xl font-bold">{alertStats.full}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamper Alerts</p>
                <p className="font-display text-2xl font-bold">{alertStats.tamper}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert List */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              All Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Alert Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full">Full Bin</SelectItem>
                  <SelectItem value="tamper">Tamper</SelectItem>
                  <SelectItem value="low_battery">Low Battery</SelectItem>
                  <SelectItem value="wake">Wake Event</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterAcknowledged} onValueChange={setFilterAcknowledged}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">Unacknowledged</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alert Cards */}
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const styles = getAlertStyle(alert.type);
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'rounded-xl border p-4 transition-all hover:shadow-sm',
                      styles.bg,
                      styles.border,
                      !alert.acknowledged && 'ring-2 ring-destructive/20'
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl',
                          styles.bg,
                          styles.icon
                        )}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{alert.deviceId}</span>
                            <Badge variant="outline" className={cn('text-xs', styles.border, styles.icon)}>
                              {getAlertLabel(alert.type)}
                            </Badge>
                            {!alert.acknowledged && (
                              <Badge variant="destructive" className="text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <span className="text-muted-foreground">Fill:</span>
                              <span className={cn(
                                'font-semibold',
                                alert.isFull ? 'text-destructive' : 'text-foreground'
                              )}>
                                {alert.binPercentage}%
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-muted-foreground">isFull:</span>
                              <span className={cn(
                                'font-semibold',
                                alert.isFull ? 'text-destructive' : 'text-success'
                              )}>
                                {alert.isFull ? 'true' : 'false'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm')}
                        </span>
                        {!alert.acknowledged && (
                          <Button size="sm" variant="outline" className="text-xs">
                            <Check className="mr-1 h-3 w-3" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Alerts;
