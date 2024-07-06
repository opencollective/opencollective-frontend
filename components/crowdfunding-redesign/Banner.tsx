import React from 'react';
import { Eye } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { getCollectivePageRoute } from '../../lib/url-helpers';

import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import { Button } from '../ui/Button';

import { EditFundraiser } from './edit/EditFundraiser';
import { EditProfile } from './edit/EditProfile';

export function Banner({ account, isFundraiser }) {
  return (
    <div className="h-14 w-full bg-yellow-100">
      <div className="flex items-center justify-center gap-4 px-4 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            <span className="font-semibold">
              <FormattedMessage defaultMessage="PREVIEW" id="Isedjj" />
            </span>
            <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
              <circle cx={1} cy={1} r={1} />
            </svg>
            <FormattedMessage
              defaultMessage="This is a prototype part of the <Link>crowdfunding redesign effort.</Link>"
              id="mLNv+R"
              values={{
                Link: getI18nLink({
                  openInNewTab: true,
                  href: 'https://blog.opencollective.com/open-collective-crowdfunding-redesign/',
                }),
              }}
            />
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" className="bg-yellow-200 hover:bg-yellow-300" asChild>
            <Link href={getCollectivePageRoute(account)}>
              <FormattedMessage defaultMessage="Go to current profile" id="VboEiK" />
            </Link>
          </Button>
          {isFundraiser ? <EditFundraiser account={account} /> : <EditProfile account={account} />}
        </div>
      </div>
    </div>
  );
}
