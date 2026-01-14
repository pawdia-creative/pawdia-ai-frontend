import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// @ts-nocheck - TypeScript compiler passes but ESLint has issues with react-router-dom types
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/useAuth";
import { tokenStorage } from '@/lib/tokenStorage';
import ErrorBoundary from "@/components/ErrorBoundary";

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy load components
const Navbar = React.lazy(() => import("@/components/Navbar"));
const ProtectedRoute = React.lazy(() => import("@/components/ProtectedRoute"));
const AdminRoute = React.lazy(() => import("@/components/AdminRoute"));
const BaseRoute = React.lazy(() => import("@/components/BaseRoute"));

const Index = React.lazy(() => import("@/pages/Index"));
const ArtCreation = React.lazy(() => import("@/pages/ArtCreation").then(module => ({ default: module.ArtCreation })));
const Login = React.lazy(() => import("@/pages/Login"));
const Register = React.lazy(() => import("@/pages/Register"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const Subscription = React.lazy(() => import("@/pages/Subscription"));
const AdminDashboard = React.lazy(() => import("@/pages/AdminDashboard"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const PrivacyPolicy = React.lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("@/pages/TermsOfService"));
const EmailVerification = React.lazy(() => import("@/pages/EmailVerification"));
const EmailVerificationRequired = React.lazy(() => import("@/pages/EmailVerificationRequired"));
const VerifySuccess = React.lazy(() => import("@/pages/VerifySuccess"));
const Diagnostics = React.lazy(() => import("@/pages/Diagnostics"));
const About = React.lazy(() => import("@/pages/About"));
const Contact = React.lazy(() => import("@/pages/Contact"));
const Examples = React.lazy(() => import("@/pages/Examples"));
const Blog = React.lazy(() => import("@/pages/Blog"));

const WatercolorPetPortrait = React.lazy(() => import("@/pages/StylePage").then(module => ({ default: module.WatercolorPetPortrait })));
const SketchPetPortrait = React.lazy(() => import("@/pages/StylePage").then(module => ({ default: module.SketchPetPortrait })));
const OilPaintingPetPortrait = React.lazy(() => import("@/pages/StylePage").then(module => ({ default: module.OilPaintingPetPortrait })));
const CartoonPetPortrait = React.lazy(() => import("@/pages/StylePage").then(module => ({ default: module.CartoonPetPortrait })));


const queryClient = new QueryClient();

// Page view tracking component
const PageViewTracker = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
        const token = tokenStorage.getToken();

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
          await fetch(`${apiBaseUrl}/analytics/page-view`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              path: location.pathname,
              referer: document.referrer || null
            }),
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        // Silently fail - analytics tracking should not break the app
        if (import.meta.env.DEV) console.error('Page view tracking error:', error);
      }
    };
    
    trackPageView();
  }, [location.pathname, user]);
  
  return null;
};

// Verification enforcer component
const VerificationEnforcer = () => {
  const { user, checkedAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!checkedAuth) return; // wait until auth state is known
    if (!user) return; // not logged in

    const unguardedPaths = new Set([
      '/verify-email',
      '/verify-required',
      '/verify',
      '/verify-success',
      '/login',
      '/register',
      '/privacy',
      '/terms',
      '/about',
      '/contact',
      '/examples',
      '/blog'
    ]);

    // Also honor a persistent must_verify flag in localStorage so clients that
    // haven't yet updated context still get routed to verification.
    const mustVerifyFlag = localStorage.getItem('must_verify') === '1';

    if ((!user.isVerified || mustVerifyFlag) && !unguardedPaths.has(location.pathname)) {
      // force to verification-required page
      if (import.meta.env.DEV) console.log('[VerificationEnforcer] Redirecting to /verify-required (mustVerifyFlag:', mustVerifyFlag, ')');
      navigate('/verify-required', { replace: true });
    }
  }, [user, checkedAuth, location.pathname, navigate]);

  return null;
};

const AppContent = () => (
            <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            {/* Enforce email verification: if a logged-in user is not verified,
                force navigation to the verification-required page and prevent access
                to other protected parts of the app until verification completes. */}
            <VerificationEnforcer />
    <PageViewTracker />
            <div className="min-h-screen">
              <React.Suspense fallback={<LoadingSpinner />}>
              <Navbar />
              </React.Suspense>
              <React.Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Homepage — publicly accessible */}
                <Route path="/" element={
                  <BaseRoute publicForGuests={true}>
                    <Index />
                  </BaseRoute>
                } />
                <Route path="/create" element={
                  <ProtectedRoute>
                    <ArtCreation />
                  </ProtectedRoute>
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/subscription" element={
                  <ProtectedRoute>
                    <Subscription />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/privacy" element={
                  <BaseRoute publicForGuests={true}>
                    <PrivacyPolicy />
                  </BaseRoute>
                } />
                <Route path="/terms" element={
                  <BaseRoute publicForGuests={true}>
                    <TermsOfService />
                  </BaseRoute>
                } />
                <Route path="/verify-email" element={<EmailVerification />} />
                {/* Legacy/alternate verification path for email links */}
                <Route path="/verify" element={<EmailVerification />} />
                <Route path="/verify-success" element={<VerifySuccess />} />
                <Route path="/verify-required" element={<EmailVerificationRequired />} />
        <Route path="/diagnostics" element={
          <BaseRoute publicForGuests={true}>
            <Diagnostics />
          </BaseRoute>
        } />
        <Route path="/about" element={
                  <BaseRoute publicForGuests={true}>
                    <About />
                  </BaseRoute>
                } />
        <Route path="/contact" element={
                  <BaseRoute publicForGuests={true}>
                    <Contact />
                  </BaseRoute>
                } />
        <Route path="/examples" element={
                  <BaseRoute publicForGuests={true}>
                    <Examples />
                  </BaseRoute>
                } />
        <Route path="/blog" element={
                  <BaseRoute publicForGuests={true}>
                    <Blog />
                  </BaseRoute>
                } />
        {/* Style pages */}
        <Route path="/watercolor-pet-portrait-ai" element={<WatercolorPetPortrait />} />
        <Route path="/sketch-pet-portrait-ai" element={<SketchPetPortrait />} />
        <Route path="/oil-painting-pet-portrait-ai" element={<OilPaintingPetPortrait />} />
        <Route path="/cartoon-pet-portrait-ai" element={<CartoonPetPortrait />} />
        {/* SEO redirects - these pages can redirect to main generator or show content */}
        <Route path="/ai-pet-portrait-generator" element={
          <ProtectedRoute>
            <ArtCreation />
          </ProtectedRoute>
        } />
        <Route path="/free-ai-pet-portrait-generator" element={
          <ProtectedRoute>
            <ArtCreation />
          </ProtectedRoute>
        } />
        <Route path="/ai-pet-portrait" element={
          <ProtectedRoute>
            <ArtCreation />
          </ProtectedRoute>
        } />
        <Route path="/pricing" element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </React.Suspense>
            </div>
            </BrowserRouter>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

// Prefetch important route chunks when the browser is idle to reduce first-click latency.
// This runs outside of the React render tree to avoid impacting hydration.
if (typeof window !== 'undefined') {
  const doPrefetch = () => {
    // Prefetch examples and creation page after idle
    try {
      import('@/pages/Examples');
      import('@/pages/ArtCreation');
      import('@/components/Navbar');
    } catch {
      // ignore
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(doPrefetch, { timeout: 2000 });
  } else {
    setTimeout(doPrefetch, 2500);
  }
}
