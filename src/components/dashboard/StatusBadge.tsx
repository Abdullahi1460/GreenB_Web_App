import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  isFull: boolean;
  computed?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ isFull, computed = false, size = 'md' }: StatusBadgeProps) => {
  return (
    <Badge
      className={cn(
        'font-semibold',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        isFull
          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
          : 'bg-success text-success-foreground hover:bg-success/90'
      )}
    >
      {isFull ? 'FULL' : 'NOT FULL'}
      {computed && <span className="ml-1 opacity-70">(calc)</span>}
    </Badge>
  );
};

interface DeviceStatusBadgeProps {
  status: 'online' | 'offline' | 'maintenance';
}

export const DeviceStatusBadge = ({ status }: DeviceStatusBadgeProps) => {
  const styles = {
    online: 'bg-success/10 text-success border-success/20',
    offline: 'bg-muted text-muted-foreground border-muted',
    maintenance: 'bg-warning/10 text-warning border-warning/20',
  };

  const labels = {
    online: 'Online',
    offline: 'Offline',
    maintenance: 'Maintenance',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', styles[status])}>
      <span className={cn(
        'mr-1.5 h-2 w-2 rounded-full',
        status === 'online' && 'bg-success animate-pulse',
        status === 'offline' && 'bg-muted-foreground',
        status === 'maintenance' && 'bg-warning'
      )} />
      {labels[status]}
    </Badge>
  );
};

interface TamperBadgeProps {
  tamperDetected: boolean;
}

export const TamperBadge = ({ tamperDetected }: TamperBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        tamperDetected
          ? 'bg-destructive/10 text-destructive border-destructive/20'
          : 'bg-success/10 text-success border-success/20'
      )}
    >
      {tamperDetected ? 'Tampered' : 'Secure'}
    </Badge>
  );
};
