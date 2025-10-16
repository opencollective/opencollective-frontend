import React from 'react';
import { FormattedMessage } from 'react-intl';

import Link from '@/components/Link';
import PricingNavTabs from '@/components/new-pricing/NavTabs';
import Page from '@/components/Page';
import { Button } from '@/components/ui/Button';

// next.js export
// ts-unused-exports:disable-next-line
export default function PricingForCollectivesPage() {
  return (
    <Page>
      <PricingNavTabs active="collectives" />
      <div className="min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Pricing for Collectives</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
              <FormattedMessage
                defaultMessage="A Collective is a group of people with a shared purpose that uses the platform to raise and manage money together. Collectives rely on a Host Organization, which holds and pays out their funds. Thanks to Platform Tips, Collectives are essentially free to use the platform. Other fees, like those from Hosts or Payment Processors, may apply."
                id="pricing.collectives.description"
              />
            </p>

            {/* Compact free pricing box */}
            <div className="mx-auto mt-8 w-full">
              <div className="w-full rounded-2xl border bg-slate-50 px-6 py-6 text-center shadow-sm">
                <div className="text-5xl font-extrabold text-slate-900">
                  $0
                  <span className="ml-2 align-middle text-base font-semibold text-slate-700">
                    <FormattedMessage defaultMessage="Free for Collectives" id="pricing.collectives.free" />
                  </span>
                </div>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="No monthly subscription. Collectives can use the platform at no cost."
                    id="pricing.collectives.free.desc"
                  />
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border text-left text-sm">
                    <th className="px-4 py-3 font-medium text-foreground">Fee</th>
                    <th className="px-4 py-3 font-medium text-foreground">Provider</th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      <FormattedMessage defaultMessage="Paid by" id="pricing.table.paidBy" />
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      <FormattedMessage defaultMessage="Typical Amount" id="pricing.table.typicalAmount" />
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {/* Incoming Contributions group */}
                  <tr>
                    <th
                      colSpan={4}
                      className="bg-muted px-4 py-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                      <FormattedMessage defaultMessage="Incoming Contributions" id="IncomingContributions" />
                    </th>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Platform Tips" id="pricing.fee.platformTips" />
                      <div className="text-xs text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="Optional tip paid by contributors on crowdfunded contributions"
                          id="pricing.fee.platformTips.desc"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Platform" id="platform" />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Contributor" id="Contributor" />
                    </td>
                    <td className="px-4 py-3 text-foreground">0% – 15%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Host Fees" id="pricing.fee.hostFees" />
                      <div className="text-xs text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="Fee charged by your fiscal host for admin, compliance, and services."
                          id="pricing.fee.hostFees.desc"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Host" id="Member.Role.HOST" />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Collective" id="Collective" />
                    </td>
                    <td className="px-4 py-3 text-foreground">0% – 10%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage
                        defaultMessage="Payment Processor Fees ({provider})"
                        id="pricing.fee.processor.title"
                        values={{ provider: 'Stripe' }}
                      />
                      <div className="text-xs text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="Charged by {provider} for contributions received by the Collective."
                          id="pricing.fee.processorIncoming.desc"
                          values={{ provider: 'Stripe' }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">Stripe</td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Collective" id="Collective" />
                    </td>
                    <td className="px-4 py-3 text-foreground">2.9% + $0.30</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage
                        defaultMessage="Payment Processor Fees ({provider})"
                        id="pricing.fee.processor.title"
                        values={{ provider: 'PayPal' }}
                      />
                      <div className="text-xs text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="Charged by {provider} for contributions received by the Collective."
                          id="pricing.fee.processorIncoming.desc"
                          values={{ provider: 'PayPal' }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="PayPal" id="PayoutMethod.Type.Paypal" />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Collective" id="Collective" />
                    </td>
                    <td className="px-4 py-3 text-foreground">2.89% + $0.49</td>
                  </tr>

                  {/* Outgoing Contributions group */}
                  <tr>
                    <th
                      colSpan={4}
                      className="bg-muted px-4 py-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                      <FormattedMessage defaultMessage="Outgoing Contributions" id="OutgoingContributions" />
                    </th>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage
                        defaultMessage="Payment Processor Fees ({provider})"
                        id="pricing.fee.processor.title"
                        values={{ provider: 'Wise' }}
                      />
                      <div className="text-xs text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="Charged by {provider} for outgoing payouts."
                          id="pricing.fee.processorOutgoing.desc"
                          values={{ provider: 'Wise' }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">Wise</td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Collective" id="Collective" />
                    </td>
                    <td className="px-4 py-3 text-foreground">$0.25</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage
                        defaultMessage="Payment Processor Fees ({provider})"
                        id="pricing.fee.processor.title"
                        values={{ provider: 'PayPal' }}
                      />
                      <div className="text-xs text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="Charged by {provider} for outgoing payouts."
                          id="pricing.fee.processorOutgoing.desc"
                          values={{ provider: 'PayPal' }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="PayPal" id="PayoutMethod.Type.Paypal" />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <FormattedMessage defaultMessage="Collective" id="Collective" />
                    </td>
                    <td className="px-4 py-3 text-foreground">$0.25</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <Button asChild variant="marketing" className="rounded-full" size="lg">
              <Link href="/create">
                <FormattedMessage defaultMessage="Join As Collective" id="solutions.hero.joinAsCollective" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
