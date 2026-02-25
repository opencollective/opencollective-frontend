import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { defineMessages, useIntl } from 'react-intl';

// Hardcoded stats from 2025-09-03, based on host's with "isTrustedHost"=true
const stats = {
  organizations: '41',
  collectives: '10K+',
  moneyManaged: '$40M',
  expensesPaid: '116K+',
  contributionsReceived: '1M+',
  transactionsRecorded: '6M+',
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
  const { formatMessage } = useIntl();

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
            <motion.h2
              className="mb-6 text-center text-2xl font-semibold text-slate-700 sm:mb-8 sm:text-3xl lg:mb-10 lg:text-[2rem]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              {formatMessage(messages.title)}
            </motion.h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {/* Top Row */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {stats.organizations}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.organizations)}
                </div>
              </motion.div>
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {stats.collectives}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.collectives)}
                </div>
              </motion.div>
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {stats.moneyManaged}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.moneyManaged)}
                </div>
              </motion.div>

              {/* Bottom Row */}
              <motion.div
                className="text-center lg:pt-8"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {stats.expensesPaid}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.expensesPaid)}
                </div>
              </motion.div>
              <motion.div
                className="text-center lg:pt-8"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {stats.contributionsReceived}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.contributionsReceived)}
                </div>
              </motion.div>
              <motion.div
                className="text-center lg:pt-8"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="mb-2 text-4xl font-bold text-slate-700 sm:mb-3 sm:text-5xl lg:text-6xl">
                  {stats.transactionsRecorded}
                </div>
                <div className="text-base text-slate-700 sm:text-lg lg:text-xl">
                  {formatMessage(messages.transactionsRecorded)}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
