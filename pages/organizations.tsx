import React from 'react';
import { defineMessage, FormattedMessage } from 'react-intl';

import NextIllustration from '../components/collectives/HomeNextIllustration';
import { MainDescription } from '../components/marketing/Text';
import Page from '../components/Page';
import type { IFeatureSection } from '@/components/home/solutions/Features';
import Features from '@/components/home/solutions/Features';
import { JoinCTAButtons } from '@/components/home/solutions/JoinCTAButtons';
import Testimonials, { Testimonial } from '@/components/home/solutions/Testimonials';
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
          src: '/static/images/features/organization/1.png',
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
          src: '/static/images/features/organization/2.png',
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
          src: '/static/images/features/organization/3.png',
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
          src: '/static/images/features/organization/4.png',
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
          src: '/static/images/features/organization/5.png',
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
          src: '/static/images/features/organization/6.png',
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
          src: '/static/images/features/organization/7.png',
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
          src: '/static/images/features/organization/8.png',
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
          src: '/static/images/features/organization/9.png',
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
          src: '/static/images/features/organization/11.png',
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
          src: '/static/images/features/organization/12.png',
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
          src: '/static/images/features/organization/13.png',
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
          src: '/static/images/features/organization/14.png',
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
          src: '/static/images/features/organization/15.png',
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
          src: '/static/images/features/organization/16.png',
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
          src: '/static/images/features/organization/17.png',
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
          src: '/static/images/features/organization/18.png',
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
          src: '/static/images/features/organization/19.png',
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
          src: '/static/images/features/organization/20.png',
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
          src: '/static/images/features/organization/21.png',
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
          src: '/static/images/features/organization/22.png',
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
          src: '/static/images/features/organization/23.png',
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
          src: '/static/images/features/organization/24.png',
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
          src: '/static/images/features/organization/25.png',
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
          src: '/static/images/features/organization/26.png',
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
          src: '/static/images/features/organization/27.png',
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
          src: '/static/images/features/organization/28.png',
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
          src: '/static/images/features/organization/29.png',
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
          src: '/static/images/features/organization/30.png',
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
          src: '/static/images/features/organization/31.png',
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
          src: '/static/images/features/organization/32.png',
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
          src: '/static/images/features/organization/33.png',
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
          src: '/static/images/features/organization/34.png',
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
          src: '/static/images/features/organization/35.png',
          srcWidth: 1400,
          srcHeight: 1400,
        },
      },
    ],
  },
];

const orgTestimonials: Testimonial[] = [
  {
    paragraphs: [
      'The Open Collective platform is a critical part of how we operate. It streamlines our operations, saving us time and reducing administrative overhead. By automating many tasks related to managing financial contributions and expenses, we’re able to focus more attention on supporting our hosted collectives’ individual needs.',
      'The platform keeps our financial records accurate, timely, and transparent, helping us build trust within our community and enabling us to focus more on providing meaningful support.',
    ],
    author: 'Lauren Gardner',
    role: 'Executive Director',
    linkLabel: 'Open Source Collective',
    avatar: '/static/images/testimonials/lauren-gardner.png',
    linkUrl: 'https://oscollective.org',
  },
  {
    paragraphs: [
      'Open Collective is essential to how we operate as a foundation. The platform allows us to support hundreds of grassroots and open-source communities with transparent budgets, accessible financial tools, and smooth cross-border grant distribution.',
      'Working with Ofico ensures that the platform continues to evolve with the needs of fiscal hosts and the communities they serve — it’s an indispensable partner in making collective financial infrastructure truly work at scale.',
    ],
    author: 'Jean-François De Hertogh',
    role: 'Executive Director',
    linkLabel: 'Open Collective Europe Foundation',
    avatar: '/static/images/testimonials/jf.png',
    linkUrl: 'https://www.oceurope.org',
  },
  {
    paragraphs: [
      'Open Collective enables us to deliver valuable services to numerous collectives in a structured and automated way.',
      'Our communities appreciate how efficient and user-friendly the platform is, allowing them not only to fundraise but also to manage their budgets and expenses transparently.',
      'With frequent updates, the platform continues to make it easier for us to support our collectives and for them to work with greater clarity and simplicity.',
    ],
    author: 'Babette',
    avatar: '/static/images/testimonials/babette.png',
    linkLabel: 'All For Climate',
    linkUrl: 'https://allforclimate.earth/',
  },
  {
    paragraphs: [
      'Open Collective has enabled us to distribute funds across community groups and collectives in transparent and clear ways.',
      'The platform has unlocked our capacity to build sustainable infrastructure for our work - peer to peer learning and action - in meaningful and sustainable ways.',
      'Furthermore the support we receive is thorough and consistent - we deeply appreciate the platform and the team.',
    ],
    author: 'Anna Garlands',
    avatar: '/static/images/testimonials/anna-garlands.jpeg',
    linkLabel: 'Huddlecraft',
    role: 'Co-Director',
    linkUrl: 'https://www.huddlecraft.com/',
  },
  {
    paragraphs: [
      'Open Collective has democratised community organising, helping to build trust and foster collaboration and transparency across community led work.',
      'Our continued partnership with Open Collective has enabled our network of more than 600 fiscally hosted community groups worldwide to manage their finances with ease and reassurance, thus freeing up headspace to focus on front line impact and long term strategy.',
      "It's an easy to use platform and the Open Collective team are dedicated to ensuring that client feedback from our network is fed into further product design.",
    ],
    author: 'Esther Foreman',
    avatar: '/static/images/testimonials/esther-foreman.jpg',
    linkLabel: 'Social Change Nest',
    role: 'CEO and Chair of the Board',
    linkUrl: 'https://thesocialchangenest.org',
  },
  {
    paragraphs: [
      `The future of civil society isn’t just big organizations—it’s the long tail of grassroots initiatives.`,
      `Open Collective unlocks that potential with transparent finances by default and infrastructure built for collaboration.`,
    ],
    author: 'Kasimir Suter Winter,',
    avatar: '/static/images/testimonials/kasimir-suter-winter.png',
    linkLabel: 'Massvis',
    role: 'Chairman',
    linkUrl: '/massvis',
  },
];

const Organizations = () => {
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
              loading="eager"
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
          <Features featureSections={featureSections} />
        </div>
      </div>
      <Testimonials testimonials={orgTestimonials} />
    </Page>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default Organizations;
