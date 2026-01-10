import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/constants';
import { useCart } from '@/contexts/CartContext';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import PaymentService from '@/services/paymentService';

const Payment = () => {
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalError, setPaypalError] = useState<string>('');
  const [runtimePayPalClientId, setRuntimePayPalClientId] = useState<string | null>(null);
  const [runtimeClientFetchDone, setRuntimeClientFetchDone] = useState(false);

  // Check if cart is empty
  useEffect(() => {
    if (cartState.items.length === 0) {
      navigate('/create');
    }
  }, [cartState.items.length, navigate]);

  // #region dev-only agent log - hypothesis A,B
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    try {
      const rawClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      const maskedClientId = rawClientId ? `***${String(rawClientId).slice(-6)}` : null;
      // Local telemetry agent; if not running this will error — swallow silently
      fetch('http://127.0.0.1:7242/ingest/839228e4-043b-434f-be81-06d17b3bc7f2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'A',
          location: 'Payment.tsx:useEffect(mount)',
          message: 'PayPal env value at component mount (masked)',
          data: { maskedClientId, hasClientId: !!rawClientId },
          timestamp: Date.now()
        })
      }).catch(() => {});
    } catch (e) {
      /* swallow errors during logging */
    }
  }, []);
  // #endregion dev-only agent log

  // Runtime PayPal client id: check injected global or fetch from backend config endpoint
  useEffect(() => {
    let cancelled = false;

    // 1) check global injected var (optional: Worker can inject into page)
    if (window.__PAYPAL_CLIENT_ID__) {
      setRuntimePayPalClientId(window.__PAYPAL_CLIENT_ID__);
      setRuntimeClientFetchDone(true);
      return;
    }

    // 2) fetch from backend runtime endpoint (public client id is safe to expose)
    const apiBase = API_BASE_URL;
    const tryFetchConfig = (base: string) =>
      fetch(`${base.replace(/\/api$/, '')}/api/config`)
        .then((res) => (res.ok ? res.json() : Promise.reject('no config')))
        .then((data) => {
          if (!cancelled && data?.paypalClientId) setRuntimePayPalClientId(data.paypalClientId);
        })
        .catch(() => {
          // ignore - we'll fallback to other options
        });

    if (apiBase) {
      tryFetchConfig(apiBase)
        .finally(() => {
          if (!cancelled) setRuntimeClientFetchDone(true);
        });
    } else {
      // Try known public worker URL as a fallback when VITE_API_URL is not set
      tryFetchConfig(API_BASE_URL)
        .finally(() => {
          if (!cancelled) setRuntimeClientFetchDone(true);
        });
    }

    return () => { cancelled = true; };
  }, []);

  // DEV: log a short preview of the resolved PayPal client id for debugging
  useEffect(() => {
    if (import.meta.env.DEV && runtimeClientFetchDone) {
      const preview = runtimePayPalClientId ? String(runtimePayPalClientId).slice(0, 6) : 'NONE';
      const isSandbox = !!(runtimePayPalClientId && (String(runtimePayPalClientId).startsWith('EPeFX') || String(runtimePayPalClientId).toLowerCase().includes('sandbox')));
      // Print where the client id came from (window injection) and a short preview
       
      console.log('[PAYPAL] clientIdPreview:', preview, 'isSandbox:', isSandbox, 'windowInjected:', !!window.__PAYPAL_CLIENT_ID__);
    }
  }, [runtimeClientFetchDone, runtimePayPalClientId]);

  // Create PayPal order
  const createOrder = async (): Promise<string> => {
    try {
      setIsProcessing(true);
      
      // userId is now obtained from auth token, not sent in request body
      const orderData = {
        items: cartState.items.map(item => ({
          name: item.name,
          description: `${item.description} - ${item.size}`,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: cartState.total,
        currency: 'USD'
      };

      const orderId = await PaymentService.createOrder(orderData);
      return orderId;
    } finally {
      setIsProcessing(false);
    }
  };

  // Capture PayPal payment
  const onApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);

    const result = await PaymentService.capturePayment(data.orderID);

    // Clear cart
    clearCart();

    // Navigate to payment success page
    navigate('/payment/success', {
      state: {
        orderId: data.orderID,
        captureId: result.captureId,
        totalAmount: cartState.total
      }
    });

    setIsProcessing(false);
  };

  // Payment cancellation handling
  const onCancel = () => {
    PaymentService.handlePaymentCancel();
    navigate('/payment/cancel');
  };

  // Payment error handling
  const onError = (error: unknown) => {
    if (import.meta.env.DEV) console.error('[PAYMENT] PayPal SDK error:', error);

    let errorMessage = 'An error occurred during payment. Please try again.';

    if (error && typeof error === 'object' && error !== null) {
      const errorObj = error as { message?: string };
      if (errorObj.message) {
        if (errorObj.message.includes('400') || errorObj.message.includes('Bad Request')) {
          errorMessage = 'PayPal Client ID is invalid or misconfigured. Please check: 1) Client ID value, 2) environment (Sandbox vs Live), 3) that your domain is authorized in the PayPal app.';
        } else if (errorObj.message.includes('401') || errorObj.message.includes('Unauthorized')) {
          errorMessage = 'PayPal Client ID is not authorized. Please check your PayPal app settings.';
        } else if (errorObj.message.includes('client-id') || errorObj.message.includes('MISSING_CLIENT_ID')) {
          errorMessage = 'PayPal is not properly configured. Please contact support.';
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

  

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase with PayPal</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your items before payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartState.items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.size} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">${item.price} each</p>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${cartState.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment area */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Pay securely with PayPal</CardDescription>
            </CardHeader>
            <CardContent>
            {!runtimeClientFetchDone ? (
                <div className="text-center space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm font-semibold mb-2">Initializing payment service…</p>
                    <p className="text-muted-foreground text-xs">Connecting to payment provider. Please wait a moment and try again if this message persists.</p>
                  </div>
                </div>
              ) : !runtimeClientFetchDone || !(runtimePayPalClientId) || runtimePayPalClientId === 'MISSING_CLIENT_ID' ? (
                <div className="text-center space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm font-semibold mb-2">PayPal not configured</p>
                    <p className="text-red-700 text-xs">
                      PayPal payments require the Client ID environment variable. Please contact the site admin or check the configuration docs.
                    </p>
                    <p className="text-red-600 text-xs mt-2">
                      Set in Cloudflare Pages: VITE_PAYPAL_CLIENT_ID
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/create')}
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              ) : paypalError ? (
                <div className="text-center space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">{paypalError}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Retry PayPal
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    <p>For now, please contact us directly to complete your purchase.</p>
                  </div>
                </div>
              ) : (
                <PayPalScriptProvider
                  options={{
                    clientId: runtimePayPalClientId as string,
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
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onCancel={onCancel}
                    onError={onError}
                    disabled={isProcessing || cartState.items.length === 0}
                  />
                </PayPalScriptProvider>
              )}
              
              {isProcessing && (
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">Processing payment...</p>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/create')}
                  className="w-full"
                >
                  Back to Customization
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;