import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil', // Use the latest API version
});

const PLAN_PRICES = {
  Starter: 'price_H5j2X9iK8Mn3Lp', // Replace with your actual Stripe price IDs
  Pro: 'price_J7k4Y2mN5Pq8Rs',
  Enterprise: 'price_L9n6Z4xQ7Vt1Uw',
};

export async function POST(request: Request) {
  try {
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();
    const priceId = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get(
        'origin'
      )}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/payment`,
      automatic_tax: { enabled: true },
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
