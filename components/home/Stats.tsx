import React from 'react';
import Image from 'next/image';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  title: {
    defaultMessage: 'Collectively powering',
    id: 'Stats.title',
  },
  organizations: {
    defaultMessage: 'Organizations',
    id: 'Stats.organizations',
  },
  collectives: {
    defaultMessage: 'Collectives',
    id: 'Stats.collectives',
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
  const { formatMessage } = useIntl();

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-2xl px-8 py-12">
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
            <h2 className="mb-8 text-center text-4xl font-semibold text-slate-700">{formatMessage(messages.title)}</h2>

            <div className="grid grid-cols-3 gap-8">
              {/* Top Row */}
              <div className="text-center">
                <div className="mb-2 text-6xl font-bold text-slate-700">51</div>
                <div className="text-slate-700">{formatMessage(messages.organizations)}</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-6xl font-bold text-slate-700">28K+</div>
                <div className="text-slate-700">{formatMessage(messages.collectives)}</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-6xl font-bold text-slate-700">$30M</div>
                <div className="text-slate-700">{formatMessage(messages.moneyManaged)}</div>
              </div>

              {/* Bottom Row */}
              <div className="pt-8 text-center">
                <div className="mb-2 text-6xl font-bold text-slate-700">800K+</div>
                <div className="text-slate-700">{formatMessage(messages.expensesPaid)}</div>
              </div>
              <div className="pt-8 text-center">
                <div className="mb-2 text-6xl font-bold text-slate-700">910K+</div>
                <div className="text-slate-700">{formatMessage(messages.contributionsReceived)}</div>
              </div>
              <div className="pt-8 text-center">
                <div className="mb-2 text-6xl font-bold text-slate-700">540M</div>
                <div className="text-slate-700">{formatMessage(messages.transactionsRecorded)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
