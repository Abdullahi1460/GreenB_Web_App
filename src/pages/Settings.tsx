import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
    Settings as SettingsIcon,
    Database,
    Bell,
    Trash2,
    Plus,
    X,
    Save,
    User,
    CreditCard,
    Shield,
    AlertCircle,
    Mail,
    Key,
    LogOut,
    Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import PushNotificationManager from '@/components/subscription/PushNotificationManager';

type SettingsSection = 'general' | 'notification' | 'profile' | 'plan' | 'security' | 'delete-device' | 'account';

const Settings = () => {
    const { toast } = useToast();
    const [activeSection, setActiveSection] = useState<SettingsSection>('general');
    const [fullThreshold, setFullThreshold] = useState([90]);
    const [newDeviceId, setNewDeviceId] = useState('');
    const [devices, setDevices] = useState(['device001', 'device002', 'device003']);

    const [notifications, setNotifications] = useState({
        fullBin: true,
        tamper: true,
        lowBattery: true,
        offline: false,
    });

    const [firebaseConfig, setFirebaseConfig] = useState({
        apiKey: '••••••••••••••••',
        authDomain: 'greenb-prod.firebaseapp.com',
        databaseURL: 'https://greenb-prod.firebaseio.com',
        projectId: 'greenb-prod',
    });

    const [profile, setProfile] = useState({
        name: 'John Doe',
        email: 'john.doe@example.com',
    });

    const handleAddDevice = () => {
        if (newDeviceId && !devices.includes(newDeviceId)) {
            setDevices([...devices, newDeviceId]);
            setNewDeviceId('');
            toast({
                title: 'Device Added',
                description: `${newDeviceId} has been added to the system.`,
            });
        }
    };

    const handleRemoveDevice = (deviceId: string) => {
        setDevices(devices.filter(d => d !== deviceId));
        toast({
            title: 'Device Removed',
            description: `${deviceId} has been removed from the system.`,
        });
    };

    const handleSaveSettings = () => {
        toast({
            title: 'Settings Saved',
            description: 'Your preferences have been updated.',
        });
    };

    const sidebarItems: { id: SettingsSection; label: string; icon: any }[] = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'notification', label: 'Notification', icon: Bell },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'plan', label: 'Plan', icon: CreditCard },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'delete-device', label: 'Delete Device', icon: Trash2 },
        { id: 'account', label: 'Account', icon: AlertCircle },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'general':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <SettingsIcon className="h-5 w-5 text-primary" />
                                    Bin Threshold
                                </CardTitle>
                                <CardDescription>Configure when a bin is flagged as full</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Threshold Percentage</Label>
                                        <span className="font-display text-2xl font-bold text-primary">{fullThreshold[0]}%</span>
                                    </div>
                                    <Slider
                                        value={fullThreshold}
                                        onValueChange={setFullThreshold}
                                        min={50}
                                        max={100}
                                        step={5}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Bins with fill level ≥ {fullThreshold[0]}% will be marked as "full".
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-primary" />
                                    System Source
                                </CardTitle>
                                <CardDescription>Current Firebase database configuration</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Project ID</Label>
                                        <Input value={firebaseConfig.projectId} disabled className="bg-muted/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Auth Domain</Label>
                                        <Input value={firebaseConfig.authDomain} disabled className="bg-muted/50" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'notification':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-primary" />
                                    Notification Preferences
                                </CardTitle>
                                <CardDescription>Choose what alerts you want to receive</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { key: 'fullBin', label: 'Full Bin Alerts', description: 'Immediate notifications for full bins' },
                                    { key: 'tamper', label: 'Tamper Alerts', description: 'Alerts for potential device interference' },
                                    { key: 'lowBattery', label: 'Low Battery', description: 'When battery levels drop below 15%' },
                                    { key: 'offline', label: 'Connection Status', description: 'Alerts when devices lose connectivity' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between py-2">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium">{item.label}</Label>
                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                        </div>
                                        <Switch
                                            checked={notifications[item.key as keyof typeof notifications]}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, [item.key]: checked })
                                            }
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <PushNotificationManager />
                    </div>
                );

            case 'profile':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <User className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">User Profile</CardTitle>
                                        <CardDescription>Manage your public identity</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="email" value={profile.email} disabled className="pl-9 bg-muted/50" />
                                        </div>
                                    </div>
                                </div>
                                <Button className="mt-2">Update Profile</Button>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'plan':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4">
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">Premium</Badge>
                            </div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Subscription Plan
                                </CardTitle>
                                <CardDescription>You are currently on the Pro Annual plan</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Monthly Usage</span>
                                        <span className="text-sm text-primary font-bold">12 / 50 Devices</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-primary/10">
                                        <div className="h-full w-[24%] rounded-full bg-primary" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="w-full">Manage Billing</Button>
                                    <Button className="w-full">View Invoices</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Security Settings
                                </CardTitle>
                                <CardDescription>Protect your account and data</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-medium">Two-Factor Authentication</Label>
                                            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                                        </div>
                                        <Switch />
                                    </div>
                                    <Separator />
                                    <div className="space-y-4">
                                        <Label className="text-base font-medium">Change Password</Label>
                                        <div className="grid gap-4">
                                            <Input type="password" placeholder="Current Password" />
                                            <Input type="password" placeholder="New Password" />
                                            <Button className="w-fit">Update Password</Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'delete-device':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-destructive/20 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <Trash2 className="h-5 w-5" />
                                    Remove Devices
                                </CardTitle>
                                <CardDescription>Permanently remove devices from your workspace</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search by Device ID..."
                                        className="max-w-xs"
                                    />
                                    <Button variant="outline" disabled>Search</Button>
                                </div>
                                <div className="grid gap-3">
                                    {devices.map((device) => (
                                        <div
                                            key={device}
                                            className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                <span className="font-medium">{device}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveDevice(device)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'account':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Download className="h-5 w-5 text-primary" />
                                    Data Portability
                                </CardTitle>
                                <CardDescription>Export your fleet data and history</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download JSON Report
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/50 bg-destructive/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                    Danger Zone
                                </CardTitle>
                                <CardDescription>Actions that cannot be undone</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                                    <div className="space-y-1">
                                        <p className="font-bold">Delete Account</p>
                                        <p className="text-sm text-muted-foreground">Wipe all your data, devices, and history.</p>
                                    </div>
                                    <Button variant="destructive">Delete Everything</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
        }
    };

    return (
        <Layout>
            <div className="container max-w-6xl py-8">
                <div className="flex flex-col gap-8 md:flex-row">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 space-y-2">
                        <h1 className="text-2xl font-bold mb-6 px-4">Workspace Settings</h1>
                        <nav className="flex flex-col gap-1">
                            {sidebarItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10"
                                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                        <div className="pt-8 px-4">
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-xl font-bold capitalize">{activeSection.replace('-', ' ')}</h2>
                                <p className="text-sm text-muted-foreground">Manage your {activeSection.replace('-', ' ')} settings</p>
                            </div>
                            <Button onClick={handleSaveSettings} size="sm" className="hidden md:flex">
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>

                        <Separator className="bg-primary/10" />

                        <div className="min-h-[500px]">
                            {renderContent()}
                        </div>

                        <div className="md:hidden pt-4">
                            <Button onClick={handleSaveSettings} className="w-full">
                                <Save className="mr-2 h-4 w-4" />
                                Save All Changes
                            </Button>
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
