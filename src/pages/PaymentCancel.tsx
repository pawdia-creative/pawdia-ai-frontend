import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground">Your payment was not completed</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Your payment process was interrupted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                Your payment was cancelled. No charges have been made to your account. 
                You can return to your cart and complete your purchase at any time.
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => navigate('/payment')}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/create')}
                className="flex-1"
              >
                Back to Cart
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCancel;