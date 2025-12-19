import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Database, Bell, Trash2, Plus, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
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
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
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
      description: 'Your settings have been saved successfully.',
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your GreenB system preferences</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Device Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Trash2 className="h-5 w-5 text-primary" />
                Device Management
              </CardTitle>
              <CardDescription>Add or remove devices from your network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter device ID (e.g., device009)"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                />
                <Button onClick={handleAddDevice}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Registered Devices</Label>
                <div className="max-h-[200px] space-y-2 overflow-y-auto">
                  {devices.map((device) => (
                    <div
                      key={device}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{device}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveDevice(device)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fill Threshold */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Computed Full-Bin Threshold
              </CardTitle>
              <CardDescription>
                Set the percentage at which a bin is considered "full" when the device doesn't report isFull
              </CardDescription>
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
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Bins with fill level ≥ {fullThreshold[0]}% will be marked as "full" if the device doesn't explicitly report isFull status.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notification Rules
              </CardTitle>
              <CardDescription>Configure which alerts trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'fullBin', label: 'Full Bin Alerts', description: 'Notify when a bin reaches full capacity' },
                { key: 'tamper', label: 'Tamper Alerts', description: 'Notify when tampering is detected' },
                { key: 'lowBattery', label: 'Low Battery Alerts', description: 'Notify when battery is below 20%' },
                { key: 'offline', label: 'Offline Alerts', description: 'Notify when a device goes offline' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
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

          {/* Firebase Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Database className="h-5 w-5 text-primary" />
                Firebase Configuration
              </CardTitle>
              <CardDescription>Connect to your Firebase Realtime Database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your Firebase API key"
                  value={firebaseConfig.apiKey}
                  onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authDomain">Auth Domain</Label>
                <Input
                  id="authDomain"
                  placeholder="your-project.firebaseapp.com"
                  value={firebaseConfig.authDomain}
                  onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="databaseURL">Database URL</Label>
                <Input
                  id="databaseURL"
                  placeholder="https://your-project.firebaseio.com"
                  value={firebaseConfig.databaseURL}
                  onChange={(e) => setFirebaseConfig({ ...firebaseConfig, databaseURL: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  placeholder="your-project-id"
                  value={firebaseConfig.projectId}
                  onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" />
            Save All Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
