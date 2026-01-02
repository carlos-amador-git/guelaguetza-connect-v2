import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not set - payment features will be disabled');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' })
  : null;

export class StripeService {
  private static instance: StripeService;

  private constructor() {}

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  isEnabled(): boolean {
    return stripe !== null;
  }

  // Create a payment intent for orders/bookings
  async createPaymentIntent(params: {
    amount: number; // in cents
    currency?: string;
    metadata?: Record<string, string>;
    description?: string;
  }): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
    if (!stripe) {
      console.warn('Stripe not configured - returning mock payment');
      return {
        clientSecret: 'mock_client_secret',
        paymentIntentId: 'mock_pi_' + Date.now(),
      };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency || 'mxn',
      metadata: params.metadata,
      description: params.description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  // Confirm payment status
  async getPaymentStatus(paymentIntentId: string): Promise<string> {
    if (!stripe) {
      return 'succeeded'; // Mock for development
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status;
  }

  // Cancel a payment intent
  async cancelPaymentIntent(paymentIntentId: string): Promise<boolean> {
    if (!stripe) {
      return true;
    }

    try {
      await stripe.paymentIntents.cancel(paymentIntentId);
      return true;
    } catch {
      return false;
    }
  }

  // Refund a payment
  async createRefund(paymentIntentId: string, amount?: number): Promise<boolean> {
    if (!stripe) {
      return true;
    }

    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount, // If undefined, refunds full amount
      });
      return true;
    } catch {
      return false;
    }
  }

  // Create connected account for sellers (Marketplace)
  async createConnectedAccount(email: string): Promise<string | null> {
    if (!stripe) {
      return 'mock_acct_' + Date.now();
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'MX',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    return account.id;
  }

  // Create account link for seller onboarding
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<string | null> {
    if (!stripe) {
      return returnUrl;
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  // Construct webhook event
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event | null {
    if (!stripe) {
      return null;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

export const stripeService = StripeService.getInstance();
