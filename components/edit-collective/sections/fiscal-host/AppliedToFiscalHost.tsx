import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  AppliedToFiscalHostQuery,
  AppliedToFiscalHostQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';
import { formatDate } from '../../../../lib/utils';

import HostApplicationRequests from '../../../dashboard/sections/collectives/HostApplicationRequests';
import Link from '../../../Link';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledLink from '../../../StyledLink';

type AppliedToFiscalHostProps = {
  collectiveSlug: string;
  editCollectiveMutation: (collective: { id: number; HostCollectiveId?: number }) => Promise<void>;
};

export default function AppliedToFiscalHost(props: AppliedToFiscalHostProps) {
  const query = useQuery<AppliedToFiscalHostQuery, AppliedToFiscalHostQueryVariables>(
    gql`
      query AppliedToFiscalHost($collectiveSlug: String!) {
        account(slug: $collectiveSlug) {
          id
          legacyId
          slug
          name
          members {
            nodes {
              role
              createdAt
            }
          }
          ... on AccountWithHost {
            host {
              id
              slug
              name
            }
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        collectiveSlug: props.collectiveSlug,
      },
    },
  );

  const collective = query.data?.account;
  const host = collective && 'host' in collective ? collective.host : null;
  const hostMembership = get(collective, 'members.nodes', []).find(m => m.role === 'HOST');

  if (query.loading) {
    return <Loading />;
  } else if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  return (
    <React.Fragment>
      <div className="mt-4">
        <MessageBox type="info">
          <div>
            <h2>
              <FormattedMessage
                defaultMessage="You applied to be hosted by {host} on {date}."
                id="MY7WsR"
                values={{
                  host: (
                    <StyledLink as={Link} href={getCollectivePageRoute(host)}>
                      {host?.name}
                    </StyledLink>
                  ),
                  date: formatDate(get(hostMembership, 'createdAt'), {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                }}
              />
            </h2>
            <FormattedMessage
              defaultMessage="Your application is being reviewed. You can withdraw your application from the table below."
              id="JkN8AU"
            />
          </div>
        </MessageBox>
      </div>
      <div className="mt-4">
        <HostApplicationRequests accountSlug={collective?.slug} editCollectiveMutation={props.editCollectiveMutation} />
      </div>
    </React.Fragment>
  );
}
