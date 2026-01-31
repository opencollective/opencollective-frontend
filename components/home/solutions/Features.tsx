import React, { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { defineMessage, useIntl } from 'react-intl';

import { cn } from '@/lib/utils';
import type { StaticImport } from 'next/dist/shared/lib/get-img-props';

import Image from '@/components/Image';

import FeatureSection from './FeatureSection';

export interface IFeatureSection {
  title: { id: string; defaultMessage: string };
  description?: { id: string; defaultMessage: string };
  tailwindColor?: string;
  fgColor?: string;
  bgColor?: string;
  items: {
    title: { id: string; defaultMessage: string };
    description: { id: string; defaultMessage: string };
    media?: {
      src: string | StaticImport;
      srcWidth: number;
      srcHeight: number;
      style?: CSSProperties;
      containerStyle?: CSSProperties;
      containerClasses?: string;
      mediaClasses?: string;
    };
  }[];
}

const featureSections: IFeatureSection[] = [
  {
    title: defineMessage({
      id: 'solutions.features.section.financial-platform.title',
      defaultMessage: 'Financial Platform',
    }),
    description: defineMessage({
      id: 'solutions.features.section.financial-platform.description',
      defaultMessage: 'An integrated toolbox for collaboratively and transparently managing your finances.',
    }),
    bgColor: 'sky-100',
    fgColor: 'sky-600',
    items: [
      {
        title: defineMessage({
          id: 'solutions.features.item.everything-you-need-to-know-do-in-one-place.title',
          defaultMessage: 'Everything you need to know & do in one place',
        }),
        description: defineMessage({
          id: 'solutions.features.item.everything-you-need-to-know-do-in-one-place.description',
          defaultMessage:
            'Your dashboard brings together all the tools you need to collaboratively manage your finances and stay on top of financial activities that require your attention.',
        }),
        media: {
          src: '/static/images/features/1.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.organize-your-money.title',
          defaultMessage: 'Organize your money',
        }),
        description: defineMessage({
          id: 'solutions.features.item.organize-your-money.description',
          defaultMessage:
            'Organize your money and control your spending with accounts. Create accounts for holding reserves, for crowdfunding contributions and for spending.',
        }),
        media: {
          src: '/static/images/features/2.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.check-your-balance.title',
          defaultMessage: 'Check your balance',
        }),
        description: defineMessage({
          id: 'solutions.features.item.check-your-balance.description',
          defaultMessage:
            'Money added to an account increases its balance and money spent (or transferred) will decrease its balance. You always know where you stand because the balance is always up-to-date and verifiable.',
        }),
        media: {
          src: '/static/images/features/3.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.move-money-between-accounts.title',
          defaultMessage: 'Move money between accounts',
        }),
        description: defineMessage({
          id: 'solutions.features.item.move-money-between-accounts.description',
          defaultMessage:
            'Transfer money easily between accounts. Starting a new project? Transfer an allocated amount into a separate account in order to manage spending.',
        }),
        media: {
          src: '/static/images/features/4.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.give-people-control.title',
          defaultMessage: 'Give people control',
        }),
        description: defineMessage({
          id: 'solutions.features.item.give-people-control.description',
          defaultMessage:
            'Assign administrators to manage specific accounts. Add or transfer money into the accounts them and let your team manage spending on their own.',
        }),
        media: {
          src: '/static/images/features/5.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.tell-the-world-your-financial-story.title',
          defaultMessage: 'Tell the world your financial story',
        }),
        description: defineMessage({
          id: 'solutions.features.item.tell-the-world-your-financial-story.description',
          defaultMessage:
            'Activate a public profile to make yourself and your financials visible to the world and to invite broader engagement with crowdfunding campaigns and payment requests.',
        }),
        media: {
          src: '/static/images/features/6.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
  {
    title: defineMessage({
      id: 'solutions.features.section.money-in.title',
      defaultMessage: 'Money In',
    }),
    description: defineMessage({
      id: 'solutions.features.section.money-in.description',
      defaultMessage: 'Document & track all incoming money.',
    }),
    bgColor: 'green-100',
    fgColor: 'green-600',
    items: [
      {
        title: defineMessage({
          id: 'solutions.features.item.add-money-to-your-accounts.title',
          defaultMessage: 'Add money to your accounts',
        }),
        description: defineMessage({
          id: 'solutions.features.item.add-money-to-your-accounts.description',
          defaultMessage:
            'When money shows up in your bank account or a check is received and processed, add it to an account and it is immediately available for disbursement.',
        }),
        media: {
          src: '/static/images/features/7.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.accept-contributions.title',
          defaultMessage: 'Accept contributions',
        }),
        description: defineMessage({
          id: 'solutions.features.item.accept-contributions.description',
          defaultMessage:
            'Setup crowdfunding campaigns to engage your community. Completed contributions are automatically recorded in the ledger and added to your account balances.',
        }),
        media: {
          src: '/static/images/features/8.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.track-promised-funds.title',
          defaultMessage: 'Track promised funds',
        }),
        description: defineMessage({
          id: 'solutions.features.item.track-promised-funds.description',
          defaultMessage:
            'Have you been awarded a grant and are now expecting payments to arrive? Document and track expected income until it arrives and is added to your accounts.',
        }),
        media: {
          src: '/static/images/features/9.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
  {
    title: defineMessage({
      id: 'solutions.features.section.money-out.title',
      defaultMessage: 'Money Out',
    }),
    description: defineMessage({
      id: 'solutions.features.section.money-out.description',
      defaultMessage:
        'A comprehensive suite of tools for submitting, review, correcting, approving and paying out disbursements. A small team of administrators can efficiently handle thousands of monthly payment requests.',
    }),
    bgColor: 'rose-50',
    fgColor: 'rose-600',
    items: [
      {
        title: defineMessage({
          id: 'solutions.features.item.accept-requests-from-people-asking-to-get-paid.title',
          defaultMessage: 'Accept requests from people asking to get paid',
        }),
        description: defineMessage({
          id: 'solutions.features.item.accept-requests-from-people-asking-to-get-paid.description',
          defaultMessage:
            'A step-by-step payment request form will walk users through filing correct and complete payment requests. Include your own unique instructions on how to properly submit a payment request in order to get paid.',
        }),
        media: {
          src: '/static/images/features/11.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.invite-people-to-get-paid.title',
          defaultMessage: 'Invite people to get paid',
        }),
        description: defineMessage({
          id: 'solutions.features.item.invite-people-to-get-paid.description',
          defaultMessage:
            'Send payment request invitations to people who are not on the platform. They will receive an invitation that will guide them to create a new user, complete and submit the payment request.',
        }),
        media: {
          src: '/static/images/features/12.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'ApprovePaymentRequests',
          defaultMessage: 'Approve Payment Requests',
        }),
        description: defineMessage({
          id: 'solutions.features.item.approve-payment-requests.description',
          defaultMessage:
            'Review payment requests that have been submitted. Approve the legitimate requests you wish to pay and reject or delete the others.',
        }),
        media: {
          src: '/static/images/features/13.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.pay-approved-payment-requests.title',
          defaultMessage: 'Pay approved payment requests',
        }),
        description: defineMessage({
          id: 'solutions.features.item.pay-approved-payment-requests.description',
          defaultMessage:
            'One tool bring together all the information you need to quickly and effectively pay approved payment requests and other disbursements.',
        }),
        media: {
          src: '/static/images/features/14.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.spend-within-your-balance.title',
          defaultMessage: 'Spend within your balance',
        }),
        description: defineMessage({
          id: 'solutions.features.item.spend-within-your-balance.description',
          defaultMessage:
            'Automatic balance protection guarantees that you only pay expenses that can be covered by current account balances.',
        }),
        media: {
          src: '/static/images/features/15.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.pay-instantly.title',
          defaultMessage: 'Pay Instantly',
        }),
        description: defineMessage({
          id: 'solutions.features.item.pay-instantly.description',
          defaultMessage:
            'Pay using Wise & PayPal integrations or manually mark expenses that have been paid off-platform (for example: from your bank account) as paid.',
        }),
        media: {
          src: '/static/images/features/16.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.automated-security-checks-protect-against-fraud.title',
          defaultMessage: 'Automated security checks protect against fraud',
        }),
        description: defineMessage({
          id: 'solutions.features.item.automated-security-checks-protect-against-fraud.description',
          defaultMessage:
            'Real time security checks are integrated into the payment tool and will alert you if something is suspicious. Green means safe to pay, yellow is a heads up and red requires attention.',
        }),
        media: {
          src: '/static/images/features/17.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.quickly-resolve-issues.title',
          defaultMessage: 'Quickly resolve issues',
        }),
        description: defineMessage({
          id: 'solutions.features.item.quickly-resolve-issues.description',
          defaultMessage:
            'Each expense is a conversation thread with all the people involved in its submission, review and payment. The correspondence is saved for future reference.',
        }),
        media: {
          src: '/static/images/features/18.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.easily-work-your-way-through-all-payment-requests.title',
          defaultMessage: 'Easily work your way through all payment requests',
        }),
        description: defineMessage({
          id: 'solutions.features.item.easily-work-your-way-through-all-payment-requests.description',
          defaultMessage:
            'Mark payment requests as "incomplete" when they are sent back to submitters for correction. Mark them as "on hold" while you are looking into them with your accountant or lawyer.',
        }),
        media: {
          src: '/static/images/features/19.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
  {
    title: defineMessage({
      id: 'DkzeEN',
      defaultMessage: 'Hosting',
    }),
    description: defineMessage({
      id: 'solutions.features.section.hosting.description',
      defaultMessage:
        'Invite other groups to operate under your financial and legal umbrella as Collectives. With a small team using the platform you can efficiently support thousands of groups and projects.',
    }),
    bgColor: 'yellow-50',
    fgColor: 'yellow-600',
    items: [
      {
        title: defineMessage({
          id: 'solutions.features.item.host-other-groups.title',
          defaultMessage: 'Host other groups',
        }),
        description: defineMessage({
          id: 'solutions.features.item.host-other-groups.description',
          defaultMessage:
            'Collectives are mini-organizations within your organization. Each collective can setup their own accounts, crowdfunding campaigns and projects.',
        }),
        media: {
          src: '/static/images/features/20.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.accept-applications-from-groups-looking-for-a-host.title',
          defaultMessage: 'Accept applications from groups looking for a host',
        }),
        description: defineMessage({
          id: 'solutions.features.item.accept-applications-from-groups-looking-for-a-host.description',
          defaultMessage:
            'Accept applications from groups that are interested in being hosted by you. A conversation thread within each application documents the review and acceptance process until they are either accepted (and become hosted collectives) or rejected.',
        }),
        media: {
          src: '/static/images/features/21.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.collectives-autonomously-manage-their-finances.title',
          defaultMessage: 'Collectives autonomously manage their finances',
        }),
        description: defineMessage({
          id: 'solutions.features.item.collectives-autonomously-manage-their-finances.description',
          defaultMessage:
            'Collectives always have access to up-to-date balances in their accounts and can operate autonomously.',
        }),
        media: {
          src: '/static/images/features/22.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.collectives-decide-which-expenses-to-pay.title',
          defaultMessage: 'Collectives decide which expenses to pay',
        }),
        description: defineMessage({
          id: 'solutions.features.item.collectives-decide-which-expenses-to-pay.description',
          defaultMessage:
            'Collectives can independently review and approve their own expenses. Approved expenses will await your review and payment.',
        }),
        media: {
          src: '/static/images/features/23.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.efficiently-process-payment-requests.title',
          defaultMessage: 'Efficiently process payment requests',
        }),
        description: defineMessage({
          id: 'solutions.features.item.efficiently-process-payment-requests.description',
          defaultMessage:
            'All approved payment requests are checked against collective balances. When the balance is sufficient they show up in your queue of ready-to-pay expenses.',
        }),
        media: {
          src: '/static/images/features/24.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.charge-hosting-fees.title',
          defaultMessage: 'Charge hosting fees',
        }),
        description: defineMessage({
          id: 'solutions.features.item.charge-hosting-fees.description',
          defaultMessage:
            'Automatically charge hosting fees from your hosted collectives Fees are automatically applied and tracked in the ledger and visible to both you and your hosted collectives.',
        }),
        media: {
          src: '/static/images/features/25.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
  {
    title: defineMessage({
      id: 'solutions.features.crowdfunding',
      defaultMessage: 'Crowdfunding',
    }),
    description: defineMessage({
      id: 'solutions.features.section.crowdfunding.description',
      defaultMessage:
        'Create a variety of crowdfunding campaigns: simple tip-jar with one time contributions, one-time goals, monthly recurring goals and even yearly memberships for generating continuous income via crowdfunding.',
    }),
    bgColor: 'purple-100',
    fgColor: 'purple-600',
    items: [
      {
        title: defineMessage({
          id: 'solutions.features.item.different-ways-to-contribute.title',
          defaultMessage: 'Different ways to contribute',
        }),
        description: defineMessage({
          id: 'solutions.features.item.different-ways-to-contribute.description',
          defaultMessage:
            'Flexible tiers enable you to create a diversity of crowdfunding campaigns. Design tiers that are appropriate for you and your audience. Collect tips, one time contributions and recurring contributions.',
        }),
        media: {
          src: '/static/images/features/26.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.set-commit-to-funding-goals.title',
          defaultMessage: 'Set & commit to funding goals',
        }),
        description: defineMessage({
          id: 'solutions.features.item.set-commit-to-funding-goals.description',
          defaultMessage:
            'Create one time goals for one time projects. Create recurring goals to ask your community for long term support.',
        }),
        media: {
          src: '/static/images/features/27.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
  {
    title: defineMessage({
      id: 'solutions.features.section.accounting-accountability.title',
      defaultMessage: 'Accounting & Accountability',
    }),
    description: defineMessage({
      id: 'solutions.features.section.accounting-accountability.description',
      defaultMessage:
        'Review & verify financial activities and provide your accountants with reliable information for your accounting processes.',
    }),
    bgColor: 'orange-100',
    fgColor: 'orange-600',
    items: [
      {
        title: defineMessage({
          id: 'solutions.features.item.all-financial-activities-are-recorded.title',
          defaultMessage: 'All financial activities are recorded',
        }),
        description: defineMessage({
          id: 'solutions.features.item.all-financial-activities-are-recorded.description',
          defaultMessage:
            'At the heart of the platform is a transaction ledger. All financial activities on the platform generate ledger transactions.',
        }),
        media: {
          src: '/static/images/features/28.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.trace-and-verify-all-financial-activities.title',
          defaultMessage: 'Trace and verify all financial activities',
        }),
        description: defineMessage({
          id: 'solutions.features.item.trace-and-verify-all-financial-activities.description',
          defaultMessage:
            'All financial platform activities (payment requests, contributions, grants, etc.) can be traced to their related ledger transactions and vice versa.',
        }),
        media: {
          src: '/static/images/features/29.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.legible-financial-summaries.title',
          defaultMessage: 'Legible financial summaries',
        }),
        description: defineMessage({
          id: 'solutions.features.item.legible-financial-summaries.description',
          defaultMessage:
            'A periodic (monthly, quarterly, yearly) transaction statement provides you an overview of ledger activity. Drill down into every number in the statement to review and verify the underlying ledger transactions.',
        }),
        media: {
          src: '/static/images/features/30.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.export-ledger-data-for-your-accountants.title',
          defaultMessage: 'Export ledger data for your accountants',
        }),
        description: defineMessage({
          id: 'solutions.features.item.export-ledger-data-for-your-accountants.description',
          defaultMessage: 'Provide your accountants with periodic exports of detailed ledger transactions.',
        }),
        media: {
          src: '/static/images/features/31.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.categorize-financial-activities-for-accounting.title',
          defaultMessage: 'Categorize financial activities for accounting',
        }),
        description: defineMessage({
          id: 'solutions.features.item.categorize-financial-activities-for-accounting.description',
          defaultMessage:
            'Setup your chart of accounts and categorize your disbursements and added funds. Include this in your exports and reduce the time, effort and accounting costs.',
        }),
        media: {
          src: '/static/images/features/32.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.connect-your-bank-accounts.title',
          defaultMessage: 'Connect your bank accounts',
        }),
        description: defineMessage({
          id: 'solutions.features.item.connect-your-bank-accounts.description',
          defaultMessage:
            'Connect your platform account to your preferred banking services and reconcile off-platform transactions with on-platform financial activities.',
        }),
        media: {
          src: '/static/images/features/33.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.collect-tax-forms.title',
          defaultMessage: 'Collect tax forms',
        }),
        description: defineMessage({
          id: 'solutions.features.item.collect-tax-forms.description',
          defaultMessage:
            'Automatically collect USA tax forms from people who get paid through the platform. At the end of the fiscal year download all the relevant tax-forms, ready to submit to the authorities.',
        }),
        media: {
          src: '/static/images/features/34.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'solutions.features.item.document-financial-agreements.title',
          defaultMessage: 'Document financial agreements',
        }),
        description: defineMessage({
          id: 'solutions.features.item.document-financial-agreements.description',
          defaultMessage:
            'Upload and track financial agreements. Link agreements to hosted collectives and reference them when paying disbursements.',
        }),
        media: {
          src: '/static/images/features/35.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
];

