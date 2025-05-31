'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/utils/supabaseClient';
import type { CreditPackage } from '@/app/api/create-checkout-session/route';

const CREDIT_PACKAGES = [
  {
    id: '10_credits' as CreditPackage,
    credits: 10,
    price: '$9.99',
    popular: false,
  },
  {
    id: '25_credits' as CreditPackage,
    credits: 25,
    price: '$19.99',
    popular: true,
  },
  {
    id: '50_credits' as CreditPackage,
    credits: 50,
    price: '$34.99',
    popular: false,
  },
];

export default function CreditsPage() {
  const { user, session } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
      } else {
        setCredits(data.amount);
      }
    };

    fetchCredits();
  }, [user?.id]);

  const handlePurchase = async (packageId: CreditPackage) => {
    if (!session?.access_token) {
      console.error('No access token available');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ package: packageId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionUrl } = await response.json();
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Purchase Credits</h1>
          <p className="text-muted-foreground">
            You currently have {credits === null ? '...' : credits} credits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`p-6 relative ${
                pkg.popular ? 'border-2 border-primary' : ''
              }`}>
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">
                  {pkg.credits} Credits
                </h3>
                <p className="text-3xl font-bold text-primary mb-4">
                  {pkg.price}
                </p>
                <p className="text-muted-foreground mb-6">
                  $
                  {(Number(pkg.price.replace('$', '')) / pkg.credits).toFixed(
                    2
                  )}{' '}
                  per credit
                </p>
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  className="w-full"
                  disabled={loading}>
                  {loading ? 'Processing...' : 'Purchase Credits'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Credits never expire. Each image generation costs 1 credit.
            Purchases are non-refundable.
          </p>
        </div>
      </div>
    </div>
  );
}
