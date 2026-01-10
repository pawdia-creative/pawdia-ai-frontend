// PayPal payment utilities for Pawdia AI API

// PayPal SDK configuration
const PAYPAL_BASE_URL = (mode) => {
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
};

// PayPal API helper functions
export async function getPayPalAccessToken(env) {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  const mode = env.PAYPAL_MODE || 'live';

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(`${PAYPAL_BASE_URL(mode)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(accessToken, orderData, mode = 'live') {
  // Compute item total to satisfy PayPal's validation requirements
  const currency = orderData.currency || 'USD';
  const itemTotal = orderData.items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + (qty * price);
  }, 0);

  const response = await fetch(`${PAYPAL_BASE_URL(mode)}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: Number(orderData.totalAmount || itemTotal).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: itemTotal.toFixed(2)
            }
          }
        },
        items: orderData.items.map(item => ({
          name: item.name,
          description: item.description,
          quantity: (item.quantity || 0).toString(),
          unit_amount: {
            currency_code: currency,
            value: Number(item.price || 0).toFixed(2)
          }
        }))
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal order creation failed: ${error}`);
  }

  return await response.json();
}

export async function capturePayPalOrder(accessToken, orderId, mode = 'live') {
  const response = await fetch(`${PAYPAL_BASE_URL(mode)}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal capture failed: ${error}`);
  }

  return await response.json();
}

// Create PayPal order for credit purchase
export async function createCreditPurchaseOrder(env, userId, creditAmount, price) {
  try {
    const accessToken = await getPayPalAccessToken(env);
    const mode = env.PAYPAL_MODE || 'live';

    const orderData = {
      currency: 'USD',
      totalAmount: price,
      items: [{
        name: `${creditAmount} AI Generation Credits`,
        description: `Purchase ${creditAmount} credits for AI pet portrait generation`,
        quantity: 1,
        price: price
      }]
    };

    const paypalOrder = await createPayPalOrder(accessToken, orderData, mode);

    // Store order information in database
    const orderId = paypalOrder.id;
    await env.DB.prepare(
      'INSERT INTO payments (id, user_id, paypal_order_id, amount, currency, credits_purchased, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      orderId,
      userId,
      orderId,
      price,
      'USD',
      creditAmount,
      'pending'
    ).run();

    return {
      orderId,
      paypalOrderId: paypalOrder.id,
      status: 'created'
    };
  } catch (error) {
    console.error('PayPal order creation error:', error);
    throw error;
  }
}

// Capture PayPal payment and update user credits
export async function captureCreditPurchase(env, orderId) {
  try {
    const accessToken = await getPayPalAccessToken(env);
    const mode = env.PAYPAL_MODE || 'live';

    const captureResult = await capturePayPalOrder(accessToken, orderId, mode);

    if (captureResult.status === 'COMPLETED') {
      // Update payment status and add credits to user
      const payment = await env.DB.prepare('SELECT * FROM payments WHERE paypal_order_id = ?').bind(orderId).first();

      if (payment) {
        // Update payment status
        await env.DB.prepare('UPDATE payments SET status = ? WHERE paypal_order_id = ?')
          .bind('completed', orderId).run();

        // Add credits to user
        const user = await env.DB.prepare('SELECT credits FROM users WHERE id = ?').bind(payment.user_id).first();
        const newCredits = (user?.credits || 0) + payment.credits_purchased;

        await env.DB.prepare('UPDATE users SET credits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(newCredits, payment.user_id).run();

        // Log analytics event
        await env.DB.prepare(
          'INSERT INTO analytics (event_type, user_id, data, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind('credit_purchase', payment.user_id, JSON.stringify({
          paypal_order_id: orderId,
          credits_purchased: payment.credits_purchased,
          amount: payment.amount
        })).run();

        return {
          success: true,
          creditsAdded: payment.credits_purchased,
          newCreditBalance: newCredits
        };
      }
    }

    return { success: false, error: 'Payment capture failed' };
  } catch (error) {
    console.error('PayPal capture error:', error);
    throw error;
  }
}
