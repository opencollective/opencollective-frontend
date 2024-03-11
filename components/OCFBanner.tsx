import React from 'react';
import { ArrowUpRight } from 'lucide-react';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';

import MessageBox from './MessageBox';

const Message = ({ params }) => (
  <React.Fragment>
    To find out more information about the situation and your options, {''}
    <a
      href="https://blog.opencollective.com/open-collective-official-statement-ocf-dissolution/"
      target="_blank"
      className="font-semibold"
      rel="noreferrer"
    >
      please read the official announcement from Open Collective
      <ArrowUpRight className="inline-block align-baseline" size={15} />
    </a>
    . We will continue to add more information to this announcement as the situation unfolds. We want to help;{' '}
    <a
      href={`https://coda.io/form/Transition-Support_dzhPGdiqXVw?${params}`}
      target="_blank"
      className="font-semibold"
      rel="noreferrer"
    >
      please fill in this form
      <ArrowUpRight className="inline-block align-baseline" size={15} />
    </a>{' '}
    so we can actively help you find a new fiscal host.
  </React.Fragment>
);

export const OCFBanner = React.memo(({ collective }: any) => {
  const { LoggedInUser } = useLoggedInUser();
  const params = new URLSearchParams();
  params.append('collectiveSlug', collective.slug);
  params.append('userSlug', LoggedInUser?.collective?.slug);
  return (
    <MessageBox type="warning" className="mb-4">
      <div className="flex flex-col gap-3">
        <p className="text-lg font-semibold">Open Collective Official Statement: OCF Dissolution</p>
        <p className="text-sm">
          <Message params={params.toString()} />
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
    description: <Message params={params.toString()} />,
  };
};
