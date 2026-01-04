
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, DollarSign, ShieldAlert, Trash2 } from 'lucide-react';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Admin() {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [stats, setStats] = useState({ users: 0, activeSubs: 0, revenue: 0, bins: 0, requests: [] });
    const [chartData, setChartData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        let roleUnsubscribe: (() => void) | undefined;
        let dataUnsubscribes: (() => void)[] = [];

        const authUnsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const roleRef = ref(db, `users/${user.uid}/role`);
                roleUnsubscribe = onValue(roleRef, async (snapshot) => {
                    const userRole = snapshot.exists() ? snapshot.val() : 'user';
                    setRole(userRole);

                    if (userRole === 'admin') {
                        // Fetch Admin Stats
                        try {
                            // Users
                            const usersUnsub = onValue(ref(db, 'users'), (snap) => {
                                setStats(prev => ({ ...prev, users: snap.size }));
                            });
                            dataUnsubscribes.push(usersUnsub);

                            // Subscriptions
                            const subsUnsub = onValue(ref(db, 'subscriptions'), (snap) => {
                                let active = 0;
                                let inactive = 0;
                                snap.forEach((child) => {
                                    if (child.val().status === 'active') active++;
                                    else inactive++;
                                });
                                setStats(prev => ({ ...prev, activeSubs: active }));
                                setPieData([
                                    { name: 'Active', value: active },
                                    { name: 'Inactive', value: inactive }
                                ]);
                            });
                            dataUnsubscribes.push(subsUnsub);

                            // Revenue (Payments)
                            const paymentsUnsub = onValue(ref(db, 'payments'), (snap) => {
                                let totalKobo = 0;
                                const dailyRev: Record<string, number> = {};

                                snap.forEach((child) => {
                                    const val = child.val();
                                    const amt = val.amount || 0;
                                    if (typeof amt === 'number') totalKobo += amt;

                                    if (val.timestamp) {
                                        const date = new Date(val.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        dailyRev[date] = (dailyRev[date] || 0) + (amt / 100);
                                    }
                                });
                                setStats(prev => ({ ...prev, revenue: totalKobo / 100 }));

                                const chart = Object.keys(dailyRev).map(date => ({ date, amount: dailyRev[date] }));
                                setChartData(chart);
                            });
                            dataUnsubscribes.push(paymentsUnsub);

                            // Bins
                            const binsUnsub = onValue(ref(db, 'bins'), (snap) => {
                                // @ts-ignore
                                setStats(prev => ({ ...prev, bins: snap.size }));
                            });
                            dataUnsubscribes.push(binsUnsub);

                            // Emergency Requests
                            const requestsUnsub = onValue(ref(db, 'requests'), (snap) => {
                                const reqs: any[] = [];
                                snap.forEach((child) => {
                                    reqs.push({ id: child.key, ...child.val() });
                                });
                                // Sort newest first
                                reqs.sort((a, b) => b.timestamp - a.timestamp);
                                // @ts-ignore
                                setStats(prev => ({ ...prev, requests: reqs }));
                            });
                            dataUnsubscribes.push(requestsUnsub);

                        } catch (e) {
                            console.error("Error fetching stats", e);
                        }
                    }

                    setLoading(false);
                    setStatsLoading(false);
                });
            } else {
                navigate('/auth');
                setLoading(false);
            }
        });
        return () => {
            authUnsubscribe();
            if (roleUnsubscribe) roleUnsubscribe();
            dataUnsubscribes.forEach(unsub => unsub());
        }
    }, [navigate]);

    if (loading) return <div className="p-10">Loading...</div>;

    if (role !== 'admin') {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <ShieldAlert className="h-16 w-16 text-destructive" />
                    <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                    <p className="text-muted-foreground">You do not have administrative privileges.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <span className="text-sm text-muted-foreground">Overview of system health</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <div className="p-2 bg-blue-500/10 rounded-full">
                                <Users className="h-4 w-4 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statsLoading ? '...' : stats.users}</div>
                            <p className="text-xs text-muted-foreground">Registered users</p>
                        </CardContent>
                    </Card>
                    <Card className="border-green-500/20 bg-gradient-to-br from-card to-green-500/5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <div className="p-2 bg-green-500/10 rounded-full">
                                <Activity className="h-4 w-4 text-green-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statsLoading ? '...' : stats.activeSubs}</div>
                            <p className="text-xs text-muted-foreground">Active subscriptions</p>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-500/20 bg-gradient-to-br from-card to-orange-500/5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Bins</CardTitle>
                            <div className="p-2 bg-orange-500/10 rounded-full">
                                <Trash2 className="h-4 w-4 text-orange-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statsLoading ? '...' : stats.bins}</div>
                            <p className="text-xs text-muted-foreground">Deployed units</p>
                        </CardContent>
                    </Card>
                    <Card className="border-indigo-500/20 bg-gradient-to-br from-card to-indigo-500/5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                            <div className="p-2 bg-indigo-500/10 rounded-full">
                                <DollarSign className="h-4 w-4 text-indigo-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statsLoading ? '...' : `₦${stats.revenue.toLocaleString()}`}</div>
                            <p className="text-xs text-muted-foreground">Total earnings</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
                    <Card className="col-span-4 border-primary/10 bg-gradient-to-b from-card to-primary/5 animate-in zoom-in-95 fade-in duration-700 delay-75">
                        <CardHeader>
                            <CardTitle>Revenue Trend</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] w-full pl-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        className="text-xs text-muted-foreground"
                                        tickMargin={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        className="text-xs text-muted-foreground"
                                        tickFormatter={(value) => `₦${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                                        cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                        animationDuration={1500}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 border-purple-500/20 bg-gradient-to-br from-card to-purple-500/5 animate-in zoom-in-95 fade-in duration-700 delay-150">
                        <CardHeader>
                            <CardTitle>Subscription Status</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : '#94a3b8'} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 border-red-500/20 bg-gradient-to-br from-card to-red-500/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
                                Emergency Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[300px] overflow-y-auto">
                            {/* @ts-ignore */}
                            {stats.requests && stats.requests.length > 0 ? (
                                <div className="space-y-4">
                                    {/* @ts-ignore */}
                                    {stats.requests.map((req: any) => (
                                        <div key={req.id} className="flex items-center justify-between border-b border-red-500/10 pb-4 last:border-0 last:pb-0 hover:bg-red-500/5 p-2 rounded-lg transition-colors">
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">{req.email}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(req.timestamp).toLocaleString()}
                                                </p>
                                                <p className="text-xs font-semibold text-red-500 uppercase">{req.type}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === 'pending' ? 'bg-red-500/20 text-red-600' : 'bg-green-500/20 text-green-600'}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No active emergency requests.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>System Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">System is running normally.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
