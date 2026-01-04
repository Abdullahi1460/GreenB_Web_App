import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export const StatCard = ({ title, value, icon, trend, variant = 'default' }: StatCardProps) => {
  const variantStyles = {
    default: 'border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50',
    success: 'border-success/30 bg-gradient-to-br from-success/10 via-card to-success/5 backdrop-blur-sm hover:shadow-2xl hover:shadow-success/20 hover:border-success/50',
    warning: 'border-warning/30 bg-gradient-to-br from-warning/10 via-card to-warning/5 backdrop-blur-sm hover:shadow-2xl hover:shadow-warning/20 hover:border-warning/50',
    destructive: 'border-destructive/30 bg-gradient-to-br from-destructive/10 via-card to-destructive/5 backdrop-blur-sm hover:shadow-2xl hover:shadow-destructive/20 hover:border-destructive/50',
  };

  const iconStyles = {
    default: 'bg-primary/20 text-primary group-hover:bg-primary/30 group-hover:text-primary/90',
    success: 'bg-success/20 text-success group-hover:bg-success/30 group-hover:text-success/90',
    warning: 'bg-warning/20 text-warning group-hover:bg-warning/30 group-hover:text-warning/90',
    destructive: 'bg-destructive/20 text-destructive group-hover:bg-destructive/30 group-hover:text-destructive/90',
  };

  const shimmerStyles = {
    default: 'bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0',
    success: 'bg-gradient-to-r from-success/0 via-success/10 to-success/0',
    warning: 'bg-gradient-to-r from-warning/0 via-warning/10 to-warning/0',
    destructive: 'bg-gradient-to-r from-destructive/0 via-destructive/10 to-destructive/0',
  };

  const valueColorStyles = {
    default: 'group-hover:text-primary/90',
    success: 'group-hover:text-success/90',
    warning: 'group-hover:text-warning/90',
    destructive: 'group-hover:text-destructive/90',
  };

  return (
    <Card className={cn('overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-2 group relative', variantStyles[variant])}>
      <div className={cn('absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000', shimmerStyles[variant])} />
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn('font-display text-2xl sm:text-3xl font-bold text-foreground transition-colors', valueColorStyles[variant])}>{value}</p>
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last hour
              </p>
            )}
          </div>
          <div className={cn('flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110', iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
