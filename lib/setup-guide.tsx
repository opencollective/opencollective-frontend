import React from 'react';
import { compact, isEmpty, isNil, orderBy } from 'lodash';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { hasAccountHosting } from '@/lib/collective';
import type { SetupGuideQuery } from '@/lib/graphql/types/v2/graphql';
import type LoggedInUser from '@/lib/LoggedInUser';
import { getPolicy } from '@/lib/policies';
import { getDashboardRoute } from '@/lib/url-helpers';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export type Step = {
  id: string;
  title: string | ReactNode;
  completed: boolean;
  description: string | ReactNode;
  requiresUpgrade?: boolean;
  action?: {
    label: string | ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
};

export type Category = {
  id: string;
  image: ReactNode;
  title: string | ReactNode;
  description: string | ReactNode;
  longDescription?: string | ReactNode;
  className?: string;
  steps?: Array<Step>;
  documentation?: Array<{
    title: string | ReactNode;
    description: string | ReactNode;
    url: string;
  }>;
};

const sortSteps = (steps: Step[]) =>
  orderBy(compact(steps), step => (step.requiresUpgrade ? -1 : step.completed ? 1 : 0), ['desc', 'desc']);

export const generateSetupGuideSteps = ({
  account,
  router,
  LoggedInUser,
}: {
  account: SetupGuideQuery['account'];
  router: AppRouterInstance;
  LoggedInUser: LoggedInUser;
}): Category[] => {
  const planFeatures = 'platformSubscription' in account && account.platformSubscription?.plan?.features;
  const hasHosting = hasAccountHosting(account);

  const allSteps = {
    inviteAdmins: {
      id: 'invite-admins',
      title: <FormattedMessage defaultMessage="Invite additional admins" id="SetupGuide.InviteAdmins" />,
      completed: account.admins?.totalCount >= 2 || account.adminInvites?.length > 0,
      description: (
        <FormattedMessage
          defaultMessage="We require there be at least two admins in the organizations. This guarantees that no one person holds exclusive access to the account. It also reduces the potential for fraudulent use of the account."
          id="SetupGuide.InviteAdmins.Description"
        />
      ),
      action: {
        label: <FormattedMessage defaultMessage="Invite Administrators" id="InviteAdministrators" />,
        onClick: () => {
          router.push(getDashboardRoute(account, 'team'));
        },
      },
    },
    stripe: {
      id: 'stripe',
      title: <FormattedMessage defaultMessage="Set up Stripe for receiving contributions" id="SetupGuide.Stripe" />,
      description: (
        <FormattedMessage
          defaultMessage="We use Stripe as a payment processor for receiving payments and contributions. Stripe itself provides many payment options including credit cards and bank transfers. Connect your account to Stripe in order to receive payments and contributions into your organization's account."
          id="SetupGuide.Stripe.Description"
        />
      ),
      completed: account.connectedAccounts?.some(ca => ca.service === 'stripe'),
      requiresUpgrade: planFeatures && !planFeatures.RECEIVE_FINANCIAL_CONTRIBUTIONS,
      action: {
        label: <FormattedMessage defaultMessage="Connect Stripe" id="SetupGuide.Stripe.Action" />,
        onClick: () => router.push(getDashboardRoute(account, 'receiving-money')),
      },
    },
    accountTwofa: {
      id: '2FA',
      title: <FormattedMessage defaultMessage="Set up two-factor authentication (2FA)" id="SetupGuide.2FA" />,
      completed: LoggedInUser?.hasTwoFactorAuth,
      description: (
        <FormattedMessage
          defaultMessage="Two Factor Authentication (2FA) adds an extra layer of protection to your personal account (and therefore also to your organization) . 2FA will require a second (in addition to your password) unique to you identifier when logging in. This prevents unauthorized access and is critical when using the platform for real world financial activities."
          id="SetupGuide.2FA.Description"
        />
      ),
      action: {
        label: <FormattedMessage defaultMessage="Set up 2FA" id="SetupGuide.2FA.Action" />,
        onClick: () => router.push(getDashboardRoute(LoggedInUser?.collective, 'user-security')),
      },
    },
    wise: {
      id: 'wise',
      title: <FormattedMessage defaultMessage="Set up Wise for payouts" id="SetupGuide.Wise" />,
      description: (
        <FormattedMessage
          defaultMessage="We use Wise for seamless expense payments. Wise provides global coverage and competitive payment processing fees. Connect to your Wise account in order to pay expenses with a click of a button."
          id="SetupGuide.Wise.Description"
        />
      ),
      completed: account.connectedAccounts?.some(ca => ca.service === 'transferwise'),
      requiresUpgrade: planFeatures && !planFeatures.TRANSFERWISE,
      action: {
        label: <FormattedMessage defaultMessage="Connect Wise" id="SetupGuide.Wise.Action" />,
        onClick: () => router.push(getDashboardRoute(account, 'sending-money')),
      },
    },
    expensePolicy: {
      title: <FormattedMessage defaultMessage="Set your expense policies" id="SetupGuide.ExpensesPolicy" />,
      description: (
        <FormattedMessage
          defaultMessage="Describe your process and requirements for processing payment requests. Let expense submitters know what you need from them in order to effectively process their payment requests and ensure faster payouts."
          id="SetupGuide.ExpensesPolicy.Description"
        />
      ),
      id: 'expenses-policy',
      completed:
        'host' in account &&
        !isEmpty(account.host?.policies?.EXPENSE_POLICIES?.invoicePolicy) &&
        !isEmpty(account.host?.policies?.EXPENSE_POLICIES?.receiptPolicy),
      action: {
        label: <FormattedMessage defaultMessage="Set up expense policies" id="SetupGuide.Expenses" />,
        onClick: () => router.push(getDashboardRoute(account, 'policies#expenses')),
      },
    },
    chartOfAccounts: {
      title: <FormattedMessage defaultMessage="Set up your chart of accounts" id="SetupGuide.ChartOfAccounts" />,
      id: 'chart-of-accounts',
      description: (
        <FormattedMessage
          defaultMessage="A Chart-of-Accounts enables you to categorize expenses and manually added funds in compliance with your accounting requirements. Setup your chart of accounts, categorize your expenses and added funds and your transaction exports will include this information. This will save you time and money when doing your accounting."
          id="SetupGuide.ChartOfAccounts.Description"
        />
      ),
      completed:
        'host' in account && account.host?.accountingCategories?.nodes?.filter(c => c.appliesTo === 'HOST').length > 0,
      requiresUpgrade: planFeatures && !planFeatures.CHART_OF_ACCOUNTS,
      action: {
        label: <FormattedMessage defaultMessage="Add chart of accounts" id="SetupGuide.ChartOfAccounts.Action" />,
        onClick: () => {
          router.push(getDashboardRoute(account, 'chart-of-accounts'));
        },
      },
    },
    profilePage: {
      id: 'profile-page',
      title: <FormattedMessage defaultMessage="Create your public profile page" id="SetupGuide.PublicProfile" />,
      description: (
        <FormattedMessage
          defaultMessage="Your public profile lets the world know you are active on the platform. It tells your story with a written description of your organization , your mission and what are your goals using the platform."
          id="SetupGuide.PublicProfile.Description"
        />
      ),
      completed:
        !isNil(account.longDescription) &&
        !isNil(account.description) &&
        !isEmpty(account.location) &&
        !isEmpty(account.tags),
      action: {
        label: <FormattedMessage defaultMessage="Edit your profile" id="SetupGuide.PublicProfile.Action" />,
        onClick: () => {
          router.push(getDashboardRoute(account, 'info'));
        },
      },
    },
    hosting: {
      title: <FormattedMessage defaultMessage="Enable hosting" id="SetupGuide.EnableHosting" />,
      description: (
        <FormattedMessage
          defaultMessage="Hosting enables you to manage other people’s money in addition to your own organization’s finances. Enable hosted collectives to allow other groups to manage their finances under your fiscal and legal umbrella. Enable hosted funds to hold institutional funds for grant distribution."
          id="SetupGuide.EnableHosting.Description"
        />
      ),
      id: 'enable-hosting',
      completed: hasHosting,
      action: {
        label: <FormattedMessage defaultMessage="Enable hosting" id="SetupGuide.EnableHosting" />,
        onClick: () => {
          router.push(getDashboardRoute(account, 'advanced'));
        },
      },
    },
    twofaPolicy: {
      title: (
        <FormattedMessage
          defaultMessage="Set up two-factor authentication requirements (2FA)"
          id="SetupGuide.2FARequirements"
        />
      ),
      description: (
        <FormattedMessage
          defaultMessage="To fully protect your organization, It is important that all your admins enable Two Factor Authentication (2FA) in their accounts. We recommend you enable the setting that forces all admins to also setup 2FA."
          id="SetupGuide.2FARequirements.Description"
        />
      ),
      id: '2fa-requirements',
      completed: 'host' in account && getPolicy(account.host, 'REQUIRE_2FA_FOR_ADMINS') === true,
      action: {
        label: <FormattedMessage defaultMessage="Require Organization 2FA" id="SetupGuide.2FARequirements.Action" />,
        onClick: () => router.push(getDashboardRoute(account, 'security')),
      },
    },
    chartOfAccountsForCollectives: {
      title: (
        <FormattedMessage
          defaultMessage="Extend chart of accounts to managed funds"
          id="SetupGuide.ChartOfAccountsForCollectives"
        />
      ),
      description: (
        <FormattedMessage
          defaultMessage="Adapt your chart of accounts to include accounting categories specific to hosted collectives and managed funds. This ensures that all expenses and added funds are clearly accounted for separate from your own organizational finances."
          id="SetupGuide.ChartOfAccountsForCollectives.Description"
        />
      ),
      id: 'chart-of-accounts-for-collectives',
      completed:
        'host' in account &&
        account.host?.accountingCategories?.nodes?.filter(c => c.appliesTo === 'HOSTED_COLLECTIVES').length > 0,
      requiresUpgrade: planFeatures && !planFeatures.CHART_OF_ACCOUNTS,
      action: {
        label: (
          <FormattedMessage
            defaultMessage="Extend chart of accounts"
            id="SetupGuide.ChartOfAccountsForCollectives.Action"
          />
        ),
        onClick: () => router.push(getDashboardRoute(account, 'chart-of-accounts')),
      },
    },
    contributionPolicy: {
      title: <FormattedMessage defaultMessage="Set your contribution policy" id="SetupGuide.ContributionPolicy" />,
      description: (
        <FormattedMessage
          defaultMessage="Describe your contribution policy to align expectations and build trust with contributors."
          id="SetupGuide.ContributionPolicy.Description"
        />
      ),
      id: 'contribution-policy',
      completed: 'contributionPolicy' in account && !isNil(account.contributionPolicy),
      action: {
        label: (
          <FormattedMessage defaultMessage="Set up contribution policy" id="SetupGuide.ContributionPolicy.Action" />
        ),
        onClick: () => router.push(getDashboardRoute(account, 'policies')),
      },
    },

    hostingFees: {
      title: <FormattedMessage defaultMessage="Set collective hosting fees" id="SetupGuide.HostingFees" />,
      description: (
        <FormattedMessage
          defaultMessage="The platform enables you to automatically collect hosting fees from your hosted collectives. Fees are applied to contributions and added funds. Set your default hosting fees, they will be applied to all collectives (while allowing you to also set custom fees for specific collectives)."
          id="SetupGuide.HostingFees.Description"
        />
      ),
      id: 'hosting-fees',
      // We use > 0 because the default value is 0.
      completed: 'host' in account && account.host?.hostFeePercent > 0,
      requiresUpgrade: planFeatures && !planFeatures.CHARGE_HOSTING_FEES,
      action: {
        label: <FormattedMessage defaultMessage="Set up hosting fees" id="SetupGuide.HostingFees.Action" />,
        onClick: () => router.push(getDashboardRoute(account, 'fiscal-hosting')),
      },
    },
    hostApplications: {
      title: <FormattedMessage defaultMessage="Enable collective applications" id="SetupGuide.HostApplications" />,
      description: (
        <FormattedMessage
          defaultMessage="Open your doors to collectives. Interested groups will be able to submit applications from your public profile page."
          id="SetupGuide.HostApplications.Description"
        />
      ),
      id: 'host-applications',
      completed: account.settings?.apply === true,
      requiresUpgrade: planFeatures && !planFeatures.RECEIVE_HOST_APPLICATIONS,
      action: {
        label: <FormattedMessage defaultMessage="Enable applications" id="SetupGuide.HostApplications.Action" />,
        onClick: () => router.push(getDashboardRoute(account, 'fiscal-hosting')),
      },
    },
  };

  return [
    {
      id: 'platform-basics',
      image: <Image src="/static/images/welcome/planets.png" alt="PlatformBasics" width={40} height={40} />,
      title: <FormattedMessage defaultMessage="Platform Basics" id="Welcome.Organization.PlatformBasics" />,
      description: (
        <FormattedMessage
          defaultMessage="Make contributions, submit expenses and get paid"
          id="Welcome.Organization.PlatformBasics.Description"
        />
      ),
      longDescription: (
        <FormattedMessage
          defaultMessage="You can start using some functionalities without setting anything up. Read about their documentation for the best practices."
          id="Welcome.Organization.PlatformBasics.LongDescription"
        />
      ),
      className: 'bg-blue-50',
      steps: [allSteps.profilePage, allSteps.accountTwofa],
      documentation: [
        {
          title: (
            <FormattedMessage
              defaultMessage="Getting Started with Open Collective"
              id="SetupGuide.PlatformBasics.Doc1.Title"
            />
          ),
          description: (
            <FormattedMessage
              defaultMessage="Learn how to create your account, set up your profile, and understand the dashboard."
              id="SetupGuide.PlatformBasics.Doc1.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/getting-started/getting-started',
        },
        {
          title: (
            <FormattedMessage
              defaultMessage="Submitting and Tracking Expenses"
              id="SetupGuide.PlatformBasics.Doc2.Title"
            />
          ),
          description: (
            <FormattedMessage
              defaultMessage="Learn how to submit invoices and reimbursements and track expense status from draft to payment."
              id="SetupGuide.PlatformBasics.Doc2.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/expenses-and-getting-paid/submitting-expenses',
        },
        {
          title: (
            <FormattedMessage defaultMessage="Understanding Contributions" id="SetupGuide.PlatformBasics.Doc3.Title" />
          ),
          description: (
            <FormattedMessage
              defaultMessage="Discover how to support projects through one-time or recurring donations and various payment methods."
              id="SetupGuide.PlatformBasics.Doc3.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/giving-to-collectives/contributing',
        },
      ],
    },
    {
      id: 'money-management',
      className: 'bg-green-50',
      image: <Image src="/static/images/welcome/tickets.png" alt="PlatformBasics" width={42} height={40} />,
      title: <FormattedMessage defaultMessage="Money Management" id="Welcome.Organization.MoneyManagement" />,
      description: (
        <FormattedMessage
          defaultMessage="Create accounts, add funds and pay expenses"
          id="Welcome.Organization.MoneyManagement.Description"
        />
      ),
      steps: sortSteps([allSteps.inviteAdmins, allSteps.twofaPolicy]),
      documentation: [
        {
          title: (
            <FormattedMessage defaultMessage="Managing Money and Budgets" id="SetupGuide.MoneyManagement.Doc1.Title" />
          ),
          description: (
            <FormattedMessage
              defaultMessage="Track your collective's finances with transparent budgets and manage projects with separate budgets."
              id="SetupGuide.MoneyManagement.Doc1.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/collectives/managing-money',
        },
        {
          title: (
            <FormattedMessage
              defaultMessage="Submitting and Tracking Expenses"
              id="SetupGuide.PlatformBasics.Doc2.Title"
            />
          ),
          description: (
            <FormattedMessage
              defaultMessage="Learn how to submit invoices and reimbursements and track expense status from draft to payment."
              id="SetupGuide.PlatformBasics.Doc2.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/expenses-and-getting-paid/submitting-expenses',
        },
        {
          title: (
            <FormattedMessage defaultMessage="Understanding the Ledger" id="SetupGuide.MoneyManagement.Doc3.Title" />
          ),
          description: (
            <FormattedMessage
              defaultMessage="Access detailed transaction records showing all financial activity including contributions, expenses, and added funds."
              id="SetupGuide.MoneyManagement.Doc3.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/advanced/ledger',
        },
      ],
    },
    {
      id: 'crowdfunding',
      image: <Image src="/static/images/welcome/jar.png" alt="Crowdfunding" width={42} height={40} />,
      className: 'bg-red-50',
      title: <FormattedMessage defaultMessage="Crowdfunding" id="solutions.features.crowdfunding" />,
      description: (
        <FormattedMessage
          defaultMessage="Receive crowdfunding contributions and fundraise"
          id="Welcome.Organization.Crowdfunding.Description"
        />
      ),
      steps: sortSteps([allSteps.inviteAdmins, allSteps.stripe, allSteps.contributionPolicy]),
      documentation: [
        {
          title: <FormattedMessage defaultMessage="Setting Goals and Tiers" id="SetupGuide.Crowdfunding.Doc1.Title" />,
          description: (
            <FormattedMessage
              defaultMessage="Create contribution tiers to encourage donations and set financial goals to track your progress."
              id="SetupGuide.Crowdfunding.Doc1.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/collectives/raising-money/setting-goals-and-tiers',
        },
        {
          title: (
            <FormattedMessage
              defaultMessage="Creating Projects for Fundraising"
              id="SetupGuide.Crowdfunding.Doc2.Title"
            />
          ),
          description: (
            <FormattedMessage
              defaultMessage="Launch lightweight fundraising projects with their own balance, contribution tiers, and goals."
              id="SetupGuide.Crowdfunding.Doc2.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/collectives/managing-money/projects',
        },
        {
          title: <FormattedMessage defaultMessage="Custom Fundraising URLs" id="SetupGuide.Crowdfunding.Doc3.Title" />,
          description: (
            <FormattedMessage
              defaultMessage="Create customized donation links with preset amounts, intervals, and contributor types."
              id="SetupGuide.Crowdfunding.Doc3.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/collectives/raising-money/creating-custom-fundraising-urls',
        },
      ],
    },
    {
      id: 'expense-automations',
      className: 'bg-yellow-50',
      image: <Image src="/static/images/welcome/stars.png" alt="PlatformBasics" width={42} height={40} />,
      title: <FormattedMessage defaultMessage="Expense Automations" id="Welcome.Organization.ExpenseAutomations" />,
      description: (
        <FormattedMessage
          defaultMessage="Pay expenses through payment processors"
          id="Welcome.Organization.ExpenseAutomations.Description"
        />
      ),
      steps: sortSteps([allSteps.wise, allSteps.expensePolicy, allSteps.chartOfAccounts, allSteps.twofaPolicy]),
      documentation: [
        {
          title: (
            <FormattedMessage
              defaultMessage="Paying Expenses with Wise"
              id="SetupGuide.ExpenseAutomations.Doc1.Title"
            />
          ),
          description: (
            <FormattedMessage
              defaultMessage="This integration can be used to automate expense payment by providing a one-click solution for paying expenses."
              id="SetupGuide.ExpenseAutomations.Doc1.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/fiscal-hosts/expense-payment/paying-expenses-with-wise',
        },
        {
          title: <FormattedMessage defaultMessage="Recurring Expenses" id="SetupGuide.ExpenseAutomations.Doc2.Title" />,
          description: (
            <FormattedMessage
              defaultMessage="Set up expenses that automatically recur weekly, monthly, or yearly with optional end dates."
              id="SetupGuide.ExpenseAutomations.Doc2.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/expenses-and-getting-paid/submitting-expenses/recurring-expenses',
        },
        {
          title: (
            <FormattedMessage
              defaultMessage="Tagging Expenses for Organization"
              id="SetupGuide.ExpenseAutomations.Doc3.Title"
            />
          ),
          description: (
            <FormattedMessage
              defaultMessage="Categorize and organize expenses with custom tags for budgeting and reporting purposes."
              id="SetupGuide.ExpenseAutomations.Doc3.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/collectives/managing-money/tagging-expenses',
        },
      ],
    },
    {
      id: 'fund-grants',
      className: 'bg-purple-50',
      image: <Image src="/static/images/welcome/badge.png" alt="PlatformBasics" width={41} height={40} />,
      title: <FormattedMessage defaultMessage="Fund & Grants" id="Welcome.Organization.FundGrants" />,
      description: (
        <FormattedMessage
          defaultMessage="Setup funds and distribute grants"
          id="Welcome.Organization.FundGrants.Description"
        />
      ),
      steps: sortSteps([
        allSteps.stripe,
        allSteps.chartOfAccounts,
        allSteps.contributionPolicy,
        allSteps.expensePolicy,
      ]),
      documentation: [
        {
          title: <FormattedMessage defaultMessage="Understanding Funds" id="SetupGuide.FundGrants.Doc1.Title" />,
          description: (
            <FormattedMessage
              defaultMessage="Learn the ins-and-outs of Funds on Open Collective."
              id="SetupGuide.FundGrants.Doc1.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/fiscal-hosts/funds-and-grants/understanding-funds',
        },
        {
          title: <FormattedMessage defaultMessage="Managing Grants" id="SetupGuide.FundGrants.Doc2.Title" />,
          description: (
            <FormattedMessage
              defaultMessage="Learn how to set up and manage grants from your fund to support projects and initiatives."
              id="SetupGuide.FundGrants.Doc2.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/fiscal-hosts/funds-and-grants/grants',
        },
      ],
    },
    {
      id: 'fiscal-hosting',
      className: 'bg-orange-50',
      image: <Image src="/static/images/welcome/place.png" alt="PlatformBasics" width={42} height={40} />,
      title: <FormattedMessage defaultMessage="Fiscal Hosting" id="editCollective.fiscalHosting" />,
      description: (
        <FormattedMessage
          defaultMessage="Manage money on behalf of other groups and collectives"
          id="Welcome.Organization.FiscalHosting.Description"
        />
      ),
      steps: sortSteps([
        allSteps.hosting,
        allSteps.hostingFees,
        allSteps.hostApplications,
        allSteps.chartOfAccountsForCollectives,
      ]),
      documentation: [
        {
          title: (
            <FormattedMessage defaultMessage="Understanding Fiscal Hosts" id="SetupGuide.FiscalHosting.Doc1.Title" />
          ),
          description: (
            <FormattedMessage
              defaultMessage="Learn how fiscal hosts provide legal status and handle finances for collectives without formal incorporation."
              id="SetupGuide.FiscalHosting.Doc1.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/fiscal-hosts/fiscal-hosts',
        },
        {
          title: <FormattedMessage defaultMessage="Becoming a Fiscal Host" id="SetupGuide.FiscalHosting.Doc2.Title" />,
          description: (
            <FormattedMessage
              defaultMessage="Learn why and how to become a fiscal host to support multiple collectives."
              id="SetupGuide.FiscalHosting.Doc2.Description"
            />
          ),
          url: 'https://documentation.opencollective.com/fiscal-hosts/why-become-a-fiscal-host',
        },
        {
          url: 'https://documentation.opencollective.com/fiscal-hosts/expense-payment/paying-expenses-as-a-fiscal-host',
          title: (
            <FormattedMessage
              defaultMessage="Paying Expenses as a Fiscal Host"
              id="SetupGuide.FiscalHosting.Doc3.Title"
            />
          ),
          description: (
            <FormattedMessage
              defaultMessage="As a Fiscal Host admin, you will need to approve your Collective’s expenses and ensure they include all necessary information before being paid"
              id="SetupGuide.FiscalHosting.Doc3.Description"
            />
          ),
        },
      ],
    },
  ];
};
