import React from 'react';
import Image from 'next/image';
import { defineMessages, useIntl } from 'react-intl';

// Hardcoded stats from 2025-09-03, based on host's with "isTrustedHost"=true
// `plus` marks lower bounds ("10K+"). Values are formatted with the page locale.
const stats = {
  organizations: { value: 41 },
  collectives: { value: 10_000, plus: true },
  moneyManaged: { value: 40_000_000, currency: 'USD' },
  expensesPaid: { value: 116_000, plus: true },
  contributionsReceived: { value: 1_000_000, plus: true },
  transactionsRecorded: { value: 6_000_000, plus: true },
};
const messages = defineMessages({
  title: {
    defaultMessage: 'Our Impact, By the Numbers',
    id: 'Stats.title',
  },
  organizations: {
    defaultMessage: 'Organizations',
    id: 'TopContributors.Organizations',
  },
  collectives: {
    defaultMessage: 'Collectives',
    id: 'Collectives',
  },
  moneyManaged: {
    defaultMessage: 'Money Managed',
    id: 'Stats.moneyManaged',
  },
  expensesPaid: {
    defaultMessage: 'Expenses Paid',
    id: 'Stats.expensesPaid',
  },
  contributionsReceived: {
    defaultMessage: 'Contributions Received',
    id: 'Stats.contributionsReceived',
  },
  transactionsRecorded: {
    defaultMessage: 'Transactions Recorded',
    id: 'Stats.transactionsRecorded',
  },
});

const Stats = () => {
  const { formatMessage, formatNumber } = useIntl();
  const formatStat = ({ value, plus, currency }: { value: number; plus?: boolean; currency?: string }) => {
    const formatted = formatNumber(value, {
      notation: 'compact',
      maximumSignificantDigits: 3,
      ...(currency && { style: 'currency', currency }),
    });
    return plus ? `${formatted}+` : formatted;
  };

  return (
    <section className="px-4 pt-4 pb-8 sm:pb-12 lg:pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {/* Background Image with 40% opacity */}
          <div className="absolute -inset-20 z-0">
            <Image
              src="/static/images/green-watercolor-bg.png"
              alt=""
              fill
              className="object-cover opacity-40"
              priority
            />
          </div>

          {/* Content with relative positioning to appear above background */}
          <div className="relative z-10">
            <h2 className="mb-6 text-center text-2xl font-semibold text-slate-700 sm:mb-8 sm:text-3xl lg:mb-10 lg:text-[2rem]">
              {formatMessage(messages.title)}
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {/* Top Row */}
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {formatStat(stats.organizations)}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.organizations)}
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {formatStat(stats.collectives)}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.collectives)}
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {formatStat(stats.moneyManaged)}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.moneyManaged)}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="text-center lg:pt-8">
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {formatStat(stats.expensesPaid)}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.expensesPaid)}
                </div>
              </div>
              <div className="text-center lg:pt-8">
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {formatStat(stats.contributionsReceived)}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.contributionsReceived)}
                </div>
              </div>
              <div className="text-center lg:pt-8">
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {formatStat(stats.transactionsRecorded)}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.transactionsRecorded)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
