
import { usePaystackPayment } from 'react-paystack';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, update, push } from 'firebase/database';
import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Layout } from "@/components/layout/Layout";

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        price: '₦5,000',
        priceYearly: '₦50,000',
        description: 'Perfect for small operations',
        features: [
            'Max 5 bins',
            'Real-time fill level',
            'Full / Not Full status',
            'Email alerts only',
            '7-day data history',
        ],
    },
    {
        id: 'professional',
        name: 'Professional',
        price: '₦25,000',
        priceYearly: '₦250,000',
        description: 'For growing teams',
        features: [
            'Max 50 bins',
            'Everything in Starter',
            'SMS + Email alerts',
            'GPS & map view',
            'Basic route optimization',
            '90-day data history',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '₦100,000',
        priceYearly: '₦1,000,000',
        description: 'For large-scale deployments',
        features: [
            'Unlimited bins',
            'Everything in Professional',
            'Advanced analytics',
            'CSV / PDF export',
            'API access',
            'Admin override',
        ],
    },
];

const PlanCard = ({ plan, billingCycle }: { plan: any, billingCycle: 'monthly' | 'yearly' }) => {
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email) {
                setEmail(user.email);
                setUserId(user.uid);
            }
        });
        return () => unsubscribe();
    }, []);

    const priceDisplay = billingCycle === 'monthly' ? plan.price : plan.priceYearly;
    const numericAmount = parseInt(priceDisplay.replace(/[₦,]/g, '')) * 100;

    const config = {
        reference: (new Date()).getTime().toString(),
        email: email,
        amount: numericAmount,
        publicKey: 'pk_test_8b54d2c34b30cc7745dc3351455374f02efd21e9',
        metadata: {
            planId: plan.id,
            billingCycle: billingCycle,
            custom_fields: []
        }
    };

    // @ts-ignore - react-paystack types
    const initializePayment = usePaystackPayment(config);

    const onSuccess = async (reference: any) => {
        console.log("Paystack Success:", reference);
        toast({ title: "Payment Verified", description: "Processing subscription..." });

        try {
            if (!userId) throw new Error("User ID missing. Try refreshing.");

            const now = Math.floor(Date.now() / 1000);
            let limit = 5;
            if (plan.id === 'professional') limit = 50;
            if (plan.id === 'enterprise') limit = 1000;

            const durationSeconds = billingCycle === 'monthly' ? 30 * 24 * 60 * 60 : 365 * 24 * 60 * 60;

            // 1. Grant Subscription
            await update(ref(db, `subscriptions/${userId}`), {
                plan: plan.id,
                status: 'active',
                billingCycle: billingCycle,
                binLimit: limit,
                currentPeriodStart: now,
                currentPeriodEnd: now + durationSeconds,
                updatedAt: now
            });

            // 2. Log Payment
            await push(ref(db, 'payments'), {
                uid: userId,
                email: email,
                amount: config.amount,
                reference: reference.reference,
                status: 'success',
                planId: plan.id,
                billingCycle: billingCycle,
                timestamp: now
            });

            toast({
                title: "Subscription Activated",
                description: `You are now on the ${plan.name} (${billingCycle}) plan!`,
            });

        } catch (error: any) {
            console.error("Activation Error:", error);
            toast({
                title: "Activation Error",
                description: error.message || "Failed to update profile.",
                variant: "destructive"
            });
        }
    };

    const onClose = () => {
        toast({ description: "Payment cancelled." });
    }

    const handleBuy = () => {
        if (!email || !userId) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to subscribe.",
                variant: "destructive"
            });
            return;
        }
        // @ts-ignore
        initializePayment({ onSuccess, onClose });
    }

    const isPopular = plan.id === 'professional';

    // Define color themes based on plan
    const colorTheme = plan.id === 'starter' 
        ? { border: 'border-blue-500/30', gradient: 'from-blue-500/10 via-card to-blue-600/5', shadow: 'hover:shadow-blue-500/20', hoverBorder: 'hover:border-blue-400/50', shimmer: 'from-blue-500/0 via-blue-500/10 to-blue-500/0' }
        : plan.id === 'professional'
        ? { border: 'border-green-500/30', gradient: 'from-green-500/10 via-card to-green-600/5', shadow: 'hover:shadow-green-500/20', hoverBorder: 'hover:border-green-400/50', shimmer: 'from-green-500/0 via-green-500/10 to-green-500/0' }
        : { border: 'border-orange-500/30', gradient: 'from-orange-500/10 via-card to-orange-600/5', shadow: 'hover:shadow-orange-500/20', hoverBorder: 'hover:border-orange-400/50', shimmer: 'from-orange-500/0 via-orange-500/10 to-orange-500/0' };

    return (
        <Card className={`flex flex-col relative overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-2 group backdrop-blur-sm ${colorTheme.border} bg-gradient-to-br ${colorTheme.gradient} hover:shadow-2xl ${colorTheme.shadow} ${colorTheme.hoverBorder} ${isPopular ? 'md:scale-105 z-10' : ''}`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${colorTheme.shimmer} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`} />
            {isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-2 sm:px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Popular
                </div>
            )}
            <CardHeader className="pb-4 sm:pb-8">
                <CardTitle className="text-lg sm:text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-xs sm:text-base mt-1 sm:mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="mb-4 sm:mb-8 flex items-baseline">
                    <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">{priceDisplay}</span>
                    <span className="text-muted-foreground font-medium text-xs sm:text-base ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <ul className="space-y-2 sm:space-y-4">
                    {plan.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start">
                            <div className={`mt-0.5 mr-2 sm:mr-3 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full ${isPopular ? 'bg-primary/20 text-primary' : 'bg-green-500/10 text-green-600'}`}>
                                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </div>
                            <span className="text-xs sm:text-sm text-foreground/80">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="pt-4 sm:pt-8">
                <Button
                    onClick={handleBuy}
                    className={`w-full h-9 sm:h-11 text-sm sm:text-base font-semibold shadow-md transition-all ${isPopular ? 'bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-700 hover:shadow-lg' : ''}`}
                    variant={isPopular ? 'default' : 'outline'}
                >
                    {isPopular ? `Get Started` : `Choose ${plan.name}`}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <Layout>
            <div className="container mx-auto py-12 animate-in fade-in duration-500">
                <div className="text-center mb-10 space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
                    <p className="text-muted-foreground text-lg">Choose the plan that's right for your waste management needs.</p>

                    <div className="flex justify-center items-center mt-6">
                        <div className="bg-muted p-1 rounded-full flex items-center shadow-inner">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Yearly <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Save 20%</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} billingCycle={billingCycle} />
                    ))}
                </div>
            </div>
        </Layout>
    );
}
