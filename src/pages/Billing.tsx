
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Calendar, AlertTriangle, Zap } from 'lucide-react';
import { Layout } from "@/components/layout/Layout";

// Mock types matching backend
interface Subscription {
    plan: string;
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    binLimit: number;
    currentPeriodEnd: number;
}

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState({ binCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Fetch Subscription
                onValue(ref(db, `subscriptions/${user.uid}`), (snapshot) => {
                    if (snapshot.exists()) {
                        setSubscription(snapshot.val());
                    } else {
                        setSubscription({
                            plan: 'free',
                            status: 'active',
                            binLimit: 1, // Free tier limit
                            currentPeriodEnd: 0
                        });
                    }
                });

                // Fetch Usage (Bin Count)
                // We'll read from strict usage node if available, else count bins?
                // For now, let's assume usage is tracked or just list devices to count.
                // Let's count devices directly for accuracy in this MVP.
                onValue(ref(db, 'bins'), (snapshot) => {
                    let count = 0;
                    snapshot.forEach(child => {
                        if (child.val().ownerUid === user.uid) count++;
                    });
                    setUsage({ binCount: count });
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const usagePercent = (usage.binCount / (subscription?.binLimit || 1)) * 100;
    const daysLeft = subscription && subscription.currentPeriodEnd ? Math.ceil((subscription.currentPeriodEnd - Math.floor(Date.now() / 1000)) / 86400) : 0;

    if (loading) return <div className="p-10">Loading...</div>;

    return (
        <Layout>
            <div className="container max-w-5xl mx-auto py-12 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                        <p className="text-muted-foreground mt-1">Manage your plan, usage, and billing history.</p>
                    </div>
                    {!subscription || subscription.plan === 'free' ? (
                        <Button asChild size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md">
                            <Link to="/pricing">
                                <Zap className="mr-2 h-4 w-4 fill-current" /> Upgrade to Pro
                            </Link>
                        </Button>
                    ) : (
                        <Button variant="outline" asChild>
                            <Link to="/pricing">Change Plan</Link>
                        </Button>
                    )}
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {/* Current Plan Card - Spans 2 cols */}
                    <Card className="md:col-span-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl">Current Plan</CardTitle>
                                    <CardDescription>Your subscription details</CardDescription>
                                </div>
                                <Badge className="text-sm px-3 py-1 capitalize border-primary/20" variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                                    {subscription?.plan || 'Free'} Plan
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Status</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`h-2.5 w-2.5 rounded-full ${subscription?.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-400'}`} />
                                        <span className="font-medium capitalize">{subscription?.status || 'Inactive'}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Renewal</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {subscription?.status === 'active' ? `${daysLeft} days remaining` : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Usage Section */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="font-medium text-sm">Bin Capacity</p>
                                        <p className="text-xs text-muted-foreground">Active bins vs plan limit</p>
                                    </div>
                                    <span className="font-mono text-sm font-medium">{usage.binCount} <span className="text-muted-foreground">/ {subscription?.binLimit}</span></span>
                                </div>
                                <div className="relative pt-1">
                                    <Progress value={usagePercent} className="h-3 rounded-full bg-secondary" />
                                </div>
                                {usagePercent >= 80 && (
                                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        <span>Approaching limit. Consider upgrading for more capacity.</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Billing History / Support Column */}
                    <div className="space-y-6">
                        <Card className="h-full border-muted/20">
                            <CardHeader>
                                <CardTitle className="text-lg">Billing History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="border-l-2 border-muted pl-4 py-1">
                                        <p className="text-sm font-medium">No recent invoices</p>
                                        <p className="text-xs text-muted-foreground">Transactions will appear here.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
