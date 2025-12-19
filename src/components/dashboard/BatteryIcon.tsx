import React, { useEffect, useRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';

interface BatteryIconProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
}

export const BatteryIcon = ({ percentage, size = 'md' }: BatteryIconProps) => {
  const sizes = {
    sm: { w: 80, h: 40, pad: 6 },
    md: { w: 140, h: 60, pad: 8 },
    lg: { w: 200, h: 80, pad: 10 },
  } as const;
  const { w, h, pad } = sizes[size];

  const target = Math.max(0, Math.min(100, percentage));
  const [animatedLevel, setAnimatedLevel] = useState<number>(0);
  const prevRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = target;
    if (start === end) return;
    const duration = 600;
    const startTime = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const value = start + (end - start) * ease(t);
      setAnimatedLevel(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        prevRef.current = end;
        rafRef.current = null;
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  const colorHex = animatedLevel > 50 ? '#22c55e' : animatedLevel > 20 ? '#f59e0b' : '#ef4444';
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clipId = `battery-clip-${uid}`;
  const stripesId = `battery-stripes-${uid}`;

  const innerWidth = w - pad * 3;
  const innerHeight = h - pad * 2;
  const capWidth = Math.max(6, Math.round(w * 0.06));
  const fillWidth = Math.max(0, Math.min(innerWidth, (animatedLevel / 100) * innerWidth));

  return (
    <div className={cn('relative flex items-center justify-center')} style={{ width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="drop-shadow-sm">
        <defs>
          <clipPath id={clipId}>
            <rect x={pad} y={pad} width={innerWidth} height={innerHeight} rx={Math.min(8, pad)} />
          </clipPath>
          <pattern id={stripesId} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="translate(0,0)">
            <rect width="12" height="12" fill="transparent" />
            <path d="M0 0 L6 0 L0 6Z" fill="white" opacity="0.15" />
            <path d="M12 12 L6 12 L12 6Z" fill="white" opacity="0.15" />
          </pattern>
        </defs>

        <rect x={pad} y={pad} width={innerWidth} height={innerHeight} rx={Math.min(8, pad)} fill="#ffffff" stroke={colorHex} strokeWidth={2.5} />
        <rect x={w - pad - capWidth} y={h / 2 - innerHeight / 4} width={capWidth} height={innerHeight / 2} rx={Math.min(6, pad)} fill={colorHex} opacity={0.3} />

        <g clipPath={`url(#${clipId})`}>
          <rect x={pad} y={pad} width={fillWidth} height={innerHeight} fill={colorHex} opacity={0.25} />
          <g transform={`translate(${pad}, ${pad})`}>
            <rect x={0} y={0} width={fillWidth} height={innerHeight} fill={`url(#${stripesId})`}>
              <animate attributeName="x" from={0} to={12} dur="1.5s" repeatCount="indefinite" />
            </rect>
          </g>
        </g>
      </svg>
    </div>
  );
};

