import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "@/pages/Index";
import { ArtCreation } from "@/pages/ArtCreation";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Subscription from "@/pages/Subscription";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import EmailVerification from "@/pages/EmailVerification";
import EmailVerificationRequired from "@/pages/EmailVerificationRequired";
import VerifySuccess from "@/pages/VerifySuccess";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Examples from "@/pages/Examples";
import Blog from "@/pages/Blog";
import {
  WatercolorPetPortrait,
  SketchPetPortrait,
  OilPaintingPetPortrait,
  CartoonPetPortrait,
} from "@/pages/StylePage";

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
        const token = localStorage.getItem('token');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        await fetch(`${apiBaseUrl}/analytics/page-view`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            path: location.pathname,
            referer: document.referrer || null
          })
        });
      } catch (error) {
        // Silently fail - analytics tracking should not break the app
        if (import.meta.env.DEV) console.error('Page view tracking error:', error);
      }
    };
    
    trackPageView();
  }, [location.pathname, user]);
  
  return null;
};

const AppContent = () => (
            <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
    <PageViewTracker />
            <div className="min-h-screen">
              <Navbar />
              <Routes>
                {/* Public homepage — show Index to unauthenticated visitors */}
                <Route path="/" element={<Index />} />
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
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                {/* Legacy/alternate verification path for email links */}
                <Route path="/verify" element={<EmailVerification />} />
                <Route path="/verify-success" element={<VerifySuccess />} />
                <Route path="/verify-required" element={<EmailVerificationRequired />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/examples" element={<Examples />} />
        <Route path="/blog" element={<Blog />} />
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
            </div>
            </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppContent />
        </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
