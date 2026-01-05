
import { ReactNode, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '@/lib/firebase';

interface FeatureGuardProps {
    children: ReactNode;
    requiredPlan: 'professional' | 'enterprise'; // Minimum plan required
    fallback?: ReactNode;
    allowTeaser?: boolean;
}

const PLAN_LEVELS = {
    'starter': 1,
    'professional': 2,
    'enterprise': 3
};

export const FeatureGuard = ({ children, requiredPlan, allowTeaser }: FeatureGuardProps) => {
    const [currentPlan, setCurrentPlan] = useState<string>('starter'); // Default to starter
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Check for admin role
                    const roleSnapshot = await get(ref(db, `users/${user.uid}/role`));
                    if (roleSnapshot.exists() && roleSnapshot.val() === 'admin') {
                        setIsAdmin(true);
                    }

                    // In real app, we might cache this or use a context
                    const snapshot = await get(ref(db, `subscriptions/${user.uid}/plan`));
                    if (snapshot.exists()) {
                        setCurrentPlan(snapshot.val());
                    }
                } catch (error) {
                    console.error("Error fetching plan:", error);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return null; // Or a skeleton

    // Admin bypass: Admins get access to everything
    if (isAdmin) {
        return <>{children}</>;
    }

    const currentLevel = PLAN_LEVELS[currentPlan as keyof typeof PLAN_LEVELS] || 1;
    const requiredLevel = PLAN_LEVELS[requiredPlan];

    if (currentLevel < requiredLevel) {
        if (allowTeaser) {
            return (
                <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-background/5">
                    <div className="blur-xl grayscale opacity-30 pointer-events-none select-none">
                        {children}
                    </div>
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                        <div className="max-w-md w-full glass-card p-8 text-center animate-in fade-in scale-in duration-500 rounded-2xl border-primary/30 shadow-2xl shadow-primary/20">
                            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 group">
                                <Lock className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping-slow" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                                Premium Intelligence
                            </h3>
                            <p className="text-sm text-muted-foreground mb-8">
                                This advanced <span className="text-primary font-bold">Real-time Map Matrix</span> and predictive analytics are available on the <span className="capitalize font-bold text-emerald-500">{requiredPlan}</span> plan.
                            </p>
                            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.03] active:scale-[0.97]">
                                <Link to="/pricing">Upgrade to Pro Matrix</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative overflow-hidden rounded-lg border border-dashed p-8 text-center ring-1 ring-muted">
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />
                <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                    <div className="rounded-full bg-muted p-3">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Feature Locked</h3>
                    <p className="text-sm text-muted-foreground max-w-[300px]">
                        This feature is available on the <span className="capitalize font-medium text-primary">{requiredPlan}</span> plan and above.
                    </p>
                    <Button asChild>
                        <Link to="/pricing">Upgrade to Unlock</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
