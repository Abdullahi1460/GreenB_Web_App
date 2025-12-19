import { cn } from '@/lib/utils';

interface FillGaugeProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  isFull?: boolean;
}

export const FillGauge = ({ percentage, size = 'md', showLabel = true, isFull = false }: FillGaugeProps) => {
  const sizeStyles = {
    sm: { outer: 'h-16 w-16', inner: 'h-12 w-12', text: 'text-sm' },
    md: { outer: 'h-32 w-32', inner: 'h-24 w-24', text: 'text-2xl' },
    lg: { outer: 'h-48 w-48', inner: 'h-36 w-36', text: 'text-4xl' },
  };

  const getColor = () => {
    if (isFull || percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-warning';
    return 'text-success';
  };

  const getGradient = () => {
    if (isFull || percentage >= 90) return 'from-destructive to-destructive/80';
    if (percentage >= 75) return 'from-warning to-warning/80';
    return 'from-success to-success/80';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative flex items-center justify-center', sizeStyles[size].outer)}>
      <svg className="absolute -rotate-90 transform" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-1000 ease-out', getColor())}
        />
      </svg>
      <div className={cn(
        'flex flex-col items-center justify-center rounded-full bg-gradient-to-br',
        getGradient(),
        sizeStyles[size].inner
      )}>
        {showLabel && (
          <>
            <span className={cn('font-display font-bold text-white', sizeStyles[size].text)}>
              {percentage}%
            </span>
            {size !== 'sm' && (
              <span className="text-xs text-white/80">Fill Level</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
