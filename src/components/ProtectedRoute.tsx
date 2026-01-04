import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { auth, db } from '@/lib/firebase';

const ProtectedRoute = () => {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let roleUnsub: (() => void) | undefined;

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Fetch role
        const roleRef = ref(db, `users/${u.uid}/role`);
        roleUnsub = onValue(roleRef, (snapshot) => {
          const r = snapshot.exists() ? snapshot.val() : 'user';
          setRole(r);
          setReady(true);
        });
      } else {
        setRole(null);
        setReady(true);
      }
    });

    return () => {
      unsub();
      if (roleUnsub) roleUnsub();
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-6 w-6 animate-spin border-2 border-muted-foreground border-t-primary rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Admin Redirect: If admin is on /dashboard, send them to /admin
  if (role === 'admin' && (location.pathname === '/dashboard' || location.pathname === '/')) {
    return <Navigate to="/admin" replace />;
  }

  // User Security: If regular user is on /admin, send them to /dashboard
  if (role !== 'admin' && location.pathname === '/admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
