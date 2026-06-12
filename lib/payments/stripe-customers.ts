import { stripe } from './stripe';

/**
 * Create or retrieve a Stripe customer
 * Searches for existing customer by email, creates new one if not found
 */
export async function createOrGetCustomer(
  email: string,
  name: string,
  userId: string
) {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return customer;
  } catch (error) {
    console.error('Stripe customer error:', error);
    throw error;
  }
}

/**
 * Attach a payment method to a customer and set it as default
 */
export async function attachPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  try {
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return true;
  } catch (error) {
    console.error('Stripe attach payment method error:', error);
    throw error;
  }
}

/**
 * List all payment methods for a customer
 */
export async function listCustomerPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error) {
    console.error('Stripe list payment methods error:', error);
    throw error;
  }
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(paymentMethodId: string) {
  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    return true;
  } catch (error) {
    console.error('Stripe detach payment method error:', error);
    throw error;
  }
}

/**
 * Update customer information
 */
export async function updateCustomer(
  customerId: string,
  data: {
    email?: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }
) {
  try {
    const customer = await stripe.customers.update(customerId, data);
    return customer;
  } catch (error) {
    console.error('Stripe update customer error:', error);
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Stripe get customer error:', error);
    throw error;
  }
}
