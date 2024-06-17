import React from 'react';
import { FlaskConical } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import { Button } from '../ui/Button';

export function CrowdfundingPreviewBanner({ account }) {
  return (
    <div className="z-10 flex h-14 w-full items-center justify-center bg-blue-100 px-4 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <div className="flex items-center gap-4">
        <FlaskConical className="h-4 w-4" />
        <span>
          <span className="font-semibold">
            <FormattedMessage defaultMessage="Crowdfunding Redesign" id="uVYlI0" />
          </span>
          <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
            <circle cx={1} cy={1} r={1} />
          </svg>
          <FormattedMessage
            defaultMessage="We are embarking on a journey to redesigning the <Link>crowdfunding experience on Open Collective.</Link>"
            id="4+FPCW"
            values={{
              Link: getI18nLink({
                openInNewTab: true,
                href: 'https://blog.opencollective.com/open-collective-crowdfunding-redesign/',
              }),
            }}
          />
        </span>
        <Button variant="secondary" className="bg-blue-200 hover:bg-blue-300" asChild>
          <Link href={`/preview/${account.slug}`}>
            <FormattedMessage defaultMessage="Go to prototype" id="Vs38OD" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
