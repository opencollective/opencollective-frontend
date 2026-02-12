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

import type { WelcomeOrganizationQuery } from './graphql/types/v2/graphql';
import { hasAccountMoneyManagement } from './collective';
import type LoggedInUser from './LoggedInUser';

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

type MakeStepParams = {
  account: WelcomeOrganizationQuery['account'];
  router: AppRouterInstance;
  LoggedInUser: LoggedInUser;
};

type MakeStep = (params: MakeStepParams) => Step;

export type Category = {
  id: string;
  image: ReactNode;
  title: string | ReactNode;
  description: string | ReactNode;
  longDescription?: string | ReactNode;
  className?: string;
  steps?: Array<MakeStep>;
  onClick?: () => void;
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
    description:
      account.type === 'COLLECTIVE' ? (
        <FormattedMessage
          defaultMessage="A collective works best with multiple administrators to help manage its activities. Invite at least one more admin to help you manage your Collective."
          id="SetupGuide.InviteAdmins.CollectiveDescription"
        />
      ) : (
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
        defaultMessage="We use Stripe as a payment processor for receiving payments and contributions. Stripe itself provides many payment options including credit cards and bank transfers. Connect your account to Stripe in order to receive payments and contributions into your Organization's account."
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
        defaultMessage="Two Factor Authentication (2FA) adds an extra layer of protection to your personal account (and therefore also to your Organization) . 2FA will require a second (in addition to your password) unique to you identifier when logging in. This prevents unauthorized access and is critical when using the platform for real world financial activities."
        id="SetupGuide.2FA.Description"
      />
    ),
    action: (
      <RedirectButton url={getDashboardRoute(LoggedInUser, 'user-security')} router={router}>
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
  collectiveExpensePolicy: ({ account, router }) => ({
    title: <FormattedMessage defaultMessage="Set your expense policies" id="SetupGuide.ExpensesPolicy" />,
    description: (
      <FormattedMessage
        defaultMessage="Provide information and guidance to expense submitters about the types of expenses you are willing to pay, and what information you need to make the process easier."
        id="SetupGuide.CollectiveExpensesPolicy.Description"
      />
    ),
    id: 'collective-expenses-policy',
    completed:
      'policies' in account &&
      !isEmpty(account.policies?.EXPENSE_POLICIES?.invoicePolicy) &&
      !isEmpty(account.policies?.EXPENSE_POLICIES?.receiptPolicy),
    action: (
      <RedirectButton url={getDashboardRoute(account, 'policies#expenses')} router={router}>
        <FormattedMessage defaultMessage="Set up expense policies" id="SetupGuide.Expenses" />
      </RedirectButton>
    ),

    documentation: {
      title: (
        <FormattedMessage defaultMessage="Spending Money" id="SetupGuide.CollectiveExpensesPolicy.Documentation" />
      ),
      url: 'https://documentation.opencollective.com/collectives/spending-money',
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
        defaultMessage="Your public profile lets the world know you are active on the platform. It tells your story with a written description of your {type, select, ORGANIZATION {Organization} COLLECTIVE {Collective} other {Account}}, your mission and what are your goals using the platform."
        id="SetupGuide.PublicProfile.Description"
        values={{
          type: account.type,
        }}
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
        defaultMessage="Fiscal hosting enables you to manage other Collectives and groups' money under your fiscal and legal umbrella. In addition to your own Organization's finances."
        id="SetupGuide.EnableHosting.Description"
      />
    ),
    id: 'enable-hosting',
    completed: Boolean(account['hasHosting']),
    action: (
      <ToggleFiscalHostingButton account={account} refetchQueries={['WelcomeOrganization']} size="xs">
        {account['hasHosting'] ? (
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
      <ToggleMoneyManagementButton account={account} refetchQueries={['WelcomeOrganization']} size="xs">
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
        defaultMessage="To fully protect your Organization, It is important that all your admins enable Two Factor Authentication (2FA) in their accounts. We recommend you enable the setting that forces all admins to also setup 2FA."
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
        defaultMessage="Adapt your chart of accounts to include accounting categories specific to hosted Collectives and managed funds. This ensures that all expenses and added funds are clearly accounted for separate from your own organizational finances."
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
        disabled={account.type !== 'COLLECTIVE' && !hasAccountMoneyManagement(account)}
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
    title: <FormattedMessage defaultMessage="Set Collective hosting fees" id="SetupGuide.HostingFees" />,
    description: (
      <FormattedMessage
        defaultMessage="The platform enables you to automatically collect hosting fees from your hosted Collectives. Fees are applied to contributions and added funds. Set your default hosting fees, they will be applied to all Collectives (while allowing you to also set custom fees for specific Collectives)."
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
        disabled={!account['hasHosting']}
      >
        <FormattedMessage defaultMessage="Set up hosting fees" id="SetupGuide.HostingFees.Action" />
      </RedirectButton>
    ),
    disabledMessage: !account['hasHosting'] && (
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
    title: <FormattedMessage defaultMessage="Enable Collective applications" id="SetupGuide.HostApplications" />,
    description: (
      <FormattedMessage
        defaultMessage="Open your doors to Collectives. Interested groups will be able to submit applications from your public profile page."
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
        disabled={!account['hasHosting']}
      >
        <FormattedMessage defaultMessage="Enable applications" id="SetupGuide.HostApplications.Action" />
      </RedirectButton>
    ),
    disabledMessage: !account['hasHosting'] && (
      <FormattedMessage defaultMessage="Requires Fiscal Hosting" id="SetupGuide.RequiresFiscalHosting" />
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Fiscal Hosts" id="helpAndSupport.fiscalHosts" />,
      url: 'https://documentation.opencollective.com/fiscal-hosts/fiscal-hosts',
    },
  }),
  customizeProfileSections: ({ account, router }) => ({
    id: 'customize-profile-sections',
    title: <FormattedMessage defaultMessage="Customize profile sections" id="SetupGuide.CustomizeProfileSections" />,
    description: (
      <FormattedMessage
        defaultMessage="Highlight important information on your public profile by customizing the sections displayed."
        id="SetupGuide.CustomizeProfileSections.Description"
      />
    ),
    completed: !isNil(account.settings?.collectivePage?.sections),
    action: (
      <RedirectButton url={getDashboardRoute(account, 'collective-page')} router={router}>
        <FormattedMessage defaultMessage="Setup profile sections" id="SetupGuide.CustomizeProfileSections.Action" />
      </RedirectButton>
    ),
  }),
  findAndApplyHosting: ({ account, router }) => ({
    id: 'find-and-apply-hosting',
    title: <FormattedMessage defaultMessage="Apply to a Fiscal Host" id="collective.edit.host.findHost.title" />,
    description: (
      <FormattedMessage
        defaultMessage="If you don't have a fiscal host yet, you can find one that suits your needs on the platform and apply to them directly from your profile."
        id="SetupGuide.FindAndApplyHosting.Description"
      />
    ),
    completed: Boolean('hostApplication' in account && account.hostApplication),
    action: (
      <RedirectButton url={`/${account.slug}/accept-financial-contributions/host`} router={router}>
        <FormattedMessage defaultMessage="Find a Fiscal Host" id="join.findAFiscalHost" />
      </RedirectButton>
    ),
    documentation: {
      title: (
        <FormattedMessage defaultMessage="Choosing a Fiscal Host" id="SetupGuide.FindAndApplyHosting.Documentation" />
      ),
      url: 'https://documentation.opencollective.com/collectives/choosing-a-fiscal-host',
    },
  }),
  setupTiers: ({ account, router }) => ({
    id: 'setup-tiers',
    title: <FormattedMessage defaultMessage="Set up contribution tiers" id="SetupGuide.SetupTiers" />,
    description: (
      <FormattedMessage
        defaultMessage="Contribution tiers allow you to define different levels of support for your contributors. Set up tiers to encourage more contributions and build a community around your organization."
        id="SetupGuide.SetupTiers.Description"
      />
    ),
    completed: 'tiers' in account && account.tiers.nodes?.length > 0,
    action: (
      <RedirectButton url={getDashboardRoute(account, 'tiers')} router={router}>
        <FormattedMessage defaultMessage="Set up tiers" id="SetupGuide.SetupTiers.Action" />
      </RedirectButton>
    ),
  }),
  publishUpdate: ({ account, router }) => ({
    id: 'publish-update',
    title: <FormattedMessage defaultMessage="Publish your first update" id="SetupGuide.PublishUpdate" />,
    description: (
      <FormattedMessage
        defaultMessage="Keep your community informed by publishing updates about your organization's activities, milestones, and news."
        id="SetupGuide.PublishUpdate.Description"
      />
    ),
    completed: 'updates' in account && account.updates.nodes?.length > 0,
    action: (
      <RedirectButton url={getDashboardRoute(account, 'updates')} router={router}>
        <FormattedMessage defaultMessage="Publish update" id="SetupGuide.PublishUpdate.Action" />
      </RedirectButton>
    ),
    documentation: {
      title: <FormattedMessage defaultMessage="Updates and Contact" id="SetupGuide.PublishUpdate.Documentation" />,
      url: 'https://documentation.opencollective.com/advanced/keeping-your-community-updated/updates-and-contact',
    },
  }),
  createProject: ({ account, router }) => ({
    id: 'create-project',
    title: <FormattedMessage defaultMessage="Create your first project" id="SetupGuide.CreateProject" />,
    description: (
      <FormattedMessage
        defaultMessage="Projects help you organize your work and showcase specific initiatives within your collective. Create a project to highlight your efforts and engage your community."
        id="SetupGuide.CreateProject.Description"
      />
    ),
    completed: 'projects' in account && account.projects.nodes?.length > 0,
    action: (
      <RedirectButton url={getDashboardRoute(account, 'accounts')} router={router}>
        <FormattedMessage defaultMessage="Create project" id="SetupGuide.CreateProject.Action" />
      </RedirectButton>
    ),
    documentation: {
      title: (
        <FormattedMessage defaultMessage="Creating and Managing Projects" id="SetupGuide.CreateProject.Documentation" />
      ),
      url: 'https://documentation.opencollective.com/collectives/managing-money/projects',
    },
  }),
  approveExpense: ({ account, router }) => ({
    id: 'approve-expense',
    title: <FormattedMessage defaultMessage="Approve your first expense" id="SetupGuide.ApproveExpense" />,
    description: (
      <FormattedMessage
        defaultMessage="Expenses are requests for payment submitted by contributors. Approving expenses is a key step in managing your organization's finances."
        id="SetupGuide.ApproveExpense.Description"
      />
    ),
    completed: 'approvedExpenses' in account && account.approvedExpenses.nodes?.length > 0,
    action: (
      <RedirectButton url={getDashboardRoute(account, 'expenses')} router={router}>
        <FormattedMessage defaultMessage="Approve expense" id="SetupGuide.ApproveExpense.Action" />
      </RedirectButton>
    ),
    documentation: {
      title: (
        <FormattedMessage defaultMessage="Receiving incoming expenses" id="SetupGuide.ApproveExpense.Documentation" />
      ),
      url: 'https://documentation.opencollective.com/collectives/spending-money#receiving-incoming-expenses',
    },
  }),
} as const;

export const ORGANIZATION_CATEGORIES = {
  platformBasics: {
    image: <Image src="/static/images/welcome/planets.png" alt="PlatformBasics" width={40} height={40} />,
    title: <FormattedMessage defaultMessage="Platform Basics" id="Welcome.Organization.PlatformBasics" />,
    description: (
      <FormattedMessage
        defaultMessage="Make contributions, submit expenses and get paid on behalf of the organization"
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
        defaultMessage="Track your balance, create accounts, add funds and manually pay expenses"
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
        defaultMessage="Setup crowdfunding campaigns and receive contributions"
        id="Welcome.Organization.Crowdfunding.Description"
      />
    ),
    steps: [ALL_STEPS.moneyManagement, ALL_STEPS.stripe, ALL_STEPS.inviteAdmins, ALL_STEPS.contributionPolicy],
  },
  expenseAutomations: {
    className: 'bg-yellow-50',
    image: <Image src="/static/images/welcome/stars.png" alt="PlatformBasics" width={42} height={40} />,
    title: <FormattedMessage defaultMessage="Automate Payments" id="Welcome.Organization.ExpenseAutomations" />,
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
        defaultMessage="Manage money for other groups & projects, manage applications and charge hosting fees"
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

export const COLLECTIVE_CATEGORIES = {
  setupProfile: {
    image: <Image src="/static/images/welcome/eye.png" alt="SetupProfile" width={40} height={40} />,
    title: <FormattedMessage defaultMessage="Setup Public Profile" id="Welcome.Collective.SetupProfile" />,
    description: (
      <FormattedMessage
        defaultMessage="Customise your public profile and increase discoverability"
        id="Welcome.Collective.SetupProfile.Description"
      />
    ),
    longDescription: (
      <FormattedMessage
        defaultMessage="You can start using some functionalities without setting anything up. Read about their documentation for the best practices."
        id="Welcome.Organization.PlatformBasics.LongDescription"
      />
    ),
    className: 'bg-blue-50',
    steps: [ALL_STEPS.profilePage, ALL_STEPS.customizeProfileSections, ALL_STEPS.publishUpdate],
  },
  fundraise: {
    className: 'bg-yellow-50',
    image: <Image src="/static/images/welcome/jar.png" alt="FundRaise" width={42} height={40} />,
    title: <FormattedMessage defaultMessage="Fundraise" id="Welcome.Collective.Fundraise" />,
    description: (
      <FormattedMessage
        defaultMessage="Start crowdfunding and raise funds for your collective"
        id="Welcome.Collective.Fundraise.Description"
      />
    ),
    longDescription: (
      <FormattedMessage
        defaultMessage="Find a suitable Fiscal Host and collect contributions from individuals and organizations to fund your collective's activities."
        id="Welcome.Collective.Fundraise.LongDescription"
      />
    ),
    steps: [ALL_STEPS.findAndApplyHosting, ALL_STEPS.setupTiers, ALL_STEPS.contributionPolicy, ALL_STEPS.createProject],
  },
  spendMoney: {
    className: 'bg-green-50',
    image: <Image src="/static/images/welcome/stars.png" alt="SpendMoney" width={42} height={40} />,
    title: <FormattedMessage defaultMessage="Spend Your Money" id="Welcome.Collective.SpendMoney" />,
    description: (
      <FormattedMessage
        defaultMessage="Receive expenses and approve them for payment"
        id="Welcome.Collective.SpendMoney.Description"
      />
    ),
    longDescription: (
      <FormattedMessage
        defaultMessage="Manage expense submissions from your community, review them and approve them for payment to effectively utilize the funds raised."
        id="Welcome.Collective.SpendMoney.LongDescription"
      />
    ),
    steps: [ALL_STEPS.inviteAdmins, ALL_STEPS.collectiveExpensePolicy, ALL_STEPS.approveExpense],
  },
};

export const INDIVIDUAL_CATEGORIES = {
  submitExpense: {
    image: <Image src="/static/images/welcome/planets.png" alt="PlatformBasics" width={40} height={40} />,
    title: <FormattedMessage defaultMessage="Submit expenses" id="Welcome.Individual.SubmitExpenses" />,
    description: (
      <FormattedMessage
        defaultMessage="Submit expenses to existing collectives and get paid"
        id="Welcome.Individual.SubmitExpenses.Description"
      />
    ),
    className: 'bg-blue-50',
  },
  contribute: {
    className: 'bg-yellow-50',
    image: <Image src="/static/images/welcome/stars.png" alt="PlatformBasics" width={42} height={40} />,
    title: <FormattedMessage defaultMessage="Contribute to projects" id="Welcome.Individual.Contribute" />,
    description: (
      <FormattedMessage
        defaultMessage="Explore and discover projects to contribute to"
        id="Welcome.Individual.Contribute.Description"
      />
    ),
  },
  createOrg: {
    className: 'bg-green-50',
    image: <Image src="/static/images/welcome/stars.png" alt="PlatformBasics" width={42} height={40} />,
    title: <FormattedMessage defaultMessage="Create an organization" id="signup.createOrganization.title" />,
    description: (
      <FormattedMessage
        defaultMessage="Foundations, Non-Profits, Companies, Public Sector or Co-ops"
        id="Welcome.Individual.CreateOrg.Description"
      />
    ),
  },
  createCollective: {
    className: 'bg-red-50',
    image: <Image src="/static/images/welcome/jar.png" alt="Crowdfunding" width={42} height={40} />,
    title: <FormattedMessage defaultMessage="Create a collective" id="Welcome.Individual.CreateCollective" />,
    description: (
      <FormattedMessage
        defaultMessage="Collectives, Groups and Projects without a legal identity"
        id="Welcome.Individual.CreateCollective.Description"
      />
    ),
  },
};
