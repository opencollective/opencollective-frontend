import React from 'react';
import { defineMessage, FormattedMessage } from 'react-intl';

import NextIllustration from '../components/collectives/HomeNextIllustration';
import { MainDescription } from '../components/marketing/Text';
import Page from '../components/Page';
import Features from '@/components/home/solutions/Features';
import { JoinCTAButtons } from '@/components/home/solutions/JoinCTAButtons';
import Testimonials from '@/components/home/solutions/Testimonials';
import Image from '@/components/Image';

const featureHighlights = [
  {
    imgSrc: '/static/images/product/participatory.png',
    title: defineMessage({
      defaultMessage: 'Participatory Finances',
      id: 'solutions.features.participatoryFinances',
    }),
    description: defineMessage({
      defaultMessage:
        'Empower your people and teams to manage their finances using our simplified and approachable financial tools.',
      id: 'solutions.features.participatoryFinances.description',
    }),
  },
  {
    imgSrc: '/static/images/product/expenses.png',
    title: defineMessage({
      defaultMessage: 'Expense Processing',
      id: 'solutions.features.expenseProcessing',
    }),
    description: defineMessage({
      defaultMessage: 'Process payment requests, pay invoices and reimbursements using automated integrations.',
      id: 'solutions.features.expenseProcessing.description',
    }),
  },
  {
    imgSrc: '/static/images/product/crowdfunding.png',
    title: defineMessage({
      defaultMessage: 'Crowdfunding',
      id: 'solutions.features.crowdfunding',
    }),
    description: defineMessage({
      defaultMessage: 'Launch campaigns to raise support for both one-time and continuously funded projects.',
      id: 'solutions.features.crowdfunding.description',
    }),
  },
  {
    imgSrc: '/static/images/product/ledger.png',
    title: defineMessage({
      defaultMessage: 'Real Time Balances',
      id: 'solutions.features.realTimeBalances',
    }),
    description: defineMessage({
      defaultMessage: 'Keep track of balances, income and spending using up to the minute balances.',
      id: 'solutions.features.realTimeBalances.description',
    }),
  },
  {
    imgSrc: '/static/images/product/transparency.png',
    title: defineMessage({
      defaultMessage: 'Transparency',
      id: 'becomeASponsor.transparency',
    }),
    description: defineMessage({
      defaultMessage: 'Communicate your finances, transactions and real-time balances to your community.',
      id: 'solutions.features.transparency.description',
    }),
  },
  {
    id: 'hosting',
    imgSrc: '/static/images/product/hosting.png',
    title: defineMessage({
      defaultMessage: 'Hosting',
      id: 'DkzeEN',
    }),
    description: defineMessage({
      defaultMessage: 'Provide a fiscal umbrella by safely managing the money of unincorporated groups.',
      id: 'solutions.features.hosting.description',
    }),
  },
];

const Solutions = () => {
  return (
    <Page>
      <div className="mt-20 flex items-center justify-center px-4">
        <div className="flex max-w-6xl flex-col items-center">
          <div>
            <h1 className="text-center text-5xl font-bold tracking-tight text-balance text-oc sm:text-6xl md:text-7xl md:font-extrabold">
              <FormattedMessage defaultMessage="Collaborative Finances for Organizations" id="solutions.hero.title" />
            </h1>
          </div>
          <div className="my-4 max-w-4xl sm:my-8">
            <MainDescription textAlign="center">
              <FormattedMessage
                defaultMessage="Foundations, Non-Profits, Companies, Public Sector and Co-ops"
                id="solutions.hero.subtitle"
              />
            </MainDescription>
          </div>

          <JoinCTAButtons onPage="solutions" />

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

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {featureHighlights.map(feature => {
            return (
              <div key={feature.title.id} className="flex flex-col items-center text-center">
                <div className="relative mb-2 size-16">
                  <Image src={feature.imgSrc} fill aria-hidden alt="" style={{ height: undefined }} />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  <FormattedMessage {...feature.title} />
                </h3>
                <p className="leading-relaxed text-balance text-gray-600">
                  <FormattedMessage {...feature.description} />
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
      <FloatingJoinCTA isVisible={!isStaticButtonsInView} />
    </Page>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default Solutions;
