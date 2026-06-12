import paypal from '@paypal/checkout-server-sdk';

// PayPal environment
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const mode = process.env.NEXT_PUBLIC_PAYPAL_MODE || 'sandbox';

  if (mode === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

// PayPal client
export function paypalClient() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Create PayPal order
export async function createPayPalOrder({
  planId,
  userId,
}: {
  planId: string;
  userId: string;
}) {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: userId,
          description: `Subscription Plan: ${planId}`,
          custom_id: userId,
          amount: {
            currency_code: 'USD',
            value: getPriceForPlan(planId),
          },
        },
      ],
      application_context: {
        brand_name: 'SaaS Template',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/capture`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      },
    });

    const response = await paypalClient().execute(request);
    return {
      orderId: response.result.id,
      approvalUrl: response.result.links?.find((link: any) => link.rel === 'approve')?.href,
    };
  } catch (error) {
    console.error('PayPal create order error:', error);
    throw error;
  }
}

// Capture PayPal order
export async function capturePayPalOrder(orderId: string) {
  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const response = await paypalClient().execute(request);

    // Log the full response for debugging
    console.log('PayPal capture response:', JSON.stringify(response.result, null, 2));

    return response.result;
  } catch (error) {
    console.error('PayPal capture order error:', error);
    throw error;
  }
}

// Helper to get price for plan
function getPriceForPlan(planId: string): string {
  if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_BASIC) return '29.00';
  if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO) return '99.00';
  if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE) return '299.00';
  return '0.00';
}

// Helper to get plan name from plan ID
export function getPlanFromPayPalId(planId: string): 'basic' | 'pro' | 'enterprise' | 'free' {
  if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_BASIC) return 'basic';
  if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO) return 'pro';
  if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE) return 'enterprise';
  return 'free';
}
