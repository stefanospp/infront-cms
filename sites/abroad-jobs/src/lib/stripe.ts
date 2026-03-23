import Stripe from 'stripe';

export function getStripe(secretKey: string) {
  return new Stripe(secretKey, {
    apiVersion: '2025-04-30.basil',
  });
}

const PRICE_PER_JOB_CENTS = 8900; // €89.00

export function createCheckoutParams(
  jobCount: number,
  sessionId: string,
  siteUrl: string,
): Stripe.Checkout.SessionCreateParams {
  return {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Job Listing on AbroadJobs.eu',
            description: `Post a job to reach international candidates with relocation support`,
          },
          unit_amount: PRICE_PER_JOB_CENTS,
        },
        quantity: jobCount,
      },
    ],
    metadata: {
      session_id: sessionId,
    },
    success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/post`,
  };
}
