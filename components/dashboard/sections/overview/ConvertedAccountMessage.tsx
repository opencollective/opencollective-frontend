import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Info, Settings, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { HELP_MESSAGE } from '../../../../lib/constants/dismissable-help-message';
import dayjs from '../../../../lib/dayjs';
import type { AccountConversionsQuery, AccountConversionsQueryVariables, Host } from '@/lib/graphql/types/v2/graphql';

import { getI18nLink } from '@/components/I18nFormatters';
import Link from '@/components/Link';

import DismissibleMessage from '../../../DismissibleMessage';
import { AlertDescription, AlertTitle } from '../../../ui/Alert';
import { Button } from '../../../ui/Button';

const accountConversionsQuery = gql`
  query AccountConversions($slug: String!) {
    activities(
      account: { slug: $slug }
      type: [COLLECTIVE_CONVERTED_TO_ORGANIZATION, ORGANIZATION_CONVERTED_TO_COLLECTIVE]
      limit: 1
    ) {
      nodes {
        id
        type
        createdAt
        individual {
          id
        }
      }
    }
  }
`;

const shouldDisplayConvertedAccountMessage = (activity: AccountConversionsQuery['activities']['nodes'][0]) => {
  if (!activity) {
    return false;
  }

  if (activity.type === 'COLLECTIVE_CONVERTED_TO_ORGANIZATION') {
    if (activity.individual) {
      // Show a message for up to 24 hours after the conversion
      return dayjs(activity.createdAt).diff(dayjs(), 'hour') < 48;
    } else {
      // Only show a message for up to 1 month after the auto-conversion.
      // TODO: Remove this after February 2026
      return dayjs(activity.createdAt).diff(dayjs(), 'month') < 1;
    }
  } else if (activity.type === 'ORGANIZATION_CONVERTED_TO_COLLECTIVE') {
    return dayjs(activity.createdAt).diff(dayjs(), 'hour') < 48;
  }

  return false;
};

export function ConvertedAccountMessage({
  account,
}: {
  account: { slug: string; legacyId: number; host: Pick<Host, 'id'> };
}) {
  const { data: conversionData } = useQuery<AccountConversionsQuery, AccountConversionsQueryVariables>(
    accountConversionsQuery,
    {
      variables: { slug: account?.slug },
      skip: !account?.slug,
      fetchPolicy: 'network-only',
    },
  );

  const latestConversionActivity = conversionData?.activities?.nodes?.[0]; // Activities are sorted by most recent first
  if (!shouldDisplayConvertedAccountMessage(latestConversionActivity)) {
    return null;
  }

  return (
    <DismissibleMessage messageId={HELP_MESSAGE.ORGANIZATION_CONVERTED} accountId={account.legacyId}>
      {({ dismiss }) => (
        <div className="mb-6 rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <AlertTitle className="text-base font-semibold">
                <FormattedMessage defaultMessage="Your account has been updated" id="f4xu6H" />
              </AlertTitle>
              <AlertDescription className="mt-1">
                {latestConversionActivity.type === 'ORGANIZATION_CONVERTED_TO_COLLECTIVE' ? (
                  <FormattedMessage
                    defaultMessage="Your Account has been converted to a Collective. If this was a mistake, you can convert it back to an Organization in the <Link>Advanced Settings</Link>."
                    id="av1hiP"
                    values={{
                      Link: getI18nLink({
                        as: Link,
                        href: `/dashboard/${account.slug}/advanced`,
                        icon: <Settings className="mr-1 inline-block h-4 w-4 align-middle" />,
                      }),
                    }}
                  />
                ) : latestConversionActivity.type === 'COLLECTIVE_CONVERTED_TO_ORGANIZATION' ? (
                  latestConversionActivity.individual ? (
                    <FormattedMessage
                      defaultMessage="Your Collective has been converted to an Organization. If this was a mistake, you can convert it back in the <Link>Advanced Settings</Link>."
                      id="DTqaGq"
                      values={{
                        Link: getI18nLink({
                          as: Link,
                          href: `/dashboard/${account.slug}/advanced`,
                          icon: <Settings className="mr-1 inline-block h-4 w-4 align-text-bottom" />,
                        }),
                      }}
                    />
                  ) : (
                    <React.Fragment>
                      <FormattedMessage
                        id="Organization.Converted.Description"
                        defaultMessage="We've automatically converted your Independent Collective to an Organization. This has no impact on the features you have access to."
                      />
                      <div className="mt-3">
                        <Link
                          href="https://opencollective.com/ofico/updates/independent-collectives-are-becoming-organizations"
                          openInNewTab
                        >
                          <Button variant="outline" size="xs">
                            <FormattedMessage defaultMessage="Learn more" id="TdTXXf" />
                          </Button>
                        </Link>
                      </div>
                    </React.Fragment>
                  )
                ) : null}
              </AlertDescription>
            </div>
            <Button variant="ghost" size="icon-xs" className="shrink-0 text-muted-foreground" onClick={dismiss}>
              <X size={16} />
            </Button>
          </div>
        </div>
      )}
    </DismissibleMessage>
  );
}
