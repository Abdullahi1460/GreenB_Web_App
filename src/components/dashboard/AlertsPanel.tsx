import { AlertCircle, AlertTriangle, Battery, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Alert } from '@/types/device';
import { format } from 'date-fns';

interface AlertsPanelProps {
  alerts: Alert[];
  maxItems?: number;
}

export const AlertsPanel = ({ alerts, maxItems = 5 }: AlertsPanelProps) => {
  const displayAlerts = alerts.slice(0, maxItems);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'full':
        return <AlertCircle className="h-4 w-4" />;
      case 'tamper':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low_battery':
        return <Battery className="h-4 w-4" />;
      case 'wake':
        return <Zap className="h-4 w-4" />;
    }
  };

  const getAlertStyle = (type: Alert['type']) => {
    switch (type) {
      case 'full':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'tamper':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low_battery':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'wake':
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getAlertLabel = (type: Alert['type']) => {
    switch (type) {
      case 'full':
        return 'Full Bin';
      case 'tamper':
        return 'Tamper';
      case 'low_battery':
        return 'Low Battery';
      case 'wake':
        return 'Wake Event';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Recent Alerts
          {alerts.filter(a => !a.acknowledged).length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {alerts.filter(a => !a.acknowledged).length} New
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-3 pb-4">
            {displayAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'rounded-lg border p-3 transition-all hover:shadow-sm',
                  !alert.acknowledged && 'ring-1 ring-destructive/20'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      getAlertStyle(alert.type)
                    )}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {alert.deviceId}
                        </span>
                        <Badge variant="outline" className={cn('text-xs', getAlertStyle(alert.type))}>
                          {getAlertLabel(alert.type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Fill: <strong className="text-foreground">{alert.binPercentage}%</strong></span>
                        <span>isFull: <strong className={alert.isFull ? 'text-destructive' : 'text-success'}>
                          {alert.isFull ? 'true' : 'false'}
                        </strong></span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(alert.timestamp), 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
