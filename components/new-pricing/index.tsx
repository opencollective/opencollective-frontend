import React from 'react';
import { Building, Check, Crown, MessageCircle, Zap } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';

interface PricingTier {
  name: string;
  subtitle: string;
  description: string;
  price: number;
  activeCollectives: number;
  additionalCollectivePrice: string;
  monthlyExpenses: number;
  additionalExpensePrice: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  featuresHeader?: string;
  packages?: PricingPackage[];
}

interface PricingPackage {
  activeCollectives: number;
  monthlyExpenses: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Discover',
    subtitle: 'For new Organizations',
    description: 'Get started, discover the platform and process expenses manually.',
    price: 0,
    activeCollectives: 1,
    additionalCollectivePrice: '$10.00',
    monthlyExpenses: 10,
    additionalExpensePrice: '$1.00',
    icon: Zap,
    featuresHeader: 'Features:',
    features: [
      'Crowdfunding pages',
      'Basic expense management',
      'Manual expense processing',
      'Community management tools',
    ],
    packages: [
      { activeCollectives: 1, monthlyExpenses: 10, monthlyPrice: 0, yearlyPrice: 0 },
      { activeCollectives: 2, monthlyExpenses: 20, monthlyPrice: 10, yearlyPrice: 100 },
      { activeCollectives: 3, monthlyExpenses: 30, monthlyPrice: 20, yearlyPrice: 200 },
    ],
  },
  {
    name: 'Basic',
    subtitle: 'For growing Organizations',
    description: 'Scale expense management with automated payouts and advanced categorization.',
    price: 130,
    activeCollectives: 10,
    additionalCollectivePrice: '$15.00',
    monthlyExpenses: 100,
    additionalExpensePrice: '$1.50',
    icon: Crown,
    featuresHeader: 'Everything in Discover plus:',
    features: ['Payouts with Wise', 'Payouts with PayPal', 'Chart of Accounts', 'Advanced expense categorization'],
    packages: [
      { activeCollectives: 5, monthlyExpenses: 50, monthlyPrice: 50, yearlyPrice: 500 },
      { activeCollectives: 10, monthlyExpenses: 100, monthlyPrice: 130, yearlyPrice: 1300 },
      { activeCollectives: 20, monthlyExpenses: 200, monthlyPrice: 150, yearlyPrice: 1500 },
      { activeCollectives: 50, monthlyExpenses: 500, monthlyPrice: 350, yearlyPrice: 3500 },
      { activeCollectives: 100, monthlyExpenses: 1000, monthlyPrice: 600, yearlyPrice: 6000 },
    ],
  },
  {
    name: 'Pro',
    subtitle: 'For professional Organizations',
    description: 'Increase legal compliance and accounting reconciliation with our most advanced features.',
    price: 400,
    activeCollectives: 20,
    additionalCollectivePrice: '$20.00',
    monthlyExpenses: 200,
    additionalExpensePrice: '$2.00',
    icon: Building,
    featuresHeader: 'Everything in Basic plus:',
    features: ['Tax Forms', 'Bank account synchronization', 'Advanced compliance tools', 'Enhanced reporting'],
    packages: [
      { activeCollectives: 20, monthlyExpenses: 200, monthlyPrice: 400, yearlyPrice: 4000 },
      { activeCollectives: 30, monthlyExpenses: 300, monthlyPrice: 600, yearlyPrice: 6000 },
      { activeCollectives: 50, monthlyExpenses: 500, monthlyPrice: 900, yearlyPrice: 9000 },
      { activeCollectives: 100, monthlyExpenses: 1000, monthlyPrice: 1500, yearlyPrice: 15000 },
      { activeCollectives: 200, monthlyExpenses: 2000, monthlyPrice: 2500, yearlyPrice: 25000 },
    ],
  },
];

export default function Pricing() {
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
          {pricingTiers.map(tier => {
            const IconComponent = tier.icon;
            return (
              <div key={tier.name} className={`relative rounded-2xl border border-border bg-background p-8 shadow-sm`}>
                {/* Icon */}
                <div className="flex flex-col items-center text-center text-balance">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <IconComponent className="h-6 w-6 text-muted-foreground" />
                  </div>

                  {/* Tier Info */}
                  <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                  <p className="mt-2 text-sm font-medium text-blue-600">{tier.subtitle}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>

                  {/* Price */}
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-slate-900">${tier.price}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>

                {/* Pricing Summary Box */}
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Active collectives included</span>
                      <span className="font-medium text-slate-900">{tier.activeCollectives}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Price per additional collective</span>
                      <span className="font-medium text-slate-900">{tier.additionalCollectivePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Monthly expenses included</span>
                      <span className="font-medium text-slate-900">{tier.monthlyExpenses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Price per additional expense</span>
                      <span className="font-medium text-slate-900">{tier.additionalExpensePrice}</span>
                    </div>
                  </div>

                  {tier.packages ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="mt-4 w-full rounded-full">
                          See more plans
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{tier.name} Packages</DialogTitle>
                          <DialogDescription>
                            Choose the perfect package for your organization's needs.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="px-4 py-3 text-left font-medium text-foreground">
                                    Active Collectives
                                  </th>
                                  <th className="px-4 py-3 text-left font-medium text-foreground">Monthly Expenses</th>
                                  <th className="px-4 py-3 text-left font-medium text-foreground">Monthly Price</th>
                                  <th className="px-4 py-3 text-left font-medium text-foreground"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {tier.packages.map(pkg => (
                                  <tr
                                    key={`${pkg.activeCollectives}-${pkg.monthlyExpenses}`}
                                    className="border-b border-border hover:bg-muted/50"
                                  >
                                    <td className="px-4 py-3 text-foreground">{pkg.activeCollectives}</td>
                                    <td className="px-4 py-3 text-foreground">{pkg.monthlyExpenses}</td>
                                    <td className="px-4 py-3 text-foreground">${pkg.monthlyPrice}</td>
                                    <td className="px-4 py-3">
                                      <Button variant="outline" size="sm" className="rounded-full">
                                        Select
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
                                <span className="text-muted-foreground">Price per additional collective</span>
                                <span className="font-medium text-foreground">{tier.additionalCollectivePrice}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Price per additional expense</span>
                                <span className="font-medium text-foreground">{tier.additionalExpensePrice}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" className="mt-4 w-full rounded-full">
                      See more plans
                    </Button>
                  )}
                </div>

                {/* Features */}
                <div className="mt-6">
                  {tier.featuresHeader && (
                    <h4 className="mb-3 text-sm font-medium text-slate-700">{tier.featuresHeader}</h4>
                  )}
                  <ul className="space-y-3">
                    {tier.features.map(feature => (
                      <li key={feature} className="flex items-center text-sm">
                        <Check className="mr-3 h-4 w-4 text-green-600" />
                        <span className="text-slate-900">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Button className="mt-6 w-full rounded-full" variant="marketing" size="lg">
                  Start {tier.name}
                </Button>
              </div>
            );
          })}
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
