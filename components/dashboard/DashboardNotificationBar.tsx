import React from 'react';
import { gql, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { ArrowRight } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '@/lib/constants/collectives';
import { getDashboardRoute } from '@/lib/url-helpers';
import { isCollective, type WorkspaceAccount } from '@/lib/workspace';

import { DashboardContext } from '@/components/dashboard/DashboardContext';
import I18nFormatters, { getI18nLink } from '@/components/I18nFormatters';
import Link from '@/components/Link';
import NotificationBar from '@/components/NotificationBar';

const messages = defineMessages({
  collectiveIsArchived: {
    id: 'collective.isArchived',
    defaultMessage: '{name} has been archived.',
  },
  collectiveIsArchivedDescription: {
    id: 'collective.isArchived.edit.description',
    defaultMessage: 'This {type} has been archived and is no longer active.',
  },
  userIsArchived: {
    id: 'user.isArchived',
    defaultMessage: 'Account has been archived.',
  },
  userIsArchivedDescription: {
    id: 'user.isArchived.edit.description',
    defaultMessage: 'This account has been archived and is no longer active.',
  },
});

const dashboardHostApplicationQuery = gql`
  query DashboardHostApplicationNotification($slug: String!) {
    account(slug: $slug) {
      id
      ... on Collective {
        hostApplication {
          id
          status
          createdAt
          host {
            name
          }
        }
      }
    }
  }
`;

type HostApplicationNotification = {
  id: string;
  status?: string | null;
  createdAt: string;
  host?: { name?: string | null } | null;
};

const getNotification = (
  intl: ReturnType<typeof useIntl>,
  account: WorkspaceAccount | null,
  hostApplication?: HostApplicationNotification | null,
): React.ComponentProps<typeof NotificationBar> | undefined => {
  if (!account) {
    return undefined;
  }

  if (account.isArchived) {
    if (account.type === CollectiveType.INDIVIDUAL) {
      return {
        type: 'warning',
        title: intl.formatMessage(messages.userIsArchived),
        description: intl.formatMessage(messages.userIsArchivedDescription),
      };
    } else {
      return {
        type: 'warning',
        title: intl.formatMessage(messages.collectiveIsArchived, { name: account.name }),
        description: intl.formatMessage(messages.collectiveIsArchivedDescription, {
          type: account.type.toLowerCase(),
        }),
      };
    }
  } else if (isCollective(account)) {
    if (!account.host) {
      return {
        type: 'error',
        inline: true,
        title: (
          <React.Fragment>
            <FormattedMessage
              defaultMessage="You have not applied to any fiscal host. You can not raise funds without a fiscal host."
              id="Dashboard.NoHostNotification"
            />
            <Link
              href={`/${account.slug}/accept-financial-contributions/host`}
              className="ml-1 inline-flex items-center underline hover:no-underline"
            >
              <FormattedMessage defaultMessage="Find a Fiscal Host" id="join.findAFiscalHost" />
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </React.Fragment>
        ),
      };
    }
    if (hostApplication?.status === 'PENDING') {
      return {
        type: 'info',
        inline: true,
        title: (
          <React.Fragment>
            <span className="font-normal">
              <FormattedMessage
                defaultMessage="You applied to be hosted by <strong>{hostName}</strong> on <strong>{applicationData, date, medium}</strong>. Your application is being reviewed."
                id="Dashboard.PendingHostApplicationNotification"
                values={{
                  ...I18nFormatters,
                  hostName: hostApplication.host?.name,
                  applicationData: new Date(hostApplication.createdAt),
                }}
              />
            </span>
            <Link
              href={getDashboardRoute(account, `/host?hostApplicationId=${hostApplication.id}`)}
              className="ml-1 inline-flex items-center underline hover:no-underline"
            >
              <FormattedMessage
                defaultMessage="See Application"
                id="Dashboard.PendingHostApplicationNotificationLink"
              />
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </React.Fragment>
        ),
      };
    }
  } else if (
    account.isHost &&
    account.settings?.automaticBillingMigration &&
    dayjs().diff(dayjs(account.settings.automaticBillingMigration), 'week') < 8
  ) {
    return {
      type: 'info',
      title: <FormattedMessage defaultMessage="New platform pricing" id="rLJm+c" />,
      description: (
        <FormattedMessage
          defaultMessage="Your account has been migrated to the <PricingLink>new pricing</PricingLink>. The <BillinkLink>Platform Billing</BillinkLink> section of your dashboard will let you review your current usage and update your plan. Contact our <ContactLink>support team</ContactLink> if you have any questions."
          id="automaticBillingMigrationDescription"
          values={{
            PricingLink: getI18nLink({ as: Link, href: '/pricing' }),
            BillinkLink: getI18nLink({ as: Link, href: getDashboardRoute(account, 'platform-subscription') }),
            ContactLink: getI18nLink({ as: Link, href: '/contact' }),
          }}
        />
      ),
    };
  }
};

export const DashboardNotificationBar = () => {
  const intl = useIntl();
  const { account } = React.useContext(DashboardContext);

  // Only fetch host application details for unapproved hosted collectives (pending application banner).
  const needsHostApplicationNotification =
    Boolean(account?.slug) &&
    isCollective(account) &&
    !account.isArchived &&
    Boolean(account.host) &&
    account.isApproved === false;

  const { data } = useQuery(dashboardHostApplicationQuery, {
    variables: { slug: account?.slug },
    skip: !needsHostApplicationNotification,
  });

  const hostApplication = data?.account?.hostApplication;
  const notification = getNotification(intl, account, hostApplication);

  if (!notification) {
    return null;
  }

  return <NotificationBar {...notification} />;
};
