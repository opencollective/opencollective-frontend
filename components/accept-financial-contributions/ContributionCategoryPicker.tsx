import React from 'react';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '@/lib/constants/collectives';

import { getI18nLink } from '../I18nFormatters';
import Image from '../Image';
import Link from '../Link';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

export const ContributionCategoryPicker = ({ collective }) => {
  return (
    <div className="max-w-5xl px-4">
      <div className="mb-8">
        <h1 className="text-black-900 mb-3 text-xl leading-tight font-bold">
          <FormattedMessage id="acceptContributions.picker.header" defaultMessage="Accept financial contributions" />
        </h1>
        <p className="text-black-600 text-sm sm:text-base">
          <FormattedMessage
            id="acceptContributions.picker.subtitle"
            defaultMessage="Who will hold money on behalf of this Collective?"
          />
        </p>
      </div>

      <div className="flex flex-wrap gap-6">
        <Card className="group relative max-w-xs border-2 border-blue-500 bg-blue-50/30 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-col items-center justify-center">
            <div className="relative mb-4 flex h-[96px] w-[96px] items-center justify-center sm:h-[104px] sm:w-[104px]">
              <div className="absolute">
                <Image
                  width={128}
                  height={128}
                  src="/static/images/create-collective/acceptContributionsHostIllustration.png"
                  alt=""
                />
              </div>
              <div className="absolute opacity-0 transition-opacity group-hover:opacity-100">
                <Image
                  width={128}
                  height={128}
                  src="/static/images/create-collective/acceptContributionsHostHoverIllustration.png"
                  alt=""
                />
              </div>
            </div>
            <CardTitle className="text-lg font-semibold sm:text-xl">
              <FormattedMessage id="acceptContributions.picker.host" defaultMessage="Join a Fiscal Host" />
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              <FormattedMessage
                id="acceptContributions.picker.hostInfo"
                defaultMessage="Apply to join a Fiscal Host, who will hold money on behalf of your Collective. Choose this option if you want someone else to take care of banking, accounting, taxes, payments, and liability. <MoreInfoLink>More info</MoreInfoLink>"
                values={{
                  MoreInfoLink: getI18nLink({ href: '/fiscal-hosting', openInNewTab: true }),
                }}
              />
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-0">
            <Link href={`/${collective.slug}/accept-financial-contributions/host`} className="w-full">
              <Button variant="default" size="lg" className="w-full" data-cy="afc-picker-host-button">
                <FormattedMessage id="acceptContributions.picker.host" defaultMessage="Join a Fiscal Host" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {collective.type === CollectiveType.COLLECTIVE && (
          <Card className="flex max-w-xs flex-col justify-center border transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-col justify-center">
              <CardTitle className="text-lg font-semibold sm:text-lg">
                <FormattedMessage defaultMessage="Already have a legal entity?" id="/9OXGy" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href={`/dashboard/${collective.slug}/advanced?convertToOrg=true`} className="block w-full">
                <Button variant="outline" size="sm" className="w-full">
                  <FormattedMessage defaultMessage="Convert to Organization" id="convertToOrg.button" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
