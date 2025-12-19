import React from "react";
import { Outlet, Link } from "react-router-dom";

import { NavLink } from "@/components/NavLink";
import Logo from "@/components/ui/Logo";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-card/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <Logo size="sm" rounded alt="GreenB" />
            <span className="font-semibold">Dashboard</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/dashboard" className="hover:text-primary" activeClassName="text-primary font-medium">Dashboard</NavLink>
            <NavLink to="/devices" className="hover:text-primary" activeClassName="text-primary font-medium">Devices</NavLink>
            <NavLink to="/map" className="hover:text-primary" activeClassName="text-primary font-medium">Map</NavLink>
            <NavLink to="/alerts" className="hover:text-primary" activeClassName="text-primary font-medium">Alerts</NavLink>
            <NavLink to="/settings" className="hover:text-primary" activeClassName="text-primary font-medium">Settings</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}