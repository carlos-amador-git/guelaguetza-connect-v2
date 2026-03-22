// Stripe service stub - payments disabled
// TODO: Implement when ENABLE_PAYMENTS is enabled

export const stripeService = {
  isEnabled(): boolean {
    return false;
  },

  async createPaymentIntent(_params: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    throw new Error('Stripe payments are not enabled');
  },

  async getPaymentStatus(_paymentIntentId: string): Promise<string> {
    return 'disabled';
  },

  async createRefund(_paymentIntentId: string): Promise<void> {
    throw new Error('Stripe payments are not enabled');
  },
};
