import React from 'react';
import { compact, isEmpty, isNil, orderBy } from 'lodash';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { getPolicy } from '@/lib/policies';
import { getDashboardRoute } from '@/lib/url-helpers';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import {
  ToggleFiscalHostingButton,
  ToggleMoneyManagementButton,
} from '@/components/edit-collective/sections/FiscalHosting';
import { Button } from '@/components/ui/Button';

import { hasAccountHosting, hasAccountMoneyManagement } from './collective';

export type Step = {
  id?: string;
  title: string | ReactNode;
  completed: boolean;
  description: string | ReactNode;
  requiresUpgrade?: boolean;
  action?: ReactNode;
  disabledMessage?: string | ReactNode;
  documentation?: {
    title: string | ReactNode;
    url: string;
  };
};

export type Category = {
  id: string;
  image: ReactNode;
  title: string | ReactNode;
  description: string | ReactNode;
  longDescription?: string | ReactNode;
  className?: string;
  steps?: Array<({ account, router, LoggedInUser }) => Step>;
};

const RedirectButton = ({
  url,
  children,
  router,
  disabled,
}: {
  url: string;
  children: ReactNode;
  router: AppRouterInstance;
  disabled?: boolean;
}) => {
  return (
    <Button size="xs" onClick={() => router.push(url)} disabled={disabled}>
      {children}
    </Button>
  );
};

export const sortSteps = (steps: Step[]) =>
  orderBy(compact(steps), step => (step.requiresUpgrade ? -1 : step.completed ? 1 : 0), ['desc', 'desc']);

