import React from 'react';
import { gql } from '@apollo/client';
import { HandCoinsIcon, MessageCircle, ReceiptIcon, ShapesIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import {
  PlatformSubscriptionTiers,
  PlatformSubscriptionTierTitles,
} from '@/components/platform-subscriptions/constants';
import { Button } from '@/components/ui/Button';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { JoinCTAButtons } from '../home/solutions/JoinCTAButtons';
import I18nFormatters from '../I18nFormatters';
import Link from '../Link';
import { PlatformSubscriptionTierCard } from '../platform-subscriptions/ManageSubscriptionModal';
import { Card, CardContent } from '../ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';

export const pricingPageQuery = gql`
  query PlatformSubscriptionTiers {
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
`;

function TierPricePlansDisplay({ tier, packages }) {
  const [selectedPackage, setSelectedPackage] = React.useState(packages?.[0]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const titleMessage = PlatformSubscriptionTierTitles[tier];

  return (
    <div>
      <div className="mt-6 mb-6 space-y-1 text-center">
        <p>
          <span className="text-4xl font-bold text-slate-900">
            <FormattedMoneyAmount
              amount={selectedPackage?.pricing.pricePerMonth.valueInCents}
              currency={selectedPackage?.pricing.pricePerMonth.currency}
              showCurrencyCode={false}
              precision={0}
            />
          </span>
          <span className="text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="/month" id="6t5GFw" />
          </span>
        </p>
      </div>

      <div className="mt-6 mb-6 rounded-lg border bg-slate-50 p-4 text-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <HandCoinsIcon size={24} className="text-slate-800" />
            <div className="space-y-1">
              <p className="font-medium text-slate-900">
                <FormattedMessage defaultMessage="Crowdfunding contributions" id="Pricing-Crowdfunding" />
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-600">
                <FormattedMessage
                  id="Pricing-Crowdfunding-Price"
                  defaultMessage="Free with <PlatformTipsLink>Platform Tips</PlatformTipsLink> activated"
                  values={{
                    PlatformTipsLink: parts => (
                      <Link href="#platform-tips" className="underline">
                        {parts}
                      </Link>
                    ),
                  }}
                />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShapesIcon size={24} className="text-slate-800" />
            <div className="space-y-1">
              <p className="font-medium text-slate-900">
                <FormattedMessage
                  defaultMessage="{count} Active collectives"
                  id="AAWOc+"
                  values={{ count: selectedPackage?.pricing.includedCollectives }}
                />
              </p>
              <p className="text-xs text-slate-600">
                <FormattedMoneyAmount
                  amount={selectedPackage?.pricing.pricePerAdditionalCollective.valueInCents}
                  currency={selectedPackage?.pricing.pricePerAdditionalCollective.currency}
                  showCurrencyCode={false}
                />{' '}
                <FormattedMessage defaultMessage="per additional collective" id="NhdeA6" />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ReceiptIcon size={24} className="text-slate-800" />
            <div className="space-y-1">
              <p className="font-medium text-slate-900">
                <FormattedMessage
                  defaultMessage="{count} Paid expenses monthly"
                  id="SZ0HfS"
                  values={{ count: selectedPackage?.pricing.includedExpensesPerMonth }}
                />
              </p>
              <p className="text-xs text-slate-600">
                <FormattedMoneyAmount
                  amount={selectedPackage?.pricing.pricePerAdditionalExpense.valueInCents}
                  currency={selectedPackage?.pricing.pricePerAdditionalExpense.currency}
                  showCurrencyCode={false}
                />{' '}
                <FormattedMessage defaultMessage="per additional expense" id="j8oKWe" />
              </p>
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-4 w-full rounded-full">
              <FormattedMessage defaultMessage="See more plans" id="M/MOBU" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl" onOpenAutoFocus={e => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>
                <FormattedMessage
                  defaultMessage="{tierName} Plans"
                  id="wW6jUC"
                  values={{ tierName: <FormattedMessage {...titleMessage} /> }}
                />
              </DialogTitle>
              <DialogDescription>
                <FormattedMessage defaultMessage="Choose the perfect plan for your organization's needs." id="z6QtJg" />
              </DialogDescription>
            </DialogHeader>
            <div className="">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border text-sm">
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        <FormattedMessage defaultMessage="Active Collectives" id="b4gw3f" />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        <FormattedMessage defaultMessage="Monthly Expenses" id="PduKvv" />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        <FormattedMessage defaultMessage="Monthly Price" id="BYbiJx" />
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages?.map(pkg => (
                      <tr key={pkg.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3 text-foreground">{pkg.pricing.includedCollectives}</td>
                        <td className="px-4 py-3 text-foreground">{pkg.pricing.includedExpensesPerMonth}</td>
                        <td className="px-4 py-3 text-foreground">
                          <FormattedMoneyAmount
                            amount={pkg.pricing.pricePerMonth.valueInCents}
                            currency={pkg.pricing.pricePerMonth.currency}
                            showCurrencyCode={false}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant={selectedPackage.id === pkg.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setIsDialogOpen(false);
                            }}
                            className="min-w-[80px]"
                          >
                            {selectedPackage.id === pkg.id ? (
                              <FormattedMessage defaultMessage="Selected" id="byP6IC" />
                            ) : (
                              <FormattedMessage defaultMessage="Select" id="kQAf2d" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 rounded-lg bg-muted p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      <FormattedMessage defaultMessage="Price per additional collective" id="XiljWt" />
                    </span>
                    <span className="font-medium text-foreground">
                      <FormattedMoneyAmount
                        amount={selectedPackage?.pricing.pricePerAdditionalCollective.valueInCents}
                        currency={selectedPackage?.pricing.pricePerAdditionalCollective.currency}
                        showCurrencyCode={false}
                      />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      <FormattedMessage defaultMessage="Price per additional expense" id="C5odKt" />
                    </span>
                    <span className="font-medium text-foreground">
                      <FormattedMoneyAmount
                        amount={selectedPackage?.pricing.pricePerAdditionalExpense.valueInCents}
                        currency={selectedPackage?.pricing.pricePerAdditionalExpense.currency}
                        showCurrencyCode={false}
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function Pricing({ data }) {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-center justify-center">
          <div className="rounded-full bg-blue-50 px-6 py-3 text-sm text-blue-800">
            <span>
              <FormattedMessage
                defaultMessage="We've updated our platform pricing to support our long-term sustainability. <LinkLegacyPricing>View legacy pricing</LinkLegacyPricing>."
                id="pricing.newModel.onNewPricing"
                values={{
                  LinkLegacyPricing: parts => (
                    <Link href="/pricing" className="font-medium underline hover:text-blue-900">
                      {parts}
                    </Link>
                  ),
                }}
              />
            </span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <FormattedMessage defaultMessage="Pricing for Organizations" id="Pricing-forOrganizations" />
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
            <FormattedMessage
              defaultMessage="An Organization is a legal entity (such as a company, non-profit, cooperative, or similar) that uses the platform to manage its own finances or to act as a Host for Collectives. The pricing below applies to Organizations. Collectives are not subject to this pricing structure."
              id="Pricing-OrgDefinition"
            />
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {PlatformSubscriptionTiers.map(tier => (
            <Card key={tier}>
              <CardContent>
                <PlatformSubscriptionTierCard key={tier} tier={tier}>
                  <TierPricePlansDisplay
                    tier={tier}
                    packages={data?.platformSubscriptionTiers.filter(plan => plan.type === tier)}
                  />
                </PlatformSubscriptionTierCard>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <JoinCTAButtons onPage="pricing" />
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-24 max-w-3xl px-4">
          <h2 className="mb-6 text-center text-3xl font-semibold">
            <FormattedMessage defaultMessage="FAQ" id="FAQ" />
          </h2>
          <div className="divide-y rounded-lg border">
            <div className="p-6">
              <h3 className="mb-2 text-xl font-medium text-foreground">
                <FormattedMessage
                  defaultMessage="Who manages the platform and how is the pricing set?"
                  id="pricing.new.faq.governance.question"
                />
              </h3>
              <p className="text-muted-foreground">
                <FormattedMessage
                  defaultMessage="Since October 2024, the platform is managed by {oficoLink} (OFiCo), a non-profit members-based organization. Pricing is set by OFiCo's <MembersLink>members</MembersLink>, who are also its main users, and is aimed at ensuring the platform's long-term sustainability. It is structured to scale with your needs, whether you're serving a single organization or an entire network of collectives."
                  id="8/YzW7"
                  values={{
                    oficoLink: (
                      <a href="https://oficonsortium.org" className="underline" target="_blank">
                        OFi Consortium
                      </a>
                    ),
                    MembersLink: parts => (
                      <a href="https://oficonsortium.org/#members" className="underline" target="_blank">
                        {parts}
                      </a>
                    ),
                  }}
                />
              </p>
            </div>

            <div className="p-6" id="platform-tips">
              <h3 className="mb-2 text-xl font-medium text-foreground">
                <FormattedMessage defaultMessage="What are Platform Tips?" id="pricing.new.faq.tips.question" />
              </h3>
              <div className="text-muted-foreground">
                <FormattedMessage
                  defaultMessage="<p><strong>Platform Tips</strong> are optional contributions that financial contributors can add when they contribute on the platform. These tips support the <strong>Open Collective Platform</strong>, and they help ensure that we can keep the core service available at no cost to Collectives. Tips do not reduce the amount your <strong>Organization</strong> or the <strong>Collectives</strong> you host receive, because they are added on top of the intended support.</p><p>If you prefer a more traditional pricing model, you can opt for a simple <strong>5% platform fee</strong> instead of tips. This removes tips from the contribution flow and applies a fixed fee to incoming funds. If that sounds better for you, please contact us and we will switch you over.</p>"
                  id="pricing.new.faq.tips.answer"
                  values={I18nFormatters}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-50 p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>

          <h3 className="mb-4 text-2xl font-bold text-slate-900">
            <FormattedMessage defaultMessage="Custom Pricing" id="/Xwpkv" />
          </h3>

          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            <FormattedMessage
              defaultMessage="Contact us for yearly plans, and customized plans tailored to fit your needs."
              id="xqUnjO"
            />
          </p>

          <Button className="rounded-full" variant="marketing" size="lg">
            <FormattedMessage defaultMessage="Contact Us" id="hZOGLS" />
          </Button>
        </div>
      </div>
    </div>
  );
}
