import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, HardDrive, Bell, Map, Settings, User, LogOut, Sun, Moon, CreditCard, DollarSign, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/devices', label: 'Devices', icon: HardDrive },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/billing', label: 'Subscription', icon: CreditCard },
];

export const Navbar = () => {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let roleUnsubscribe: (() => void) | undefined;
    let requestsUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const roleRef = ref(db, `users/${user.uid}/role`);
        roleUnsubscribe = onValue(roleRef, (snapshot) => {
          const role = snapshot.exists() ? snapshot.val() : 'user';
          setUserRole(role);

          // If Admin, listen for requests
          if (role === 'admin') {
            if (requestsUnsubscribe) requestsUnsubscribe();
            requestsUnsubscribe = onValue(ref(db, 'requests'), (reqSnap) => {
              let count = 0;
              reqSnap.forEach((child) => {
                if (child.val().status === 'pending') count++;
              });

              setUnreadCount(prev => {
                if (count > prev) {
                  // Simulate mobile notification trigger
                  console.log(`[MOBILE NOTIFICATION] New emergency request! Total pending: ${count}`);
                }
                return count;
              });
            });
          } else {
            setUnreadCount(0);
            if (requestsUnsubscribe) requestsUnsubscribe();
          }
        });
      } else {
        setUserRole(null);
        setUnreadCount(0);
        if (roleUnsubscribe) roleUnsubscribe();
        if (requestsUnsubscribe) requestsUnsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      if (roleUnsubscribe) roleUnsubscribe();
      if (requestsUnsubscribe) requestsUnsubscribe();
    };
  }, []);

  const filteredNavLinks = navLinks.filter(link => {
    if (userRole === 'admin' && (link.to === '/billing' || link.to === '/pricing')) {
      return false;
    }
    return true;
  }).map(link => {
    // Redirect Dashboard to Admin view for admins
    if (userRole === 'admin' && link.to === '/dashboard') {
      return { ...link, to: '/admin' };
    }
    return link;
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to={userRole === 'admin' ? "/admin" : "/dashboard"} className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Logo size="sm" rounded alt="GreenB" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {filteredNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {userRole && (
            <Badge variant="secondary" className="mr-2 capitalize hidden sm:inline-flex">
              {userRole}
            </Badge>
          )}



          {userRole && userRole !== 'admin' && (
            <Link to="/pricing">
              <Button size="sm" variant="default" className="hidden sm:flex gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 text-white shadow-sm h-7 rounded-full px-3 transition-all hover:scale-105">
                <Zap className="h-3 w-3 fill-current" />
                <span className="text-xs font-bold">Upgrade</span>
              </Button>
            </Link>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-background">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Notifications</h4>
                {unreadCount > 0 ? (
                  <div className="text-sm">
                    <p className="text-destructive font-medium">{unreadCount} Pending Request{unreadCount !== 1 ? 's' : ''}</p>
                    <p className="text-muted-foreground text-xs mt-1">Emergency pickup requested.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No new notifications.</p>
                )}
                {userRole === 'admin' && unreadCount > 0 && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/admin">View Requests</Link>
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className={cn('h-4 w-4', resolvedTheme === 'dark' && 'hidden')} />
            <Moon className={cn('h-4 w-4', resolvedTheme !== 'dark' && 'hidden')} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {userRole && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground sm:hidden">
                  Role: <span className="capitalize font-medium text-foreground">{userRole}</span>
                </div>
              )}
              <Link to="/profile">
                <DropdownMenuItem className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </Link>
              {userRole !== 'admin' && (
                <Link to="/pricing">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </DropdownMenuItem>
                </Link>
              )}
              <Link to="/settings">
                <DropdownMenuItem className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </Link>
              {userRole !== 'admin' && (
                <Link to="/billing">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <span className="font-bold">$</span>
                    Billing & Plans
                  </DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuSeparator />
              <Link to="/">
                <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="flex items-center justify-around border-t border-border py-2 md:hidden">
        {filteredNavLinks.slice(0, 5).map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-xs transition-all',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
