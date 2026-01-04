import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Devices from "./pages/Devices";
import DeviceDetails from "./pages/DeviceDetails";
import Alerts from "./pages/Alerts";
import MapView from "./pages/MapView";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import ProtectedRoute from "@/components/ProtectedRoute";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/devices/:deviceId" element={<DeviceDetails />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
