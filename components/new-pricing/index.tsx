import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { MessageCircle } from 'lucide-react';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type {
  PlatformSubscriptionFormQuery,
  PlatformSubscriptionFormQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import { PlatformSubscriptionTiers } from '@/components/platform-subscriptions/constants';
import { Button } from '@/components/ui/Button';

import { PlatformSubscriptionTierCard } from '../platform-subscriptions/ManageSubscriptionModal';
import { Card, CardContent } from '../ui/Card';

export default function Pricing() {
  const query = useQuery<PlatformSubscriptionFormQuery, PlatformSubscriptionFormQueryVariables>(
    gql`
      query PlatformSubscriptionForm {
        platformSubscriptionTiers {
          id
          title
          type
          pricing {
            pricePerMonth {
              valueInCents
              currency
            }
            pricePerAdditionalCollective {
              valueInCents
              currency
            }
            pricePerAdditionalExpense {
              valueInCents
              currency
            }
            includedCollectives
            includedExpensesPerMonth
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Platform Pricing</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
            The platform is managed by{' '}
            <a href="https://oficonsortium.org" className="underline" target="_blank">
              OFiCo
            </a>
            , a non-profit organization. Pricing is set by its{' '}
            <a href="https://oficonsortium.org/#members" className="underline" target="_blank">
              members
            </a>{' '}
            - who are also its main users - and is aimed at ensuring the platform's long-term sustainability. It is
            structured to scale with your needs, whether you’re serving a single organization or an entire network of
            collectives.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {PlatformSubscriptionTiers.map(tier => (
            <Card>
              <CardContent>
                <PlatformSubscriptionTierCard
                  key={tier}
                  tier={tier}
                  includePrice
                  packages={query.data?.platformSubscriptionTiers.filter(plan => plan.type === tier)}
                  includePackageDetails
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-24 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-50 p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>

          <h3 className="mb-4 text-2xl font-bold text-slate-900">Custom Pricing</h3>

          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            Contact us for yearly plans, and customized plans tailored to fit your needs.
          </p>

          <Button className="rounded-full" variant="marketing" size="lg">
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}
