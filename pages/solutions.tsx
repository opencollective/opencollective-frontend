import React from 'react';
import { ArrowRight, Eye, FileText, Home, PieChart, Users } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import NextIllustration from '../components/collectives/HomeNextIllustration';
import { MainDescription } from '../components/marketing/Text';
import Page from '../components/Page';
import Features from '@/components/home/solutions/Features';
import Testimonials from '@/components/home/solutions/Testimonials';
import Link from '@/components/Link';
import { Button } from '@/components/ui/Button';

const messages = defineMessages({
  defaultTitle: {
    defaultMessage: 'Collaborative Finances for Organizations',
    id: 'solutions.hero.title',
  },
  defaultDescription: {
    defaultMessage:
      "Open Collective is a legal and financial toolbox for groups. It's a fundraising + legal status + money management platform for your community. What do you want to do?",
    id: 'LrBotK',
  },
  heroTitle: {
    defaultMessage: 'Collaborative Finances for Organizations',
    id: 'solutions.hero.title',
  },
  heroSubtitle: {
    defaultMessage: 'Foundations, Non-Profits, Companies, Public Sector and Co-ops',
    id: 'solutions.hero.subtitle',
  },
  joinAsOrg: {
    defaultMessage: 'Join As Organization',
    id: 'solutions.hero.joinAsOrg',
  },
  seePricing: {
    defaultMessage: 'See Pricing',
    id: 'solutions.hero.seePricing',
  },
  participatoryFinances: {
    defaultMessage: 'Participatory Finances',
    id: 'solutions.features.participatoryFinances',
  },
  participatoryFinancesDesc: {
    defaultMessage:
      'Empower people and teams to manage their finances using our simplified and approachable financial tools.',
    id: 'solutions.features.participatoryFinances.description',
  },
  expenseProcessing: {
    defaultMessage: 'Expense Processing',
    id: 'solutions.features.expenseProcessing',
  },
  expenseProcessingDesc: {
    defaultMessage: 'Process payment requests, pay invoices and reimbursements using automated integrations.',
    id: 'solutions.features.expenseProcessing.description',
  },
  crowdfunding: {
    defaultMessage: 'Crowdfunding',
    id: 'solutions.features.crowdfunding',
  },
  crowdfundingDesc: {
    defaultMessage:
      'Launch crowdfunding campaigns to raise support for both one-time and continuously funded projects.',
    id: 'solutions.features.crowdfunding.description',
  },
  realTimeBalances: {
    defaultMessage: 'Real Time Balances',
    id: 'solutions.features.realTimeBalances',
  },
  realTimeBalancesDesc: {
    defaultMessage:
      'Keep track of balances, income and spending using up to the minute balances based on our internal transactions.',
    id: 'solutions.features.realTimeBalances.description',
  },
  transparency: {
    defaultMessage: 'Transparency',
    id: 'solutions.features.transparency',
  },
  transparencyDesc: {
    defaultMessage: 'Communicate your finances, transactions and real-time balances to your community.',
    id: 'solutions.features.transparency.description',
  },
  hosting: {
    defaultMessage: 'Hosting',
    id: 'solutions.features.hosting',
  },
  hostingDesc: {
    defaultMessage: 'Provide a fiscal umbrella by safely managing their funds under one organization.',
    id: 'solutions.features.hosting.description',
  },
});

const features = [
  {
    id: 'participatoryFinances',
    icon: Users,
    iconColor: 'text-yellow-500',
    title: 'participatoryFinances',
    description: 'participatoryFinancesDesc',
  },
  {
    id: 'expenseProcessing',
    icon: FileText,
    iconColor: 'text-green-500',
    title: 'expenseProcessing',
    description: 'expenseProcessingDesc',
  },
  {
    id: 'crowdfunding',
    icon: Users,
    iconColor: 'text-pink-500',
    title: 'crowdfunding',
    description: 'crowdfundingDesc',
  },
  {
    id: 'realTimeBalances',
    icon: PieChart,
    iconColor: 'text-green-500',
    title: 'realTimeBalances',
    description: 'realTimeBalancesDesc',
  },
  {
    id: 'transparency',
    icon: Eye,
    iconColor: 'text-blue-500',
    title: 'transparency',
    description: 'transparencyDesc',
  },
  {
    id: 'hosting',
    icon: Home,
    iconColor: 'text-pink-500',
    title: 'hosting',
    description: 'hostingDesc',
  },
];

const Solutions = () => {
  const { formatMessage } = useIntl();

  return (
    <Page
      metaTitle={formatMessage(messages.defaultTitle)}
      title={formatMessage(messages.defaultTitle)}
      description={formatMessage(messages.defaultDescription)}
    >
      {/* Hero Section */}
      <div className="mt-20 flex items-center justify-center px-4">
        <div className="flex max-w-6xl flex-col items-center">
          <div>
            <h1 className="text-center text-5xl font-bold tracking-tight text-balance text-oc sm:text-6xl md:text-7xl md:font-extrabold">
              <FormattedMessage {...messages.heroTitle} />
            </h1>
          </div>
          <div className="my-4 max-w-4xl sm:my-8">
            <MainDescription textAlign="center">
              <FormattedMessage {...messages.heroSubtitle} />
            </MainDescription>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Button asChild variant="marketing" className="rounded-full" size="lg">
              <Link href="/signup/organization">
                <FormattedMessage {...messages.joinAsOrg} />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full" size="lg">
              <Link href="/pricing" className="flex items-center gap-2">
                <FormattedMessage {...messages.seePricing} />
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>

          {/* Central Illustration */}
          <div className="mt-4 mb-4">
            <NextIllustration
              display="block"
              width={1035}
              height={1035}
              className="-my-10 h-[512px] w-[512px] overflow-hidden"
              alt="Organizations illustration"
              src="/static/images/birds.png"
            />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => {
            const IconComponent = feature.icon;
            return (
              <div key={feature.id} className="flex flex-col items-center text-center">
                <div className={`mb-4 rounded-lg bg-gray-50 p-3 ${feature.iconColor}`}>
                  <IconComponent className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  <FormattedMessage {...messages[feature.title]} />
                </h3>
                <p className="leading-relaxed text-balance text-gray-600">
                  <FormattedMessage {...messages[feature.description]} />
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-1 justify-center">
        <div className="max-w-7xl flex-1">
          <Features />
        </div>
      </div>
      <Testimonials />
    </Page>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default Solutions;
