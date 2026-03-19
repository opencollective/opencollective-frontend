import React from 'react';
import { ArrowRight } from 'lucide-react';
import { defineMessage, FormattedMessage } from 'react-intl';

import I18nFormatters from '../components/I18nFormatters';
import Page from '../components/Page';
import type { IFeatureSection } from '@/components/home/solutions/Features';
import Features from '@/components/home/solutions/Features';
import { JoinCTAButtons } from '@/components/home/solutions/JoinCTAButtons';
import type { Testimonial } from '@/components/home/solutions/Testimonials';
import Testimonials from '@/components/home/solutions/Testimonials';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { Button } from '@/components/ui/Button';

const featureHighlights = [
  {
    imgSrc: '/static/images/product/hosting.png',
    title: defineMessage({
      defaultMessage: 'Fiscal Hosting',
      id: 'collectives.features.fiscallyHosted',
    }),
    description: defineMessage({
      defaultMessage: 'Join a fiscal host that can handle legal and financial compliance on your behalf.',
      id: 'collectives.features.fiscallyHosted.description',
    }),
  },
  {
    imgSrc: '/static/images/product/crowdfunding.png',
    title: defineMessage({
      defaultMessage: 'Raise Money & Crowdfund',
      id: 'collectives.features.crowdfund',
    }),
    description: defineMessage({
      defaultMessage: 'Accept donations, grants, and sponsorships to fund your work.',
      id: 'collectives.features.crowdfund.description',
    }),
  },
  {
    imgSrc: '/static/images/product/money.png',
    title: defineMessage({
      defaultMessage: 'Spend Money',
      id: 'collectives.features.spendTransparently',
    }),
    description: defineMessage({
      defaultMessage: 'Submit expenses, review and approve invoices and reimbursements.',
      id: 'collectives.features.spendTransparently.description',
    }),
  },
  {
    imgSrc: '/static/images/product/expenses.png',
    title: defineMessage({
      defaultMessage: 'Participatory Finances',
      id: 'collectives.features.participatoryFinances',
    }),
    description: defineMessage({
      defaultMessage: 'Multiple administrators can coordinate project finances with multiple accounts.',
      id: 'collectives.features.participatoryFinances.description',
    }),
  },
  {
    imgSrc: '/static/images/product/ledger.png',
    title: defineMessage({
      defaultMessage: 'Real-Time Balance',
      id: 'collectives.features.realTimeBalances',
    }),
    description: defineMessage({
      defaultMessage:
        'Keep track of balances, income and spending using up-to-the-minute balances based on our internal transaction ledger.',
      id: 'collectives.features.realTimeBalances.description',
    }),
  },
  {
    imgSrc: '/static/images/product/transparency.png',
    title: defineMessage({
      defaultMessage: 'Transparency',
      id: 'collectives.features.transparency',
    }),
    description: defineMessage({
      defaultMessage:
        'Be accountable to your community by openly communicating your finances, transactions and real-time balances.',
      id: 'collectives.features.transparency.description',
    }),
  },
];