const ALL_STEPS = {
  inviteAdmins: ({ account, router }) => ({
    id: 'invite-admins',
    title: <FormattedMessage defaultMessage="Invite additional admins" id="SetupGuide.InviteAdmins" />,
    completed: account.admins?.totalCount >= 2 || account.adminInvites?.length > 0,
    description: (
      <FormattedMessage
        defaultMessage="We require there be at least two admins in the organizations. This guarantees that no one person holds exclusive access to the account. It also reduces the potential for fraudulent use of the account."
        id="SetupGuide.InviteAdmins.Description"
      />
    ),
    action: (
      <RedirectButton url={getDashboardRoute(account, 'team')} router={router}>
        <FormattedMessage defaultMessage="Invite Administrators" id="InviteAdministrators" />
      </RedirectButton>
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Adding Team Members" id="SetupGuide.InviteAdmins.Documentation" />,
      url: 'https://documentation.opencollective.com/getting-started/adding-and-removing-team-members',
    },
  }),
  stripe: ({ account, router }) => ({
    id: 'stripe',
    title: <FormattedMessage defaultMessage="Set up Stripe for receiving contributions" id="SetupGuide.Stripe" />,
    description: (
      <FormattedMessage
        defaultMessage="We use Stripe as a payment processor for receiving payments and contributions. Stripe itself provides many payment options including credit cards and bank transfers. Connect your account to Stripe in order to receive payments and contributions into your organization's account."
        id="SetupGuide.Stripe.Description"
      />
    ),
    completed: account.connectedAccounts?.some(ca => ca.service === 'stripe'),
    requiresUpgrade:
      'platformSubscription' in account &&
      account.platformSubscription?.plan?.features.RECEIVE_FINANCIAL_CONTRIBUTIONS === false,
    action: (
      <RedirectButton
        url={getDashboardRoute(account, 'receiving-money')}
        router={router}
        disabled={!hasAccountMoneyManagement(account)}
      >
        <FormattedMessage defaultMessage="Connect Stripe" id="SetupGuide.Stripe.Action" />
      </RedirectButton>
    ),
    disabledMessage: !hasAccountMoneyManagement(account) && (
      <FormattedMessage defaultMessage="Requires Money Management" id="SetupGuide.RequiresMoneyManagement" />
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Stripe Payments" id="SetupGuide.Stripe.Documentation" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/receiving-money/stripe',
    },
  }),
  accountTwofa: ({ LoggedInUser, router }) => ({
    id: '2FA',
    title: <FormattedMessage defaultMessage="Set up two-factor authentication (2FA)" id="SetupGuide.2FA" />,
    completed: LoggedInUser?.hasTwoFactorAuth,
    description: (
      <FormattedMessage
        defaultMessage="Two Factor Authentication (2FA) adds an extra layer of protection to your personal account (and therefore also to your organization) . 2FA will require a second (in addition to your password) unique to you identifier when logging in. This prevents unauthorized access and is critical when using the platform for real world financial activities."
        id="SetupGuide.2FA.Description"
      />
    ),
    action: (
      <RedirectButton url={getDashboardRoute(LoggedInUser?.collective, 'user-security')} router={router}>
        <FormattedMessage defaultMessage="Set up 2FA" id="SetupGuide.2FA.Action" />,
      </RedirectButton>
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Security For Accounts" id="SetupGuide.2FA.Documentation" />,
      url: 'https://documentation.opencollective.com/advanced/security-for-accounts',
    },
  }),
  wise: ({ account, router }) => ({
    id: 'wise',
    title: <FormattedMessage defaultMessage="Set up Wise for payouts" id="SetupGuide.Wise" />,
    description: (
      <FormattedMessage
        defaultMessage="We use Wise for seamless expense payments. Wise provides global coverage and competitive payment processing fees. Connect to your Wise account in order to pay expenses with a click of a button."
        id="SetupGuide.Wise.Description"
      />
    ),
    completed: account.connectedAccounts?.some(ca => ca.service === 'transferwise'),
    requiresUpgrade:
      'platformSubscription' in account && account.platformSubscription?.plan?.features.TRANSFERWISE === false,
    action: (
      <RedirectButton
        url={getDashboardRoute(account, 'sending-money')}
        router={router}
        disabled={!hasAccountMoneyManagement(account)}
      >
        <FormattedMessage defaultMessage="Connect Wise" id="SetupGuide.Wise.Action" />
      </RedirectButton>
    ),
    disabledMessage: !hasAccountMoneyManagement(account) && (
      <FormattedMessage defaultMessage="Requires Money Management" id="SetupGuide.RequiresMoneyManagement" />
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Paying Expenses with Wise" id="SetupGuide.Wise.Documentation" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/expense-payment/paying-expenses-with-wise',
    },
  }),
  expensePolicy: ({ account, router }) => ({
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
    action: (
      <RedirectButton
        url={getDashboardRoute(account, 'policies#expenses')}
        router={router}
        disabled={!hasAccountMoneyManagement(account)}
      >
        <FormattedMessage defaultMessage="Set up expense policies" id="SetupGuide.Expenses" />
      </RedirectButton>
    ),
    disabledMessage: !hasAccountMoneyManagement(account) && (
      <FormattedMessage defaultMessage="Requires Money Management" id="SetupGuide.RequiresMoneyManagement" />
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Fiscal Host Policies" id="FiscalHostPolicies" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/setting-up-a-fiscal-host/fiscal-host-policies',
    },
  }),
  chartOfAccounts: ({ account, router }) => ({
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
    requiresUpgrade:
      'platformSubscription' in account && account.platformSubscription?.plan?.features.CHART_OF_ACCOUNTS === false,
    action: (
      <RedirectButton
        url={getDashboardRoute(account, 'chart-of-accounts')}
        router={router}
        disabled={!hasAccountMoneyManagement(account)}
      >
        <FormattedMessage defaultMessage="Add chart of accounts" id="SetupGuide.ChartOfAccounts.Action" />
      </RedirectButton>
    ),
    disabledMessage: !hasAccountMoneyManagement(account) && (
      <FormattedMessage defaultMessage="Requires Money Management" id="SetupGuide.RequiresMoneyManagement" />
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Chart of Accounts" id="IzFWHI" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/chart-of-accounts',
    },
  }),
  profilePage: ({ account, router }) => ({
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
    action: (
      <RedirectButton url={getDashboardRoute(account, 'info')} router={router}>
        <FormattedMessage defaultMessage="Edit your profile" id="SetupGuide.PublicProfile.Action" />
      </RedirectButton>
    ),

    documentation: {
      title: (
        <FormattedMessage defaultMessage="Editing your Profile Page" id="SetupGuide.PublicProfile.Documentation" />
      ),
      url: 'https://documentation.opencollective.com/getting-started/editing-your-profile-page',
    },
  }),
  hosting: ({ account }) => ({
    title: <FormattedMessage defaultMessage="Enable fiscal hosting" id="SetupGuide.EnableHosting" />,
    description: (
      <FormattedMessage
        defaultMessage="Hosting enables you to manage other people's money in addition to your own organization's finances. Enable hosted collectives to allow other groups to manage their finances under your fiscal and legal umbrella. Enable hosted funds to hold institutional funds for grant distribution."
        id="SetupGuide.EnableHosting.Description"
      />
    ),
    id: 'enable-hosting',
    completed: hasAccountHosting(account),
    action: (
      <ToggleFiscalHostingButton account={account} refetchQueries={['SetupGuide']} size="xs">
        {hasAccountHosting(account) ? (
          <FormattedMessage defaultMessage="Disable fiscal hosting" id="SetupGuide.DisableEnableHosting" />
        ) : (
          <FormattedMessage defaultMessage="Enable fiscal hosting" id="SetupGuide.EnableHosting" />
        )}
      </ToggleFiscalHostingButton>
    ),
    disabledMessage: !hasAccountMoneyManagement(account) && (
      <FormattedMessage defaultMessage="Requires Money Management" id="SetupGuide.RequiresMoneyManagement" />
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Setting up a Fiscal Host" id="SetupGuide.EnableHosting.Documentation" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/setting-up-a-fiscal-host',
    },
  }),
  moneyManagement: ({ account }) => ({
    id: 'money-management',
    title: <FormattedMessage defaultMessage="Enable money management" id="SetupGuide.MoneyManagement" />,
    description: (
      <FormattedMessage
        defaultMessage="Money management enables you to add funds to your account and pay expenses. This is a critical step towards being able to fully use the platform for your financial operations."
        id="SetupGuide.MoneyManagement.Description"
      />
    ),
    completed: hasAccountMoneyManagement(account),
    action: (
      <ToggleMoneyManagementButton account={account} refetchQueries={['SetupGuide']} size="xs">
        {hasAccountMoneyManagement(account) ? (
          <FormattedMessage defaultMessage="Disable Money Management" id="SetupGuide.DisableMoneyManagement" />
        ) : (
          <FormattedMessage defaultMessage="Enable Money Management" id="SetupGuide.EnableMoneyManagement" />
        )}
      </ToggleMoneyManagementButton>
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Receiving Money" id="editCollective.receivingMoney" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/receiving-money',
    },
  }),
  twofaPolicy: ({ account, router }) => ({
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
    action: (
      <RedirectButton url={getDashboardRoute(account, 'security')} router={router}>
        <FormattedMessage defaultMessage="Require Organization 2FA" id="SetupGuide.2FARequirements.Action" />
      </RedirectButton>
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Fiscal Host Security" id="SetupGuide.2FARequirements.Documentation" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/setting-up-a-fiscal-host/fiscal-host-security',
    },
  }),
  chartOfAccountsForCollectives: ({ account, router }) => ({
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
    requiresUpgrade:
      'platformSubscription' in account && account.platformSubscription?.plan?.features.CHART_OF_ACCOUNTS === false,
    action: (
      <RedirectButton
        url={getDashboardRoute(account, 'chart-of-accounts')}
        router={router}
        disabled={!hasAccountMoneyManagement(account)}
      >
        <FormattedMessage
          defaultMessage="Extend chart of accounts"
          id="SetupGuide.ChartOfAccountsForCollectives.Action"
        />
      </RedirectButton>
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Chart of Accounts" id="IzFWHI" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/chart-of-accounts',
    },
  }),
  contributionPolicy: ({ account, router }) => ({
    title: <FormattedMessage defaultMessage="Set your contribution policy" id="SetupGuide.ContributionPolicy" />,
    description: (
      <FormattedMessage
        defaultMessage="Describe your contribution policy to align expectations and build trust with contributors."
        id="SetupGuide.ContributionPolicy.Description"
      />
    ),
    id: 'contribution-policy',
    completed: 'contributionPolicy' in account && !isNil(account.contributionPolicy),
    action: (
      <RedirectButton
        url={getDashboardRoute(account, 'policies')}
        router={router}
        disabled={!hasAccountMoneyManagement(account)}
      >
        <FormattedMessage defaultMessage="Set up contribution policy" id="SetupGuide.ContributionPolicy.Action" />
      </RedirectButton>
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Fiscal Host Policies" id="FiscalHostPolicies" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/setting-up-a-fiscal-host/fiscal-host-policies',
    },
  }),
  hostingFees: ({ account, router }) => ({
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
    requiresUpgrade:
      'platformSubscription' in account && account.platformSubscription?.plan?.features.CHARGE_HOSTING_FEES === false,
    action: (
      <RedirectButton
        url={getDashboardRoute(account, 'fiscal-hosting')}
        router={router}
        disabled={!hasAccountHosting(account)}
      >
        <FormattedMessage defaultMessage="Set up hosting fees" id="SetupGuide.HostingFees.Action" />
      </RedirectButton>
    ),
    disabledMessage: !hasAccountHosting(account) && (
      <FormattedMessage defaultMessage="Requires Fiscal Hosting" id="SetupGuide.RequiresFiscalHosting" />
    ),
    documentation: {
      title: (
        <FormattedMessage defaultMessage="Setting your Fiscal Host Fees" id="SetupGuide.HostingFees.Documentation" />
      ),
      url: 'https://documentation.opencollective.com/fiscal-hosts/setting-up-a-fiscal-host/setting-your-fiscal-host-fees',
    },
  }),
  hostApplications: ({ account, router }) => ({
    title: <FormattedMessage defaultMessage="Enable collective applications" id="SetupGuide.HostApplications" />,
    description: (
      <FormattedMessage
        defaultMessage="Open your doors to collectives. Interested groups will be able to submit applications from your public profile page."
        id="SetupGuide.HostApplications.Description"
      />
    ),
    id: 'host-applications',
    completed: account.settings?.apply === true,
    requiresUpgrade:
      'platformSubscription' in account &&
      account.platformSubscription?.plan?.features.RECEIVE_HOST_APPLICATIONS === false,
    action: (
      <RedirectButton
        url={getDashboardRoute(account, 'fiscal-hosting')}
        router={router}
        disabled={!hasAccountHosting(account)}
      >
        <FormattedMessage defaultMessage="Enable applications" id="SetupGuide.HostApplications.Action" />
      </RedirectButton>
    ),
    disabledMessage: !hasAccountHosting(account) && (
      <FormattedMessage defaultMessage="Requires Fiscal Hosting" id="SetupGuide.RequiresFiscalHosting" />
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Fiscal Hosts" id="helpAndSupport.fiscalHosts" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/fiscal-hosts',
    },
  }),
};

