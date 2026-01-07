import { apiClient, ApiError } from '@/lib/apiClient';
import { handleError } from '@/lib/errorHandler';

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
  private static baseUrl = '/payments';

  /**
   * Create PayPal order (requires authentication)
   */
  static async createOrder(orderData: OrderData): Promise<string> {
    try {
      // Remove userId from orderData as it's now obtained from the auth token
      const { userId, ...orderDataWithoutUserId } = orderData;

      const response = await apiClient.post(`${this.baseUrl}/create-order`, orderDataWithoutUserId);
      return response.data.orderId;
    } catch (error) {
      handleError(error, 'payment', {
        showToast: true,
        logError: true
      });
      throw error;
    }
  }

  /**
   * Capture PayPal payment
   */
  static async capturePayment(orderId: string): Promise<PaymentResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/capture-order/${orderId}`);
      return {
        orderId,
        captureId: response.data.captureId,
        status: response.data.status
      };
    } catch (error) {
      handleError(error, 'payment', {
        showToast: true,
        logError: true
      });
      throw error;
    }
  }

  /**
   * Get order details
   */
  static async getOrderDetails(orderId: string): Promise<OrderDetails> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/order/${orderId}`);
      return response.data.order;
    } catch (error) {
      handleError(error, 'payment', {
        showToast: false,
        logError: true
      });
      throw error;
    }
  }

  /**
   * Get user order history
   */
  static async getUserOrders(): Promise<UserOrder[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/user-orders`);
      return response.data.orders;
    } catch (error) {
      handleError(error, 'payment', {
        showToast: false,
        logError: true
      });
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