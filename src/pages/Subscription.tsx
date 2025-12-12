import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, Crown, Zap, Star, Check, ArrowLeft } from 'lucide-react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import PaymentService from '@/services/paymentService';

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
  const { user, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCredits, setUserCredits] = useState(user?.credits || 0);
  const [paypalOrderId, setPaypalOrderId] = useState<string>('');
  const [paypalError, setPaypalError] = useState<string>('');
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
      credits: 20,
      features: [
        '20 AI art generations',
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
      price: 19.99,
      credits: 50,
      features: [
        '50 AI art generations',
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
    { id: 'credits-25', credits: 25, price: 9.99, bonus: 5 },
    { id: 'credits-60', credits: 60, price: 19.99, bonus: 15 },
    { id: 'credits-150', credits: 150, price: 39.99, bonus: 50 }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // PayPal payment related functions
  const createPayPalOrder = async (): Promise<string> => {
    try {
      setIsProcessing(true);
      
      // Check if user is logged in
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please log in to continue.');
      }
      
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
        userId: user.id,
        type: paymentType,
        credits: paymentCredits,
        plan: selectedPlan
      };

      const orderId = await PaymentService.createOrder(orderData);
      setPaypalOrderId(orderId);
      return orderId;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const onPayPalApprove = async (data: { orderID: string }) => {
    try {
      setIsProcessing(true);
      
      await PaymentService.capturePayment(data.orderID);
      
      // Process result based on payment type
      if (paymentType === 'subscription') {
        await processSubscription(selectedPlan);
      } else {
        await processCreditPurchase(paymentCredits);
      }
      
      // Reset payment status
      setSelectedPlan('');
      setPaymentAmount(0);
      setPaymentCredits(0);
      
    } catch (error) {
      // Error handling already done in PaymentService
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

  const onPayPalError = (error: any) => {
    console.error('PayPal error:', error);
    setPaypalError('PayPal payment service is currently unavailable. Please try again later.');
    PaymentService.handlePaymentError(error);
  };

  const handleSubscribe = async (planId: string) => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) return;
    
    if (plan.price === 0) {
      // Free plan direct processing
      setIsProcessing(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || `${window.location.origin}/api`}/subscriptions/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan: planId })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Subscription failed');
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

        PaymentService.handlePaymentSuccess('Free subscription activated successfully!');
        setSelectedPlan('');
      } catch (error) {
        console.error('Subscription error:', error);
        PaymentService.handlePaymentError(error.message || 'Failed to activate free subscription. Please try again.');
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

  const handleBuyCredits = async (credits: number, price: number) => {
    // Setup PayPal payment
    setPaymentType('credits');
    setPaymentAmount(price);
    setPaymentCredits(credits);
    setPaypalError('');
  };

  const handlePlanSelect = (planId: string) => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) return;
    
    if (plan.price === 0) {
      handleSubscribe(planId);
    } else {
      setSelectedPlan(planId);
      setPaymentType('subscription');
      setPaymentAmount(plan.price);
      setPaymentCredits(plan.credits);
      setPaypalError('');
    }
  };

  const [selectedCreditPackage, setSelectedCreditPackage] = useState<string>('');

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
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || `${window.location.origin}/api`}/subscriptions/subscribe`, {
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
      console.error('Subscription error:', error);
      PaymentService.handlePaymentError('Failed to purchase subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Actual credit purchase processing (called after PayPal payment success)
  const processCreditPurchase = async (credits: number) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || `${window.location.origin}/api`}/subscriptions/credits/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: credits })
      });

      if (!response.ok) {
        throw new Error('Credit purchase failed');
      }

      const result = await response.json();
      
      // Update local user information
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUser = { ...userData, credits: result.credits };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserCredits(result.credits);
      }

      PaymentService.handlePaymentSuccess(`${credits} credits added to your account!`);
    } catch (error) {
      console.error('Credit purchase error:', error);
      PaymentService.handlePaymentError('Failed to purchase credits. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
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
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={isProcessing}
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
  );
};

export default Subscription;