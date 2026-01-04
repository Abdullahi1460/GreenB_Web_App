import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { subscribeDevices, subscribeEvents } from '@/services/realtime';
import { format, parseISO, startOfHour, addHours } from 'date-fns';
import { Device } from '@/types/device';

interface ChartPoint {
  time: string;
  average?: number;
  [key: string]: number | string | undefined;
}

export const FillTrendChart = () => {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    // Subscribe to devices to know which lines to draw
    const unsubscribeDevices = subscribeDevices((liveDevices) => {
      setDevices(liveDevices);
    });
    return () => unsubscribeDevices();
  }, []);

  useEffect(() => {
    // Subscribe to events to build the chart history
    const unsubscribeEvents = subscribeEvents((events) => {
      if (!events || events.length === 0) {
        // Fallback: if no events, use current devices state to show at least something
        const now = format(new Date(), 'HH:mm');
        const currentPoint: ChartPoint = { time: now };
        let totalFill = 0;
        let count = 0;
        
        devices.forEach(d => {
          currentPoint[d.id] = d.binPercentage;
          totalFill += d.binPercentage;
          count++;
        });
        
        if (count > 0) {
          currentPoint.average = Math.round(totalFill / count);
        }
        
        // Show a flat line history if we have no events
        setData([
            { ...currentPoint, time: format(addHours(new Date(), -4), 'HH:mm') },
            { ...currentPoint, time: format(addHours(new Date(), -2), 'HH:mm') },
            currentPoint
        ]);
        return;
      }

      // Process events into time buckets
      const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // We want to show the last 24 hours or so
      const buckets: Record<string, any> = {};
      const deviceLastValues: Record<string, number> = {};

      // Initialize with 0 or baseline
      devices.forEach(d => {
          deviceLastValues[d.id] = 0;
      });

      // Iterate through events and update state
      sortedEvents.forEach(e => {
          if (e.eventType === 'fill_change' || e.eventType === 'fill_level') {
              const val = e.newValue ?? e.binPercentage; // Handle different event shapes
              if (typeof val === 'number') {
                  deviceLastValues[e.deviceId] = val;
                  
                  const timeKey = format(parseISO(e.timestamp), 'HH:mm');
                  // Create or update bucket
                  if (!buckets[timeKey]) {
                      buckets[timeKey] = { time: timeKey, ...deviceLastValues };
                  } else {
                      buckets[timeKey] = { ...buckets[timeKey], ...deviceLastValues };
                  }
              }
          }
      });

      // Calculate averages
      const chartData = Object.values(buckets).map((point: any) => {
          let sum = 0;
          let count = 0;
          devices.forEach(d => {
              if (typeof point[d.id] === 'number') {
                  sum += point[d.id];
                  count++;
              }
          });
          return {
              ...point,
              average: count > 0 ? Math.round(sum / count) : 0
          };
      });

      // If we still have very little data (e.g. < 2 points), append current state
      if (chartData.length < 2 && devices.length > 0) {
           const now = format(new Date(), 'HH:mm');
           const currentPoint: ChartPoint = { time: now };
           let sum = 0;
           devices.forEach(d => {
               currentPoint[d.id] = d.binPercentage;
               sum += d.binPercentage;
           });
           currentPoint.average = devices.length > 0 ? Math.round(sum / devices.length) : 0;
           chartData.push(currentPoint);
      }

      setData(chartData);
    });

    return () => unsubscribeEvents();
  }, [devices]); // Re-run when devices list loads (for fallback logic)

  // Generate colors for lines
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "#8884d8",
    "#82ca9d"
  ];

  return (
    <Card className="h-full border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-sm sm:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Real-time Fill Level Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="time" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 100]} 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value}%`, '']}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            
            {/* Dynamic Lines for each device */}
            {devices.slice(0, 5).map((device, index) => (
              <Line
                key={device.id}
                type="monotone"
                dataKey={device.id}
                name={device.id}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}

            <Line
              type="monotone"
              dataKey="average"
              name="Average"
              stroke="hsl(var(--chart-3))"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
