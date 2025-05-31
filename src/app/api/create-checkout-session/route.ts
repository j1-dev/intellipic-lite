import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil', // Use the latest API version
});

const CREDIT_PRICES = {
  '10_credits': {
    priceId: 'price_1RUuAWIsZGNqsWfQtC1vSbCd', // Replace with your actual Stripe price ID
    credits: 10,
    displayPrice: '$9.99',
  },
  '25_credits': {
    priceId: 'price_1RUuAwIsZGNqsWfQeHbG6NuL', // Replace with your actual Stripe price ID
    credits: 25,
    displayPrice: '$19.99',
  },
  '50_credits': {
    priceId: 'price_1RUuBJIsZGNqsWfQ4Phz5IiM', // Replace with your actual Stripe price ID
    credits: 50,
    displayPrice: '$34.99',
  },
} as const;

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type CreditPackage = keyof typeof CREDIT_PRICES;

export async function POST(request: NextRequest) {
  try {
    // Get the JWT token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - No Bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token and get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed: ' + authError?.message },
        { status: 401 }
      );
    }

    const { package: creditPackage } = await request.json();
    const packageDetails = CREDIT_PRICES[creditPackage as CreditPackage];

    if (!packageDetails) {
      return NextResponse.json(
        { error: 'Invalid credit package selected' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: packageDetails.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        credits: packageDetails.credits.toString(),
      },
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/dashboard?payment=success`,
      cancel_url: `${request.headers.get('origin')}/credits`,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ sessionUrl: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
