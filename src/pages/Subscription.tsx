import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, tokenStorage } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/constants';
import { Coins, Crown, Zap, Star, Check, ArrowLeft } from 'lucide-react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import PaymentService from '@/services/paymentService';
import { MetaTags } from '@/components/SEO/MetaTags';
import { StructuredData, generateFAQPageSchema } from '@/components/SEO/StructuredData';
import { SEO_CONFIG } from '@/config/seo';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  bonus: number;
}

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, updateUser } = useAuth();
  
  // Get SEO config based on current path
  const seo = SEO_CONFIG[location.pathname] || SEO_CONFIG['/subscription'];
  const faqSchema = generateFAQPageSchema([
    {
      question: 'What is included in Basic and Premium plans?',
      answer: 'Basic includes 30 credits for $9.99/month. Premium includes 60 credits for $14.99/month. Both include all art styles and high-quality outputs.',
    },
    {
      question: 'Can I just buy credits?',
      answer: 'Yes. Credit packages: $4.99 (10 credits), $8.99 (20), $11.99 (30), $16.99 (50). Use credits for AI generations and downloads.',
    },
    {
      question: 'Do unused credits roll over?',
      answer: 'Yes. Unused credits remain in your account and can be used later for AI generations or downloads.',
    },
  ]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedCreditPackage, setSelectedCreditPackage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCredits, setUserCredits] = useState(user?.credits || 0);
  const [paypalError, setPaypalError] = useState<string>('');
  const [runtimePayPalClientId, setRuntimePayPalClientId] = useState<string | null>(null);
  const [runtimeClientFetchDone, setRuntimeClientFetchDone] = useState(false);
  const [paymentType, setPaymentType] = useState<'subscription' | 'credits'>('subscription');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentCredits, setPaymentCredits] = useState<number>(0);

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      credits: 3,
      features: [
        '3 AI art generations',
        'Basic art styles',
        'Standard quality',
        'Community support'
      ],
      icon: <Star className="w-6 h-6" />
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      credits: 30,
      features: [
        '30 AI art generations',
        'All art styles',
        'High quality',
        'Priority support',
        'No watermarks'
      ],
      icon: <Zap className="w-6 h-6" />,
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 14.99,
      credits: 60,
      features: [
        '60 AI art generations',
        'All art styles + exclusive',
        'Ultra HD quality',
        '24/7 priority support',
        'Commercial license',
        'Early access to new features'
      ],
      icon: <Crown className="w-6 h-6" />
    }
  ];

  const creditPackages: CreditPackage[] = [
    { id: 'credits-10', credits: 10, price: 4.99, bonus: 0 },
    { id: 'credits-20', credits: 20, price: 8.99, bonus: 0 },
    { id: 'credits-30', credits: 30, price: 11.99, bonus: 0 },
    { id: 'credits-50', credits: 50, price: 16.99, bonus: 0 }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // #region agent log - hypothesis A,B
  useEffect(() => {
    try {
      const rawClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      const maskedClientId = rawClientId ? `***${String(rawClientId).slice(-6)}` : null;
      // Hypothesis A: Pages env still set to sandbox client ID
      // Hypothesis B: CDN/build serving old bundle with sandbox ID
      fetch('http://127.0.0.1:7242/ingest/839228e4-043b-434f-be81-06d17b3bc7f2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'B',
          location: 'Subscription.tsx:useEffect(mount)',
          message: 'PayPal env value at subscription mount (masked)',
          data: { maskedClientId, hasClientId: !!rawClientId },
          timestamp: Date.now()
        })
      }).catch(() => {});
    } catch (e) {
      /* ignore logging errors */
    }
  }, []);
  // #endregion agent log

  // Runtime PayPal client id: check injected global or fetch from backend config endpoint
  useEffect(() => {
    let cancelled = false;

    if (window.__PAYPAL_CLIENT_ID__) {
      setRuntimePayPalClientId((window as any).__PAYPAL_CLIENT_ID__);
      setRuntimeClientFetchDone(true);
      return;
    }

    const apiBase = API_BASE_URL;
    const tryFetchConfig = (base: string) =>
      fetch(`${base.replace(/\/api$/, '')}/api/config`)
        .then((res) => (res.ok ? res.json() : Promise.reject('no config')))
        .then((data) => {
          if (!cancelled && data?.paypalClientId) setRuntimePayPalClientId(data.paypalClientId);
        })
        .catch(() => {
          // ignore - we'll try fallback or set done below
        });

    if (apiBase) {
      tryFetchConfig(apiBase)
        .finally(() => {
          if (!cancelled) setRuntimeClientFetchDone(true);
        });
    } else {
      // Try known public worker URL as a fallback when VITE_API_URL is not set
      tryFetchConfig(defaultApi)
        .finally(() => {
          if (!cancelled) setRuntimeClientFetchDone(true);
        });
    }

    return () => { cancelled = true; };
  }, []);

  // Sync userCredits with user.credits from AuthContext
  useEffect(() => {
    if (user?.credits !== undefined) {
      setUserCredits(user.credits);
    }
  }, [user?.credits]);

  // PayPal payment related functions
  const createPayPalOrder = async (): Promise<string> => {
    try {
      setIsProcessing(true);
      
      // Check if user is logged in
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please log in to continue.');
      }
      
      // userId is now obtained from auth token, not sent in request body
      const orderData = {
        items: [{
          name: paymentType === 'subscription' ? `Subscription: ${selectedPlan}` : `Credits: ${paymentCredits}`,
          description: paymentType === 'subscription' 
            ? `AI Art ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Subscription` 
            : `${paymentCredits} AI Art Generation Credits`,
          price: paymentAmount,
          quantity: 1
        }],
        totalAmount: paymentAmount,
        currency: 'USD',
        type: paymentType,
        credits: paymentCredits,
        plan: selectedPlan
      };

      const orderId = await PaymentService.createOrder(orderData);
      return orderId;
    } finally {
      setIsProcessing(false);
    }
  };

  const onPayPalApprove = async (data: { orderID: string }) => {
    try {
      setIsProcessing(true);
      
      // Step 1: Capture PayPal payment
      const captureResult = await PaymentService.capturePayment(data.orderID);
      
      if (!captureResult.captureId) {
        throw new Error('Payment capture failed - no capture ID received');
      }
      
      // Step 2: Process payment and add credits via payment API
      const token = tokenStorage.getToken();
      const baseUrl = API_BASE_URL;
      
      if (paymentType === 'subscription') {
        // Process subscription payment
        const processResponse = await fetch(`${baseUrl}/payments/process-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            plan: selectedPlan,
            credits: paymentCredits,
            orderId: data.orderID,
            captureId: captureResult.captureId
          })
        });
        
        if (!processResponse.ok) {
          throw new Error('Failed to process subscription payment');
        }
        
        // Step 3: Update subscription status (without adding credits again)
        await processSubscription(selectedPlan);
      } else {
        // Process credit purchase
        const processResponse = await fetch(`${baseUrl}/payments/process-credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            credits: paymentCredits,
            orderId: data.orderID,
            captureId: captureResult.captureId
          })
        });
        
        if (!processResponse.ok) {
          throw new Error('Failed to process credit purchase');
        }
        
        const processResult = await processResponse.json();
        
        // Update local user information
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const updatedUser = { ...userData, credits: processResult.credits };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUserCredits(processResult.credits);
          
          // Update AuthContext
          if (updateUser) {
            updateUser({ credits: processResult.credits });
          }
        }
        
        PaymentService.handlePaymentSuccess(`${paymentCredits} credits added to your account!`);
      }
      
      // Reset payment status
      setSelectedPlan('');
      setSelectedCreditPackage('');
      setPaymentAmount(0);
      setPaymentCredits(0);
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('PayPal approval error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete payment. Please contact support.';
      PaymentService.handlePaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const onPayPalCancel = () => {
    PaymentService.handlePaymentCancel();
    setSelectedPlan('');
    setPaymentAmount(0);
    setPaymentCredits(0);
  };

  const onPayPalError = (error: unknown) => {
    if (import.meta.env.DEV) console.error('[PAYMENT] PayPal error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'PayPal payment service is currently unavailable. Please try again later.';
    
    if (error && typeof error === 'object' && error !== null) {
      const errorObj = error as { message?: string };
      if (errorObj.message) {
        if (errorObj.message.includes('client-id') || errorObj.message.includes('MISSING_CLIENT_ID')) {
          errorMessage = 'PayPal is not properly configured. Please contact support.';
        } else if (errorObj.message.includes('400') || errorObj.message.includes('Bad Request')) {
          errorMessage = 'PayPal Client ID is invalid or misconfigured. Please check: 1) Client ID value, 2) environment (Sandbox vs Live), 3) that your domain is authorized in the PayPal app.';
        } else if (errorObj.message.includes('401') || errorObj.message.includes('Unauthorized')) {
          errorMessage = 'PayPal Client ID is not authorized. Please check your PayPal app settings.';
        } else if (errorObj.message.includes('network') || errorObj.message.includes('fetch')) {
          errorMessage = 'Network error connecting to PayPal. Please check your internet connection and try again.';
        } else {
          errorMessage = `PayPal error: ${errorObj.message}`;
        }
      }
    }
    
    setPaypalError(errorMessage);
    PaymentService.handlePaymentError(error);
  };

  // Monitor PayPal SDK loading errors
  useEffect(() => {
    if (selectedPlan || selectedCreditPackage) {
      const checkPayPalSDK = () => {
        // Check if PayPal SDK script failed to load
        const scripts = document.querySelectorAll('script[src*="paypal.com/sdk"]');
        scripts.forEach((script) => {
            script.addEventListener('error', () => {
            if (import.meta.env.DEV) console.error('[PAYMENT] PayPal SDK script failed to load');
            setPaypalError('PayPal SDK failed to load. Please check your PayPal Client ID and domain authorization.');
          });
        });
      };
      
      // Check after a short delay to allow script to start loading
      const timeout = setTimeout(checkPayPalSDK, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedPlan, selectedCreditPackage]);

  const handleSubscribe = async (planId: string) => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) return;
    
    if (plan.price === 0) {
      // Free plan direct processing
      setIsProcessing(true);
      try {
        const token = tokenStorage.getToken();
        const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan: planId })
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (import.meta.env.DEV) console.error('[SUBSCRIPTION FRONTEND] Subscription failed:', errorData);
          
          // If user already has subscription but credits are missing, refresh user data
          if (errorData.message && errorData.message.includes('already activated')) {
            if (import.meta.env.DEV) console.log('[SUBSCRIPTION FRONTEND] User already has subscription, refreshing user data...');
            // Refresh user data from /auth/me
            try {
              const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (meResponse.ok) {
                const meData = await meResponse.json();
                if (import.meta.env.DEV) console.log('[SUBSCRIPTION FRONTEND] Refreshed user data:', meData);
                if (meData.user) {
                  localStorage.setItem('user', JSON.stringify(meData.user));
                  setUserCredits(meData.user.credits || 0);
                  if (updateUser) {
                    updateUser(meData.user);
                  }
                  // Show success message if credits were restored
                  if (errorData.debug && errorData.debug.currentCredits >= 3) {
                    PaymentService.handlePaymentSuccess(`You already have ${errorData.debug.currentCredits} credits!`);
                    setSelectedPlan('');
                    return; // Exit early, don't throw error
                  }
                }
              } else {
                if (import.meta.env.DEV) console.error('[SUBSCRIPTION FRONTEND] Failed to refresh user data, status:', meResponse.status);
                // If /auth/me fails, still show the error
              }
            } catch (refreshError) {
              if (import.meta.env.DEV) console.error('[SUBSCRIPTION FRONTEND] Error refreshing user data:', refreshError);
            }
          }
          
          throw new Error(errorData.message || 'Subscription failed');
        }

        const result = await response.json();
        if (import.meta.env.DEV) console.log('[SUBSCRIPTION FRONTEND] Free subscription result:', result);
        
        // Update local user information
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const updatedUser = { 
            ...userData, 
            credits: result.credits || 0,
            subscription: result.subscription 
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUserCredits(result.credits || 0);
          
          // Update AuthContext
          if (updateUser) {
            updateUser({ credits: result.credits || 0, subscription: result.subscription });
          }
        }

        PaymentService.handlePaymentSuccess('Free subscription activated successfully! You received 3 free credits!');
        setSelectedPlan('');
      } catch (error) {
        if (import.meta.env.DEV) console.error('Subscription error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to activate free subscription. Please try again.';
        PaymentService.handlePaymentError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Paid plan setup PayPal payment
      setSelectedPlan(planId);
      setPaymentType('subscription');
      setPaymentAmount(plan.price);
      setPaymentCredits(plan.credits);
      setPaypalError('');
    }
  };


  const handlePlanSelect = (planId: string) => {
    if (import.meta.env.DEV) console.log('[SUBSCRIPTION] handlePlanSelect called with planId:', planId);
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) {
      if (import.meta.env.DEV) console.error('[SUBSCRIPTION] Plan not found:', planId);
      return;
    }
    
    if (import.meta.env.DEV) console.log('[SUBSCRIPTION] Plan found:', plan.name, 'price:', plan.price);
    
    if (plan.price === 0) {
      if (import.meta.env.DEV) console.log('[SUBSCRIPTION] Free plan, calling handleSubscribe');
      handleSubscribe(planId);
    } else {
      if (import.meta.env.DEV) console.log('[SUBSCRIPTION] Paid plan, setting up payment modal:', {
        planId,
        price: plan.price,
        credits: plan.credits
      });
      setSelectedPlan(planId);
      setPaymentType('subscription');
      setPaymentAmount(plan.price);
      setPaymentCredits(plan.credits);
      setPaypalError('');
      if (import.meta.env.DEV) console.log('[SUBSCRIPTION] Payment modal state set, should show now');
    }
  };

  const handleCreditPackageSelect = (packageId: string) => {
    const creditPackage = creditPackages.find(p => p.id === packageId);
    if (!creditPackage) return;
    
    setSelectedCreditPackage(packageId);
    setPaymentType('credits');
    setPaymentAmount(creditPackage.price);
    setPaymentCredits(creditPackage.credits + creditPackage.bonus);
    setPaypalError('');
  };

  // Actual subscription processing (called after PayPal payment success)
  const processSubscription = async (planId: string) => {
    setIsProcessing(true);
    try {
      const token = tokenStorage.getToken();
      const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planId })
      });

      if (!response.ok) {
        throw new Error('Subscription failed');
      }

      const result = await response.json();
      
      // Update local user information
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUser = { 
          ...userData, 
          credits: result.credits,
          subscription: result.subscription 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserCredits(result.credits);
      }

      PaymentService.handlePaymentSuccess('Subscription purchased successfully!');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Subscription error:', error);
      PaymentService.handlePaymentError('Failed to purchase subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Actual credit purchase processing (called after PayPal payment success)

  return (
    <>
      <MetaTags
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords || ''}
        ogImage={seo.ogImage || ''}
      />
      <StructuredData data={faqSchema} type="FAQSubscription" />
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{userCredits} Credits</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Subscription Plans</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your AI portrait needs
            </p>
          </div>

          {/* Subscription packages */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.icon}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription>{plan.credits} credits included</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (import.meta.env.DEV) console.log('[SUBSCRIPTION] Select Plan button clicked for:', plan.id);
                      handlePlanSelect(plan.id);
                    }}
                    disabled={isProcessing}
                    type="button"
                  >
                    {plan.price === 0 ? 'Get Started' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Credit purchase */}
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {creditPackages.map((creditPackage) => (
              <Card key={creditPackage.id} className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {creditPackage.credits + creditPackage.bonus}
                  </CardTitle>
                  <CardDescription>Credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-primary">
                      ${creditPackage.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {creditPackage.bonus > 0 && (
                        <span>+{creditPackage.bonus} bonus</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleCreditPackageSelect(creditPackage.id)}
                    disabled={isProcessing}
                  >
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* PayPal Payment Modal */}
          {(() => {
            const shouldShow = (selectedPlan || selectedCreditPackage) && paymentAmount > 0;
            if (shouldShow) {
              if (import.meta.env.DEV) console.log('[SUBSCRIPTION] Payment modal should be visible:', {
                selectedPlan,
                selectedCreditPackage,
                paymentAmount,
                paymentType,
                hasPayPalClientId: !!runtimePayPalClientId
              });
            }
            return shouldShow;
          })() && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle>Complete Payment</CardTitle>
                  <CardDescription>
                    {paymentType === 'subscription' 
                      ? `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Subscription - $${paymentAmount}/month`
                      : `${paymentCredits} Credits - $${paymentAmount}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!runtimeClientFetchDone ? (
                    <div className="text-center space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm font-semibold mb-2">Initializing payment service…</p>
                        <p className="text-muted-foreground text-xs">Connecting to payment provider. Please wait a moment and try again if this message persists.</p>
                      </div>
                    </div>
                  ) : !runtimePayPalClientId || runtimePayPalClientId === 'MISSING_CLIENT_ID' ? (
                    <div className="text-center space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm font-semibold mb-2">PayPal not configured</p>
                        <p className="text-red-700 text-xs">
                          PayPal payments require a configured Client ID in environment variables. Please contact the site administrator or check the configuration docs.
                        </p>
                        <p className="text-red-600 text-xs mt-2">
                          Set the following env var in Cloudflare Pages: VITE_PAYPAL_CLIENT_ID
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedPlan('');
                          setSelectedCreditPackage('');
                          setPaymentAmount(0);
                          setPaymentCredits(0);
                        }}
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  ) : paypalError ? (
                    <div className="text-center space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-yellow-800 text-sm font-medium">Payment Service Issue</p>
                            <p className="text-yellow-700 text-sm mt-1">{paypalError}</p>
                            {paypalError.includes('400') || paypalError.includes('Bad Request') || paypalError.includes('domain') ? (
                              <div className="mt-2 text-xs text-yellow-600">
                                <p className="font-medium">Troubleshooting steps:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  <li>Check if your domain is authorized in PayPal Developer Console</li>
                                  <li>Verify PayPal Client ID is correct and active</li>
                                  <li>Ensure you're using the right environment (Sandbox vs Live)</li>
                                  <li>Contact support if the problem persists</li>
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPaypalError('');
                          setSelectedPlan('');
                          setSelectedCreditPackage('');
                          setPaymentAmount(0);
                        }}
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  ) : runtimeClientFetchDone && runtimePayPalClientId && runtimePayPalClientId !== 'MISSING_CLIENT_ID' ? (
                    <PayPalScriptProvider
                      options={{
                        clientId: runtimePayPalClientId,
                        currency: 'USD',
                        intent: 'capture',
                        components: 'buttons',
                        // Add environment-specific options
                        ...(import.meta.env.DEV && {
                          'enable-funding': 'venmo',
                          'disable-funding': 'paylater,card'
                        }),
                        // Add client metadata for better error handling
                        'data-client-metadata-id': 'pawdia-payment-' + Date.now()
                      }}
                      deferLoading={false}
                      onError={(error: unknown) => {
                        if (import.meta.env.DEV) console.error('[PAYMENT] PayPal Script Provider error:', error);
                        setPaypalError('PayPal service initialization failed. This may be due to network issues or PayPal configuration problems.');
                      }}
                    >
                      <PayPalButtons
                        style={{
                          layout: 'vertical',
                          color: 'blue',
                          shape: 'rect',
                          label: 'paypal'
                        }}
                        createOrder={createPayPalOrder}
                        onApprove={onPayPalApprove}
                        onCancel={onPayPalCancel}
                        onError={onPayPalError}
                        disabled={isProcessing}
                      />
                    </PayPalScriptProvider>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm font-semibold mb-2">Loading PayPal...</p>
                        <p className="text-muted-foreground text-xs">Initializing payment service. Please wait a moment and try again if this message persists.</p>
                      </div>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Processing payment...</p>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedPlan('');
                      setSelectedCreditPackage('');
                      setPaymentAmount(0);
                      setPaymentCredits(0);
                    }}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Current subscription information */}
          {isAuthenticated && user && (
            <div className="bg-muted/20 p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-bold mb-4">Current Subscription</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Subscription Status</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${user.subscription?.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className="capitalize">{user.subscription?.status || 'none'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Credits Balance</h3>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-600" />
                    <span className="text-xl font-bold">{user.credits || 0}</span>
                    <span className="text-sm text-muted-foreground">credits available</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Subscription;