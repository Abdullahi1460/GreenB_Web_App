import React, { useEffect, useRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';

interface TrashBinIconProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  isFull?: boolean;
}

// Animated trash bin with vertical wave motion; wave baseline is aligned to percentage
export const TrashBinIcon = ({ percentage, size = 'md', isFull = false }: TrashBinIconProps) => {
  const sizes = {
    sm: { w: 48, h: 48, amp: 3 },
    md: { w: 96, h: 96, amp: 4 },
    lg: { w: 144, h: 144, amp: 5 },
  };
  const { w, h, amp } = sizes[size];

  const levelTarget = Math.max(0, Math.min(100, percentage));
  // Start at 0 on mount so the level animates up to the target
  const [animatedLevel, setAnimatedLevel] = useState<number>(0);
  const prevLevelRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Smoothly animate from previous level to new target level (including first mount from 0)
  useEffect(() => {
    const start = prevLevelRef.current;
    const end = levelTarget;
    if (start === end) return;

    const duration = 600; // ms
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(t);
      const value = start + (end - start) * eased;
      setAnimatedLevel(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        prevLevelRef.current = end;
        rafRef.current = null;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [levelTarget]);

  const colorClass = isFull || animatedLevel >= 90 ? 'text-destructive' : animatedLevel >= 75 ? 'text-warning' : 'text-success';
  const waveColor = isFull || animatedLevel >= 90 ? '#ef4444' : animatedLevel >= 75 ? '#f59e0b' : '#22c55e';

  // Bin body (trapezoid)
  const bodyTop = h * 0.30;
  const bodyBottom = h * 0.90;
  const leftTop = w * 0.22;
  const rightTop = w * 0.78;
  const leftBottom = w * 0.28;
  const rightBottom = w * 0.72;
  const bodyPath = `M ${leftTop} ${bodyTop} L ${rightTop} ${bodyTop} L ${rightBottom} ${bodyBottom} L ${leftBottom} ${bodyBottom} Z`;

  // Fill level position (animated to target percentage)
  const fillHeight = (bodyBottom - bodyTop) * (animatedLevel / 100);
  const clampedY = Math.max(bodyTop, Math.min(bodyBottom - fillHeight, bodyBottom));
  const levelHeight = bodyBottom - clampedY;
  const edgeThickness = Math.max(1, Math.round(h * 0.015));

  // Helper to build a wave path that starts at baseline (y=0) and fills downwards
  const buildWavePath = (width: number, baselineToBottom: number, amplitude: number) => {
    const A = amplitude;
    // Use three bezier segments across width for a smooth wave at baseline
    return [
      `M 0 0`,
      `C ${width * 0.25} ${-A}, ${width * 0.25} ${A}, ${width * 0.5} 0`,
      `C ${width * 0.75} ${-A}, ${width * 0.75} ${A}, ${width} 0`,
      `L ${width} ${baselineToBottom}`,
      `L 0 ${baselineToBottom}`,
      `Z`,
    ].join(' ');
  };

  // Ensure unique IDs per instance to avoid clipPath/filter collisions across lists
  const uid = useId();
  const safeUid = String(uid).replace(/[^a-zA-Z0-9_-]/g, '');
  const glowId = `glow-${safeUid}`;
  const binClipId = `binClip-${safeUid}`;
  const levelClipId = `levelClip-${safeUid}`;

  return (
    <div className={cn('relative flex items-center justify-center', colorClass)} style={{ width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="drop-shadow-sm">
        <defs>
          {/* Glow filter for brighter stroke */}
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx={0} dy={0} stdDeviation={2} floodColor={waveColor} floodOpacity={0.5} />
          </filter>
          {/* Body clip */}
          <clipPath id={binClipId}>
            <path d={bodyPath} />
          </clipPath>
          {/* Level clip to ensure top edge matches percentage exactly */}
          <clipPath id={levelClipId}>
            <rect x={0} y={clampedY} width={w} height={bodyBottom - clampedY} />
          </clipPath>
        </defs>

        {/* Lid - brighter and tinted */}
        <rect x={w * 0.18} y={h * 0.16} width={w * 0.64} height={h * 0.06} rx={h * 0.02} fill={waveColor} opacity={0.30} />
        <rect x={w * 0.30} y={h * 0.10} width={w * 0.40} height={h * 0.05} rx={h * 0.02} fill={waveColor} opacity={0.30} />

        {/* Body outline */}
        <path d={bodyPath} fill="#ffffff" stroke={waveColor} strokeWidth={3.5} strokeOpacity={0.95} filter={`url(#${glowId})`} />

        <g clipPath={`url(#${binClipId})`}>
          <rect x={0} y={clampedY} width={w} height={levelHeight} fill={waveColor} opacity={0.30} />
          <g clipPath={`url(#${levelClipId})`} transform={`translate(0, ${clampedY})`}>
            <path d={buildWavePath(w, levelHeight, amp)} fill={waveColor} opacity={0.20}>
              <animateTransform attributeName="transform" type="translate" from={`0 ${amp}`} to={`0 -${amp}`} dur="2s" repeatCount="indefinite" />
            </path>
            <path d={buildWavePath(w, levelHeight, amp + 1)} fill={waveColor} opacity={0.12}>
              <animateTransform attributeName="transform" type="translate" from={`0 ${amp + 2}`} to={`0 -${amp + 2}`} dur="3s" repeatCount="indefinite" />
            </path>
          </g>
          <rect x={0} y={clampedY} width={w} height={edgeThickness} fill={waveColor} opacity={0.6} />
        </g>
      </svg>
    </div>
  );
};
