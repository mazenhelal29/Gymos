import React from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { useAuth } from './hooks/use-auth';
import { AppLayout } from './components/layout/app-layout';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Subscriptions } from './pages/Subscriptions';
import { Payments } from './pages/Payments';
import { Expenses } from './pages/Expenses';
import { Settings } from './pages/Settings';
import { Packages } from './pages/Packages';
import { Expired } from './pages/Expired';
import { AdminLayout } from './components/layout/admin-layout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminGyms } from './pages/admin/AdminGyms';
import { AdminPricing } from './pages/admin/AdminPricing';
import { shouldBlockGymAccess } from './lib/gym-subscription';
import { BareLayout } from './components/layout/bare-layout';

const PUBLIC_PATHS = ['/login', '/signup'];
const ADMIN_PREFIX = '/admin';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedPage({
  component: Component,
  requiredRole,
  layout: Layout = AppLayout,
}: {
  component: React.ComponentType;
  requiredRole?: string;
  layout?: React.ComponentType<{ children: React.ReactNode }>;
}) {
  const { user, gymSubscription } = useAuth();
  const [location, setLocation] = useLocation();

  React.useEffect(() => {
    if (!user) {
      setLocation('/login');
    } else if (requiredRole && user.role !== requiredRole) {
      setLocation('/');
    } else if (
      !location.startsWith(ADMIN_PREFIX) &&
      !user.isSuperAdmin &&
      location !== '/expired' &&
      shouldBlockGymAccess(user, gymSubscription)
    ) {
      setLocation('/expired');
    }
  }, [user, requiredRole, location, gymSubscription, setLocation]);

  if (!user) return <Spinner />;
  if (requiredRole && user.role !== requiredRole) return <Spinner />;

  if (
    !location.startsWith(ADMIN_PREFIX) &&
    !user.isSuperAdmin &&
    location !== '/expired' &&
    shouldBlockGymAccess(user, gymSubscription)
  ) {
    return <Spinner />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function SuperAdminPage({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!loading && !user) setLocation('/login');
    else if (!loading && user && !user.isSuperAdmin) setLocation('/');
  }, [loading, user, setLocation]);

  if (loading || !user) return <Spinner />;
  if (!user.isSuperAdmin) return <Spinner />;

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

export function App() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect logged-in users away from login/signup
  React.useEffect(() => {
    if (!loading && user && PUBLIC_PATHS.includes(location)) {
      if (user.isSuperAdmin) {
        setLocation('/admin');
      } else {
        setLocation('/');
      }
    }
  }, [loading, user, location, setLocation]);

  if (loading) return <Spinner />;

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Protected Routes */}
      <Route path="/">
        <ProtectedPage component={Dashboard} />
      </Route>
      <Route path="/members">
        <ProtectedPage component={Members} />
      </Route>
      <Route path="/subscriptions">
        <ProtectedPage component={Subscriptions} />
      </Route>
      <Route path="/packages">
        <ProtectedPage component={Packages} />
      </Route>
      <Route path="/payments">
        <ProtectedPage component={Payments} />
      </Route>
      <Route path="/expenses">
        <ProtectedPage component={Expenses} />
      </Route>
      <Route path="/settings">
        <ProtectedPage component={Settings} />
      </Route>
      <Route path="/expired">
        <ProtectedPage component={Expired} layout={BareLayout} />
      </Route>

      {/* Super Admin */}
      <Route path="/admin">
        <SuperAdminPage component={AdminOverview} />
      </Route>
      <Route path="/admin/gyms">
        <SuperAdminPage component={AdminGyms} />
      </Route>
      <Route path="/admin/pricing">
        <SuperAdminPage component={AdminPricing} />
      </Route>

      {/* Fallback */}
      <Route>
        <Login />
      </Route>
    </Switch>
  );
}
