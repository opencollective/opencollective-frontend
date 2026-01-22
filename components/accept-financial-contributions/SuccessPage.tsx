import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import Avatar from '../Avatar';
import Image from '../Image';
import Link from '../Link';
import Loading from '../Loading';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

const TIERS_INFO_LINK = 'https://documentation.opencollective.com/collectives/raising-money/setting-goals-and-tiers';

const hostApplySuccessQuery = gql`
  query HostApplySuccess($slug: String!) {
    account(slug: $slug, throwIfMissing: true) {
      id
      slug
      name
      hostApplicationRequests(limit: 100) {
        nodes {
          id
          host {
            id
            name
            slug
          }
        }
      }
    }
  }
`;

export const SuccessPage = ({ collective, hostSlug }) => {
  const { data, error, loading } = useQuery(hostApplySuccessQuery, {
    variables: { slug: collective.slug },
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center bg-gray-50 px-4 py-12 sm:py-24">
        <Loading />
      </div>
    );
  } else if (error || !data) {
    return (
      <div className="flex flex-col items-center bg-gray-50 px-4 py-12 sm:py-24">
        <MessageBoxGraphqlError error={error} />
      </div>
    );
  }

  let host = collective.host;
  if (hostSlug) {
    host = data.account.hostApplicationRequests.nodes.find(request => request.host.slug === hostSlug)?.host;
  }

  // Handle case where host is null (e.g. visiting later, after the application has been rejected)
  if (!host) {
    return (
      <div className="flex flex-col items-center bg-gray-50 px-4 py-12 sm:py-24">
        <div className="w-full max-w-4xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              <FormattedMessage
                id="acceptContributions.noHostApplication"
                defaultMessage="No fiscal host application"
              />
            </h1>
          </div>

          {!collective.host && (
            <div className="my-6 flex justify-center">
              <Link href={`/${collective.slug}/accept-financial-contributions/host`} className="w-full sm:w-auto">
                <Button variant="default" size="lg" className="w-full sm:w-auto">
                  <FormattedMessage id="acceptContributions.picker.host" defaultMessage="Join a Fiscal Host" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-gray-50 px-4 py-12 sm:py-24">
      <div className="w-full max-w-4xl space-y-6">
        {/* Main Heading */}
        <div className="text-center">
          <div className="mb-4 text-6xl sm:text-7xl">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            <FormattedMessage
              id="acceptContributions.myselfSuccess"
              defaultMessage="You have applied to be hosted by {hostName}."
              values={{
                hostName: host.name,
              }}
            />
          </h1>
        </div>

        {/* Host Confirmation Card */}
        <Card className="mx-auto mt-12 max-w-2xl">
          <CardHeader className="items-center text-center">
            <div className="mb-4 flex justify-center">
              <Avatar collective={host} radius={64} />
            </div>
            <CardTitle className="text-xl">{host.name}</CardTitle>
          </CardHeader>
          {!collective.isActive && (
            <CardDescription className="mt-2 text-center text-base">
              <FormattedMessage
                id="acceptContributions.notifiedWhen"
                defaultMessage="You will be notified when {hostName} has approved or rejected your application. Contribution tiers will go live once you have an active Fiscal Host."
                values={{
                  hostName: host.name,
                }}
              />
            </CardDescription>
          )}
        </Card>

        {/* Tiers Information Card */}
        {!collective.isActive && (
          <Card className="mx-auto max-w-2xl">
            <CardHeader className="items-center text-left">
              <CardTitle>
                <FormattedMessage defaultMessage="In the meantime..." id="iec+Aj" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="shrink-0">
                <Image
                  alt=""
                  src="/static/images/create-collective/acceptContributionsSuccessIllustration.png"
                  width={100}
                  height={70}
                  className="h-auto w-full max-w-[264px]"
                />
              </div>
              <div className="flex-1 items-center space-y-3">
                <CardDescription className="text-sm leading-5">
                  <FormattedMessage
                    id="acceptContributions.tiers.paragraphOne"
                    defaultMessage="Customize your contribution tiers with different names, amounts, frequencies (one-time, monthly, or yearly), goals, and rewards. {knowMore}."
                    values={{
                      knowMore: (
                        <Link href={TIERS_INFO_LINK} className="text-primary hover:underline" openInNewTab>
                          <FormattedMessage id="tiers.knowMore" defaultMessage="Learn about tiers" />
                        </Link>
                      ),
                    }}
                  />
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons Card */}
        <div className="mt-12 flex justify-center">
          <Button variant="outline" size="default" asChild className="w-full sm:w-auto">
            <Link href={`/${collective.slug}`}>
              <FormattedMessage
                id="updatePaymentMethod.form.updatePaymentMethodSuccess.btn"
                defaultMessage="Go to profile page"
              />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