export default function Features() {
  const intl = useIntl();
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track active sub-items for each section
  const [activeSectionItems, setActiveSectionItems] = useState<number[]>(featureSections.map(() => 0));

  // Handle section becoming visible
  const handleSectionVisible = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Handle sub-item selection
  const handleItemSelect = (sectionIndex: number, itemIndex: number) => {
    setActiveSectionItems(prev => {
      const newActiveSectionItems = [...prev];
      newActiveSectionItems[sectionIndex] = itemIndex;
      return newActiveSectionItems;
    });
  };

  return (
    <section className="relative flex flex-col px-6 pb-24 lg:flex-row lg:gap-18" ref={containerRef}>
      {/* Mobile Layout: Sections with integrated visuals */}
      <div className="lg:hidden">
        {featureSections.map((section, sectionIndex) => (
          <div key={section.title.id} className="mb-16">
            {/* Mobile visual for current section - always visible */}
            <div className="relative mb-8">
              {section.items.map((item, itemIndex) => {
                const img = item.media || section.items[0]?.media;
                const isActive = activeSectionItems[sectionIndex] === itemIndex;

                const sectionStyle = {
                  ...(section.fgColor && {
                    '--primary': `var(--color-${section.fgColor})`,
                  }),
                  ...(section.bgColor && {
                    '--card': `var(--color-${section.bgColor})`,
                  }),
                } as React.CSSProperties;

                return (
                  <div
                    key={`${section.title.id}-${item.title.id}`}
                    className={cn(
                      'absolute inset-0 transition-opacity duration-300',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                    style={sectionStyle}
                  >
                    <div
                      className={cn(
                        'relative aspect-square w-full overflow-clip rounded-4xl border border-slate-100',
                        'bg-card',
                      )}
                    >
                      {img && (
                        <div className={cn('relative flex h-full w-full items-center justify-center')}>
                          <Image
                            src={img.src}
                            width={img.srcWidth}
                            height={img.srcHeight}
                            alt={intl.formatMessage(item.title)}
                            style={{ height: undefined }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Spacer to maintain aspect ratio */}
              <div className="aspect-square w-full opacity-0">
                <div className="h-full w-full" />
              </div>
            </div>
            {/* Mobile section content */}
            <FeatureSection
              section={section}
              sectionIndex={sectionIndex}
              onItemSelect={itemIndex => handleItemSelect(sectionIndex, itemIndex)}
              isActive={activeIndex === sectionIndex}
              onBecomeVisible={handleSectionVisible}
            />
          </div>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden py-40 lg:block lg:w-4/10">
        {featureSections.map((section, sectionIndex) => (
          <FeatureSection
            key={section.title.id}
            section={section}
            sectionIndex={sectionIndex}
            onItemSelect={itemIndex => handleItemSelect(sectionIndex, itemIndex)}
            isActive={activeIndex === sectionIndex}
            onBecomeVisible={handleSectionVisible}
          />
        ))}
      </div>

      {/* Desktop sticky features visuals */}
      <div className="relative hidden self-stretch lg:block lg:w-6/10">
        <div className="sticky top-[16vh] flex flex-col items-center justify-start pt-[74vh]">
          <div className="absolute inset-[0%] h-full">
            {featureSections.map((section, sectionIndex) => (
              <React.Fragment key={section.title.id}>
                {section.items.map((item, itemIndex) => {
                  const img = item.media || section.items[0]?.media;
                  const isActive = activeIndex === sectionIndex && activeSectionItems[sectionIndex] === itemIndex;

                  const sectionStyle = {
                    ...(section.fgColor && {
                      '--primary': `var(--color-${section.fgColor})`,
                    }),
                    ...(section.bgColor && {
                      '--card': `var(--color-${section.bgColor})`,
                    }),
                  } as React.CSSProperties;
                  return (
                    <div
                      key={`${section.title.id}-${item.title.id}`}
                      className="absolute inset-[0%] flex h-full items-center justify-center"
                      style={sectionStyle}
                    >
                      <div
                        className={cn(
                          'relative aspect-square w-full overflow-clip rounded-4xl border border-slate-100 transition-opacity',
                          'bg-card',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                      >
                        {img && (
                          <div className={cn('relative flex h-full w-full items-center justify-center')}>
                            <Image
                              src={img.src}
                              width={img.srcWidth}
                              height={img.srcHeight}
                              alt={intl.formatMessage(item.title)}
                              style={{ height: undefined }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