const collectiveFeatureSections: IFeatureSection[] = [
  {
    title: defineMessage({
      id: 'collectives.features.section.financial-platform.title',
      defaultMessage: 'Financial Platform',
    }),
    description: defineMessage({
      id: 'collectives.features.section.financial-platform.description',
      defaultMessage: 'An integrated toolbox for collaboratively and transparently managing your finances.',
    }),
    bgColor: 'sky-100',
    fgColor: 'sky-600',
    items: [
      {
        title: defineMessage({
          id: 'collectives.features.item.everything-you-need.title',
          defaultMessage: 'Everything you need to know & do in one place',
        }),
        description: defineMessage({
          id: 'collectives.features.item.everything-you-need.description',
          defaultMessage:
            'Your dashboard brings together all the tools you need to collaboratively manage your finances and stay on top of financial activities that require your attention.',
        }),
        media: {
          src: '/static/images/features/collective/1.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.organize-your-money.title',
          defaultMessage: 'Organize your money',
        }),
        description: defineMessage({
          id: 'collectives.features.item.organize-your-money.description',
          defaultMessage:
            'Organize your money and control your spending with accounts. Create accounts for holding reserves, for crowdfunding contributions and for spending.',
        }),
        media: {
          src: '/static/images/features/collective/2.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.check-your-balance.title',
          defaultMessage: 'Check your balance',
        }),
        description: defineMessage({
          id: 'collectives.features.item.check-your-balance.description',
          defaultMessage:
            'Money added to an account increases its balance and money spent (or transferred) will decrease its balance. You always know where you stand because the balance is always up-to-date and verifiable.',
        }),
        media: {
          src: '/static/images/features/collective/3.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.move-money-between-accounts.title',
          defaultMessage: 'Move money between accounts',
        }),
        description: defineMessage({
          id: 'collectives.features.item.move-money-between-accounts.description',
          defaultMessage:
            'Transfer money easily between accounts. Starting a new project? Transfer an allocated amount into a separate account in order to manage spending.',
        }),
        media: {
          src: '/static/images/features/collective/4.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.give-people-control.title',
          defaultMessage: 'Give people control',
        }),
        description: defineMessage({
          id: 'collectives.features.item.give-people-control.description',
          defaultMessage:
            'Assign administrators to manage specific accounts. Add or transfer money into the accounts them and let your team manage spending on their own.',
        }),
        media: {
          src: '/static/images/features/collective/5.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.tell-the-world.title',
          defaultMessage: 'Tell the world your financial story',
        }),
        description: defineMessage({
          id: 'collectives.features.item.tell-the-world.description',
          defaultMessage:
            'Activate a public profile to make yourself and your financials visible to the world and to invite broader engagement with crowdfunding campaigns and payment requests.',
        }),
        media: {
          src: '/static/images/features/collective/6.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
  {
    title: defineMessage({
      id: 'collectives.features.section.money-in.title',
      defaultMessage: 'Money In',
    }),
    description: defineMessage({
      id: 'collectives.features.section.money-in.description',
      defaultMessage: 'Document & track all incoming money.',
    }),
    bgColor: 'green-100',
    fgColor: 'green-600',
    items: [
      {
        title: defineMessage({
          id: 'collectives.features.item.accept-contributions.title',
          defaultMessage: 'Accept contributions',
        }),
        description: defineMessage({
          id: 'collectives.features.item.accept-contributions.description',
          defaultMessage:
            'Setup crowdfunding campaigns to engage your community. Completed contributions are automatically recorded in the ledger and added to your account balances.',
        }),
        media: {
          src: '/static/images/features/collective/7.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
  {
    title: defineMessage({
      id: 'collectives.features.section.money-out.title',
      defaultMessage: 'Money Out',
    }),
    bgColor: 'rose-50',
    fgColor: 'rose-600',
    items: [
      {
        title: defineMessage({
          id: 'collectives.features.item.accept-payment-requests.title',
          defaultMessage: 'Accept payment requests',
        }),
        description: defineMessage({
          id: 'collectives.features.item.accept-payment-requests.description',
          defaultMessage:
            'A step-by-step payment request form will walk users through filing correct and complete payment requests. Include your own unique instructions on how to properly submit a payment request in order to get paid.',
        }),
        media: {
          src: '/static/images/features/collective/8.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.invite-people-to-get-paid.title',
          defaultMessage: 'Invite people to get paid',
        }),
        description: defineMessage({
          id: 'collectives.features.item.invite-people-to-get-paid.description',
          defaultMessage:
            'Send payment request invitations to people who are not on the platform. They will receive an invitation that will guide them to create a new user, complete and submit the payment request.',
        }),
        media: {
          src: '/static/images/features/collective/9.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.approve-payment-requests.title',
          defaultMessage: 'Approve payment requests',
        }),
        description: defineMessage({
          id: 'collectives.features.item.approve-payment-requests.description',
          defaultMessage:
            'Review payment requests that have been submitted. Approve the legitimate requests you wish to pay and reject or delete the others.',
        }),
        media: {
          src: '/static/images/features/collective/10.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
  {
    title: defineMessage({
      id: 'collectives.features.section.crowdfunding.title',
      defaultMessage: 'Crowdfunding',
    }),
    description: defineMessage({
      id: 'collectives.features.section.crowdfunding.description',
      defaultMessage:
        'Create a variety of crowdfunding campaigns: simple tip-jar with one time contributions, one-time goals, monthly recurring goals and even yearly memberships for continuous income.',
    }),
    bgColor: 'purple-100',
    fgColor: 'purple-600',
    items: [
      {
        title: defineMessage({
          id: 'collectives.features.item.different-ways-to-contribute.title',
          defaultMessage: 'Different ways to contribute',
        }),
        description: defineMessage({
          id: 'collectives.features.item.different-ways-to-contribute.description',
          defaultMessage:
            'Flexible tiers enable you to create a diversity of crowdfunding campaigns. Design tiers that are appropriate for you and your audience. Collect tips, one time contributions and recurring contributions.',
        }),
        media: {
          src: '/static/images/features/collective/11.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.set-commit-to-funding-goals.title',
          defaultMessage: 'Set & commit to funding goals',
        }),
        description: defineMessage({
          id: 'collectives.features.item.set-commit-to-funding-goals.description',
          defaultMessage:
            'Create one time goals for one time projects. Create recurring goals to ask your community for long term support.',
        }),
        media: {
          src: '/static/images/features/collective/12.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
  {
    title: defineMessage({
      id: 'collectives.features.section.accounting-accountability.title',
      defaultMessage: 'Accounting & Accountability',
    }),
    description: defineMessage({
      id: 'collectives.features.section.accounting-accountability.description',
      defaultMessage:
        'Review & verify financial activities and provide your accountants with reliable information for your accounting processes.',
    }),
    bgColor: 'orange-100',
    fgColor: 'orange-600',
    items: [
      {
        title: defineMessage({
          id: 'collectives.features.item.all-financial-activities-are-recorded.title',
          defaultMessage: 'All financial activities are recorded',
        }),
        description: defineMessage({
          id: 'collectives.features.item.all-financial-activities-are-recorded.description',
          defaultMessage:
            'At the heart of the platform is a transaction ledger. All financial activities on the platform generate ledger transactions.',
        }),
        media: {
          src: '/static/images/features/collective/13.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.trace-and-verify.title',
          defaultMessage: 'Trace and verify all financial activities',
        }),
        description: defineMessage({
          id: 'collectives.features.item.trace-and-verify.description',
          defaultMessage:
            'All financial platform activities (payment requests, contributions, grants, etc.) can be traced to their related ledger transactions and vice versa.',
        }),
        media: {
          src: '/static/images/features/collective/14.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
      {
        title: defineMessage({
          id: 'collectives.features.item.export-ledger-data.title',
          defaultMessage: 'Export ledger data for your accountants',
        }),
        description: defineMessage({
          id: 'collectives.features.item.export-ledger-data.description',
          defaultMessage: 'Provide your accountants with periodic exports of detailed ledger transactions.',
        }),
        media: {
          src: '/static/images/features/collective/16.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
];

const collectiveTestimonials: Testimonial[] = [
  {
    paragraphs: [
      `Open Collective helped us fund-raise for our goal of open source development and knowledge, with the help of our donors and OpenCollective's platform we're able to provide knowledge to thousands of people, daily.`,
    ],
    author: 'Hytale Modding',
    org: 'Visit Collective Page',
    avatar: '/static/images/testimonials/hytalemodding.png',
    orgLink: '/hytalemodding',
  },
  {
    paragraphs: [
      'Thanks to Open Collective, the main projects I work on are able to transparently send funds to & from the community. That allows us to pay the core team members to keep working on us, sponsor downstream individuals & projects we rely on, and showcase sponsors on our website - which is a big perk for those sponsors.',
    ],
    author: 'typescript-eslint',
    org: 'Visit Collective Page',
    avatar: '/static/images/testimonials/typescript-eslint.png',
    orgLink: '/typescript-eslint',
  },
];

const Collectives = () => {
  return (
    <Page>
      {/* Hero */}
      <div className="mt-20 flex items-center justify-center px-4">
        <div className="flex max-w-6xl flex-col items-center">
          <h1 className="text-center text-5xl font-bold tracking-tight text-balance text-oc sm:text-6xl md:text-7xl md:font-extrabold">
            <FormattedMessage
              defaultMessage="Your cause needs a home. We provide the foundations."
              id="collectives.hero.title"
            />
          </h1>
          <div className="my-4 max-w-4xl sm:my-8">
            <p className="text-center text-xl text-balance text-muted-foreground">
              <FormattedMessage
                defaultMessage="Focus on your mission, not on bureaucracy. Open Collective gives your project the ability to legally accept donations and manage money, without the headache of becoming a registered entity."
                id="collectives.hero.subtitle"
              />
            </p>
          </div>

          <JoinCTAButtons onPage="collectives" />

          <div className="my-12">
            <Image
              width={1024}
              height={731}
              className="w-full max-w-[500px]"
              alt=""
              src="/static/images/home/nurturing-illustration.png"
            />
          </div>
        </div>
      </div>

      <h2 className="my-20 text-center text-4xl font-bold tracking-tight text-balance text-oc">
        <FormattedMessage
          defaultMessage="Fund movements, not paperwork.{newLine}Drive your collective to create change."
          id="gTvF5F"
          values={I18nFormatters}
        />
      </h2>

      {/* Feature highlights grid */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {featureHighlights.map(feature => (
            <div key={feature.title.id} className="flex flex-col items-center text-center">
              <div className="relative mb-2 size-16">
                <Image src={feature.imgSrc} fill aria-hidden alt="" style={{ height: undefined }} />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                <FormattedMessage {...feature.title} />
              </h3>
              <p className="leading-relaxed text-balance text-muted-foreground">
                <FormattedMessage {...feature.description} />
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* What is a Fiscal Host? */}
      <div className="px-4 py-16">
        <div className="mx-auto max-w-5xl rounded-2xl bg-[hsl(113,53%,97%)] px-8 py-10 md:px-12 md:py-12">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
            <div className="w-full max-w-[220px] shrink-0">
              <Image
                width={676}
                height={432}
                className="w-full"
                src="/static/images/become-a-host/whoAreFiscalHost-illustration.png"
                alt=""
              />
            </div>

            <div className="flex-1">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
                <FormattedMessage defaultMessage="What is a fiscal host?" id="collectives.fiscalHost.title" />
              </h2>
              <p className="mb-4 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage="Fiscal hosts are legally incorporated organisations (typically non-profit) that provide the legal and financial umbrella for your group, so you can focus on your mission."
                  id="collectives.fiscalHost.description1"
                />
              </p>
              <p className="mb-4 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage="Your project operates using the fiscal host's legal entity and bank account instead of having to set up your own. The host provides administrative services, oversight, and support."
                  id="collectives.fiscalHost.description2"
                />
              </p>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground italic">
                <FormattedMessage
                  defaultMessage="Fiscal hosting is also called fiscal sponsorship, fund-holding, or auspicing in different places around the world."
                  id="collectives.fiscalHost.note"
                />
              </p>
              <Button asChild variant="outline" className="rounded-full whitespace-nowrap" size="lg">
                <Link href="/fiscal-hosting" className="flex items-center gap-2">
                  <FormattedMessage
                    defaultMessage="Learn more about fiscal hosting"
                    id="collectives.fiscalHost.learnMore"
                  />
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features (scrolling accordion) */}
      <div className="flex flex-1 justify-center">
        <div className="max-w-7xl flex-1">
          <Features featureSections={collectiveFeatureSections} />
        </div>
      </div>

      {/* Testimonials */}
      <Testimonials testimonials={collectiveTestimonials} />
    </Page>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default Collectives;
