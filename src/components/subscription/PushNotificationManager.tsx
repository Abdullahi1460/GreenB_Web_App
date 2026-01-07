import { useEffect, useState } from 'react';
import { messaging, db, auth } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { ref, set } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PushNotificationManager = () => {
    const { toast } = useToast();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }

        // Handle foreground messages
        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Message received in foreground: ', payload);
                toast({
                    title: payload.notification?.title || 'New Notification',
                    description: payload.notification?.body || 'You have a new message from GreenB.',
                });
            });
            return () => unsubscribe();
        }
    }, []);

    const requestPermission = async () => {
        if (!messaging || !auth.currentUser) return;

        setIsLoading(true);
        try {
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission === 'granted') {
                const token = await getToken(messaging, {
                    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY // Ensure this is in .env
                });

                if (token) {
                    console.log('FCM Token:', token);
                    // Save to RTDB
                    await set(ref(db, `users/${auth.currentUser.uid}/fcmToken`), token);

                    toast({
                        title: "Notifications Enabled",
                        description: "You will now receive real-time updates on your devices.",
                    });
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            toast({
                title: "Error",
                description: "Failed to enable notifications. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!('Notification' in window)) return null;

    return (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border/50 shadow-sm">
            <div className="p-2 rounded-full bg-primary/10">
                {permission === 'granted' ? (
                    <Bell className="w-5 h-5 text-primary" />
                ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
            </div>
            <div className="flex-1">
                <h3 className="text-sm font-semibold">Push Notifications</h3>
                <p className="text-xs text-muted-foreground">
                    {permission === 'granted'
                        ? 'You are receiving real-time alerts.'
                        : 'Stay updated with real-time bin status alerts.'}
                </p>
            </div>
            <Button
                variant={permission === 'granted' ? "outline" : "default"}
                size="sm"
                onClick={requestPermission}
                disabled={isLoading || permission === 'granted'}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : permission === 'granted' ? (
                    'Enabled'
                ) : (
                    'Enable Notifications'
                )}
            </Button>
        </div>
    );
};

export default PushNotificationManager;
