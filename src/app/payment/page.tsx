'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Starter',
    price: 9.99,
    features: [
      '50 images per month',
      'Basic image resolution',
      'Standard support',
      'Access to basic models',
    ],
    recommended: false,
  },
  {
    name: 'Pro',
    price: 19.99,
    features: [
      '200 images per month',
      'HD image resolution',
      'Priority support',
      'Access to all models',
      'Custom negative prompts',
    ],
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: 49.99,
    features: [
      'Unlimited images',
      '4K image resolution',
      '24/7 Premium support',
      'Custom model training',
      'API access',
      'Bulk generation',
    ],
    recommended: false,
  },
];

export default function Payment() {
  const [selectedPlan] = useState(1); // Pro plan default
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planIndex: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: plans[planIndex].name }),
      });

      const { sessionUrl } = await response.json();
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="mt-4 text-lg text-gray-600">
          Select the perfect plan for your creative needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <Card
            key={plan.name}
            className={`p-6 flex flex-col ${
              plan.recommended ? 'border-2 border-blue-500 relative' : ''
            }`}>
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm rounded-bl-lg rounded-tr-lg">
                Recommended
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>

            <ul className="mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center mb-3">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSubscribe(index)}
              disabled={loading}
              variant={plan.recommended ? 'default' : 'outline'}
              className="w-full">
              {loading && selectedPlan === index
                ? 'Processing...'
                : `Subscribe to ${plan.name}`}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        <p>All plans include a 14-day money-back guarantee</p>
        <p className="mt-2">
          Need a custom plan?{' '}
          <a
            href="mailto:support@intellipic.com"
            className="text-blue-600 hover:text-blue-500">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
