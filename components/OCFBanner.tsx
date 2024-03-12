import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { getDashboardRoute } from '../lib/url-helpers';
import { cn } from '../lib/utils';

import { Button } from './ui/Button';
import Link from './Link';
import MessageBox from './MessageBox';

const Message = ({ collective, params, isCentered = false, hideNextSteps = false }) => (
  <React.Fragment>
    Find more information here:{' '}
    <Link href="https://blog.opencollective.com/open-collective-official-statement-ocf-dissolution/" openInNewTab>
      Open Collective official Statement
    </Link>
    . <br />
    <br />
    <div>
      We want to help, please fill in{' '}
      <a
        href={`https://coda.io/form/Transition-Support_dzhPGdiqXVw?${params}`}
        target="_blank"
        className="font-semibold"
        rel="noreferrer"
      >
        this form
        <ArrowUpRight className="inline-block align-baseline" size={15} />
      </a>{' '}
      so we can actively help you find a new host.
      {!hideNextSteps && (
        <div className={cn('mt-3 flex items-center gap-3', { 'justify-center': isCentered })}>
          <div>Next Steps:</div>
          <Link href={getDashboardRoute(collective, 'host')}>
            <Button variant="outline">
              <FormattedMessage id="AdminPanel.FiscalHostSettings" defaultMessage="Fiscal Host Settings" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  </React.Fragment>
);

export const OCFBanner = React.memo(({ collective, hideNextSteps = false }: any) => {
  const { LoggedInUser } = useLoggedInUser();
  const params = new URLSearchParams();
  params.append('collectiveSlug', collective.slug);
  params.append('userSlug', LoggedInUser?.collective?.slug);
  return (
    <MessageBox type="warning" className="mb-4">
      <div className="flex flex-col gap-3">
        <p className="text-lg font-semibold">Your Fiscal Host Open Collective Foundation is closing down</p>
        <p className="text-sm">
          <Message collective={collective} params={params.toString()} hideNextSteps={hideNextSteps} />
        </p>
      </div>
    </MessageBox>
  );
});
OCFBanner.displayName = 'OCFBanner';

export const OCFCollectivePageBanner = ({ collective, LoggedInUser }) => {
  const params = new URLSearchParams();
  params.append('collectiveSlug', collective.slug);
  params.append('userSlug', LoggedInUser?.collective?.slug);
  return {
    type: 'warning',
    title: 'Open Collective Official Statement: OCF Dissolution',
    description: <Message isCentered collective={collective} params={params.toString()} />,
  };
};