export const ALL_CATEGORIES = {
  platformBasics: {
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
    steps: [ALL_STEPS.profilePage, ALL_STEPS.accountTwofa],
  },
  moneyManagement: {
    className: 'bg-green-50',
    image: <Image src="/static/images/welcome/tickets.png" alt="PlatformBasics" width={42} height={40} />,
    title: <FormattedMessage defaultMessage="Money Management" id="Welcome.Organization.MoneyManagement" />,
    description: (
      <FormattedMessage
        defaultMessage="Create accounts, add funds and pay expenses"
        id="Welcome.Organization.MoneyManagement.Description"
      />
    ),
    steps: [ALL_STEPS.moneyManagement, ALL_STEPS.inviteAdmins, ALL_STEPS.twofaPolicy],
  },
  crowdfunding: {
    image: <Image src="/static/images/welcome/jar.png" alt="Crowdfunding" width={42} height={40} />,
    className: 'bg-red-50',
    title: <FormattedMessage defaultMessage="Crowdfunding" id="solutions.features.crowdfunding" />,
    description: (
      <FormattedMessage
        defaultMessage="Receive crowdfunding contributions and fundraise"
        id="Welcome.Organization.Crowdfunding.Description"
      />
    ),
    steps: [ALL_STEPS.moneyManagement, ALL_STEPS.stripe, ALL_STEPS.inviteAdmins, ALL_STEPS.contributionPolicy],
  },
  expenseAutomations: {
    className: 'bg-yellow-50',
    image: <Image src="/static/images/welcome/stars.png" alt="PlatformBasics" width={42} height={40} />,
    title: <FormattedMessage defaultMessage="Expense Automations" id="Welcome.Organization.ExpenseAutomations" />,
    description: (
      <FormattedMessage
        defaultMessage="Pay expenses through payment processors"
        id="Welcome.Organization.ExpenseAutomations.Description"
      />
    ),
    steps: [
      ALL_STEPS.moneyManagement,
      ALL_STEPS.wise,
      ALL_STEPS.expensePolicy,
      ALL_STEPS.chartOfAccounts,
      ALL_STEPS.twofaPolicy,
    ],
  },
  fundGrants: {
    className: 'bg-purple-50',
    image: <Image src="/static/images/welcome/badge.png" alt="PlatformBasics" width={41} height={40} />,
    title: <FormattedMessage defaultMessage="Fund & Grants" id="Welcome.Organization.FundGrants" />,
    description: (
      <FormattedMessage
        defaultMessage="Setup funds and distribute grants"
        id="Welcome.Organization.FundGrants.Description"
      />
    ),
    steps: [
      ALL_STEPS.moneyManagement,
      ALL_STEPS.stripe,
      ALL_STEPS.chartOfAccounts,
      ALL_STEPS.contributionPolicy,
      ALL_STEPS.expensePolicy,
    ],
  },
  fiscalHosting: {
    className: 'bg-orange-50',
    image: <Image src="/static/images/welcome/place.png" alt="PlatformBasics" width={42} height={40} />,
    title: <FormattedMessage defaultMessage="Fiscal Hosting" id="editCollective.fiscalHosting" />,
    description: (
      <FormattedMessage
        defaultMessage="Manage money on behalf of other groups and collectives"
        id="Welcome.Organization.FiscalHosting.Description"
      />
    ),
    steps: [
      ALL_STEPS.moneyManagement,
      ALL_STEPS.hosting,
      ALL_STEPS.hostingFees,
      ALL_STEPS.hostApplications,
      ALL_STEPS.chartOfAccountsForCollectives,
    ],
  },
};
