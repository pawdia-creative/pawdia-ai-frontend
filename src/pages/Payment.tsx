import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import PaymentService from '@/services/paymentService';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: cartState, clearCart } = useCart();
  const { user } = useAuth();
  
  const [paypalOrderId, setPaypalOrderId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalError, setPaypalError] = useState<string>('');

  // Check if cart is empty
  useEffect(() => {
    if (cartState.items.length === 0) {
      navigate('/create');
    }
  }, [cartState.items.length, navigate]);

  // Create PayPal order
  const createOrder = async (): Promise<string> => {
    try {
      setIsProcessing(true);
      
      const orderData = {
        items: cartState.items.map(item => ({
          name: item.name,
          description: `${item.description} - ${item.size}`,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: cartState.total,
        currency: 'USD',
        userId: user?.id
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

  // Capture PayPal payment
  const onApprove = async (data: { orderID: string }) => {
    try {
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
      
    } catch (error) {
      // Error handling already done in PaymentService
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment cancellation handling
  const onCancel = () => {
    PaymentService.handlePaymentCancel();
    navigate('/payment/cancel');
  };

  // Payment error handling
  const onError = (error: any) => {
    PaymentService.handlePaymentError(error);
    setPaypalError('PayPal payment service is currently unavailable. Please try again later.');
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
              {paypalError ? (
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
                    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
                    currency: 'USD',
                    intent: 'capture'
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