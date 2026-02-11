import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OnboardingWizard from './pages/auth/Onboarding';

import DashboardLayout from './layouts/DashboardLayout';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { UserProvider } from './contexts/UserContext';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { DashboardSkeleton } from './components/LoadingSpinner';

// Lazy load dashboard pages for better performance
const DashboardHome = lazy(() => import('./pages/dashboard/Home'));
const Matches = lazy(() => import('./pages/dashboard/Matches'));
const Projects = lazy(() => import('./pages/dashboard/Projects'));
const Leaderboard = lazy(() => import('./pages/dashboard/Leaderboard'));
const Sessions = lazy(() => import('./pages/dashboard/Sessions'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Messages = lazy(() => import('./pages/dashboard/Messages'));

// function App
function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground font-sans antialiased">
            <Toaster position="top-right" richColors closeButton />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/onboarding" element={<OnboardingWizard />} />

              {/* Private Routes - UserProvider only needed here */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={
                  <UserProvider>
                    <DashboardLayout />
                  </UserProvider>
                }>
                  <Route index element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <DashboardHome />
                    </Suspense>
                  } />
                  <Route path="matches" element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <Matches />
                    </Suspense>
                  } />
                  <Route path="projects" element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <Projects />
                    </Suspense>
                  } />
                  <Route path="leaderboard" element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <Leaderboard />
                    </Suspense>
                  } />
                  <Route path="sessions" element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <Sessions />
                    </Suspense>
                  } />
                  <Route path="profile" element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <Profile />
                    </Suspense>
                  } />
                  <Route path="messages" element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <Messages />
                    </Suspense>
                  } />
                </Route>
              </Route>
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
