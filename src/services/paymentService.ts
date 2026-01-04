import { toast } from 'sonner';
import { tokenStorage } from '@/contexts/AuthContext';

interface OrderData {
  items: Array<{
    name: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  currency: string;
  userId?: string;
  type?: string;
  credits?: number;
  plan?: string;
}

interface PaymentResult {
  orderId: string;
  captureId?: string;
  status: string;
}

interface OrderDetails {
  id: string;
  paypalOrderId: string;
  status: string;
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  createdAt: string;
  userId?: string;
}

interface UserOrder {
  id: string;
  paypalOrderId: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
}

class PaymentService {
  // Base API URL for payment-related endpoints
  // 强烈建议在环境变量中显式配置 VITE_API_URL，用于区分本地、测试和生产环境。
  // 如果未配置，则默认回退到本地开发地址，避免无意间直连生产环境。
  private static readonly apiBaseUrl =
    import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

  private static baseUrl = `${PaymentService.apiBaseUrl}/payments`;

  /**
   * Create PayPal order (requires authentication)
   */
  static async createOrder(orderData: OrderData): Promise<string> {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in to create an order.');
      }

      // Remove userId from orderData as it's now obtained from the auth token
      const { userId, ...orderDataWithoutUserId } = orderData;

      const response = await fetch(`${this.baseUrl}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderDataWithoutUserId),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Prefer backend-provided detailed error if available
        const detailedMessage = errorData.error || errorData.message;
        throw new Error(detailedMessage || 'Failed to create PayPal order');
      }

      const data = await response.json();
      return data.orderId;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating PayPal order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create payment order');
      throw error;
    }
  }

  /**
   * Capture PayPal payment
   */
  static async capturePayment(orderId: string): Promise<PaymentResult> {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in to capture the payment.');
      }

      const response = await fetch(`${this.baseUrl}/capture-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detailedMessage = errorData.error || errorData.message;
        throw new Error(detailedMessage || 'Failed to capture payment');
      }

      const result = await response.json();
      return {
        orderId,
        captureId: result.captureId,
        status: result.status
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error capturing payment:', error);
      toast.error('Payment capture failed');
      throw error;
    }
  }

  /**
   * Get order details
   */
  static async getOrderDetails(orderId: string): Promise<OrderDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/order/${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to get order details');
      }

      const data = await response.json();
      return data.order;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error getting order details:', error);
      throw error;
    }
  }

  /**
   * Get user order history
   */
  static async getUserOrders(): Promise<UserOrder[]> {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in to view your orders.');
      }

      const response = await fetch(`${this.baseUrl}/user-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user orders');
      }

      const data = await response.json();
      return data.orders;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error getting user orders:', error);
      throw error;
    }
  }

  /**
   * Handle payment success logic
   */
  static handlePaymentSuccess(
    orderId: string, 
    captureId: string, 
    totalAmount: number,
    onSuccess?: () => void
  ): void;
  static handlePaymentSuccess(message: string): void;
  static handlePaymentSuccess(
    arg1: string, 
    arg2?: string, 
    _arg3?: number,
    arg4?: () => void
  ): void {
    if (typeof arg2 === 'string') {
      // This is the full version: handlePaymentSuccess(orderId, captureId, totalAmount, onSuccess)
      const onSuccess = arg4;
      // Can add common logic after payment success here
      // For example, send analytics events, update user status, etc.
      
      if (onSuccess) {
        onSuccess();
      }
    } else {
      // This is the simplified version: handlePaymentSuccess(message)
      toast.success(arg1);
    }
  }

  /**
   * Handle payment cancellation
   */
  static handlePaymentCancel() {
    toast.info('Payment was cancelled');
  }

  /**
   * Handle payment errors
   */
  static handlePaymentError(error: unknown) {
    if (import.meta.env.DEV) console.error('PayPal error:', error);
    toast.error('An error occurred during payment');
  }
}

export default PaymentService;