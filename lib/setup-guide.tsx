import React from 'react';
import { isEmpty, isNil, orderBy } from 'lodash';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

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
  title: string | ReactNode;
  steps: Array<Step>;
};

const sortSteps = (steps: Step[]) =>
  orderBy(steps, step => (step.requiresUpgrade ? -1 : step.completed ? 1 : 0), ['desc', 'desc']);

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
  return [
    {
      id: 'verification',
      title: <FormattedMessage defaultMessage="Verification" id="SetupGuide.Verification" />,
      steps: sortSteps([
        {
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
        {
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
      ]),
    },
    {
      id: 'financials',
      title: <FormattedMessage defaultMessage="Financial Configuration" id="SetupGuide.Financials" />,
      steps: sortSteps([
        {
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
        {
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
        {
          title: <FormattedMessage defaultMessage="Set up your chart of accounts" id="SetupGuide.ChartOfAccounts" />,
          id: 'chart-of-accounts',
          description: (
            <FormattedMessage
              defaultMessage="A Chart-of-Accounts enables you to categorize expenses and manually added funds in compliance with your accounting requirements. Setup your chart of accounts, categorize your expenses and added funds and your transaction exports will include this information. This will save you time and money when doing your accounting."
              id="SetupGuide.ChartOfAccounts.Description"
            />
          ),
          completed:
            'host' in account &&
            account.host?.accountingCategories?.nodes?.filter(c => c.appliesTo === 'HOST').length > 0,
          requiresUpgrade: planFeatures && !planFeatures.CHART_OF_ACCOUNTS,
          action: {
            label: <FormattedMessage defaultMessage="Add chart of accounts" id="SetupGuide.ChartOfAccounts.Action" />,
            onClick: () => {
              router.push(getDashboardRoute(account, 'chart-of-accounts'));
            },
          },
        },
        {
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
      ]),
    },
    {
      id: 'hosting',
      title: <FormattedMessage defaultMessage="Hosting" id="DkzeEN" />,
      steps: sortSteps([
        {
          title: <FormattedMessage defaultMessage="Enable hosting" id="SetupGuide.EnableHosting" />,
          description: (
            <FormattedMessage
              defaultMessage="Hosting enables you to manage other people’s money in addition to your own organization’s finances. Enable hosted collectives to allow other groups to manage their finances under your fiscal and legal umbrella. Enable hosted funds to hold institutional funds for grant distribution."
              id="SetupGuide.EnableHosting.Description"
            />
          ),
          id: 'enable-hosting',
          completed: account.isHost && account.settings?.canHostAccounts !== false,
          action: {
            label: <FormattedMessage defaultMessage="Enable hosting" id="SetupGuide.EnableHosting" />,
            onClick: () => {
              router.push(getDashboardRoute(account, 'advanced'));
            },
          },
        },
        {
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
            label: (
              <FormattedMessage defaultMessage="Require Organization 2FA" id="SetupGuide.2FARequirements.Action" />
            ),
            onClick: () => router.push(getDashboardRoute(account, 'security')),
          },
        },
        {
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
        {
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
        {
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
        {
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
        {
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
      ]),
    },
  ];
};
