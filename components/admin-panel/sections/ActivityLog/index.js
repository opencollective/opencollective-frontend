import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { parseDateInterval } from '../../../../lib/date-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../../lib/graphql/helpers';
import { ActivityLabelI18n } from '../../../../lib/i18n/activities';

import Avatar from '../../../Avatar';
import Container from '../../../Container';
import DateTime from '../../../DateTime';
import { Box, Flex } from '../../../Grid';
import LinkCollective from '../../../LinkCollective';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import StyledCard from '../../../StyledCard';
import StyledLink from '../../../StyledLink';
import { P } from '../../../Text';

import ActivityFilters from './ActivityFilters';

const activityLogQuery = gqlV2/* GraphQL */ `
  query AccountActivityLog(
    $account: AccountReferenceInput!
    $limit: Int
    $offset: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $activityType: [ActivityAndClassesType]
  ) {
    activities(
      account: $account
      limit: $limit
      offset: $offset
      dateFrom: $dateFrom
      dateTo: $dateTo
      activityType: $activityType
    ) {
      offset
      limit
      totalCount
      nodes {
        id
        createdAt
        type
        individual {
          id
          slug
          name
          type
          imageUrl(height: 48)
        }
      }
    }
  }
`;

const ActivityLogContainer = styled(StyledCard)`
  & > *:not(:last-child) {
    border-bottom: 1px solid #dcdde0;
  }
`;

const MetadataContainer = styled.div`
  display: flex;
  align-items: center;
  grid-gap: 8px;
  color: #4d4f51;
  margin-top: 10px;
`;

const ACTIVITY_LIMIT = 10;

const ActivityLog = ({ accountSlug }) => {
  const intl = useIntl();
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { period, type } = routerQuery;
  const { from: dateFrom, to: dateTo } = parseDateInterval(period);
  const { data, loading, error } = useQuery(activityLogQuery, {
    variables: { account: { slug: accountSlug }, dateFrom, dateTo, limit: ACTIVITY_LIMIT, offset, activityType: type },
    context: API_V2_CONTEXT,
  });

  const handleUpdateFilters = queryParams => {
    return router.push({
      pathname: `/${accountSlug}/admin/activity-log`,
      query: omitBy({ ...routerQuery, ...queryParams }, value => !value),
    });
  };

  return (
    <Box mt={3}>
      <ActivityFilters
        filters={routerQuery}
        onChange={queryParams => handleUpdateFilters({ ...queryParams, offset: null })}
      />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : loading ? (
        <LoadingPlaceholder width="100%" height={163} />
      ) : !data?.activities?.nodes ? (
        <MessageBox type="error" withIcon>
          <FormattedMessage
            id="mustBeAdmin"
            defaultMessage="You must be an admin of this collective to see this page"
          />
        </MessageBox>
      ) : (
        <React.Fragment>
          {!data.activities.totalCount ? (
            <MessageBox type="info" withIcon>
              <FormattedMessage defaultMessage="No activity yet" />
            </MessageBox>
          ) : (
            <ActivityLogContainer>
              {data.activities.nodes.map(activity => (
                <Box key={activity.id} px="16px" py="14px">
                  <P color="black.900" fontWeight="500" fontSize="14px">
                    {ActivityLabelI18n[activity.type]
                      ? intl.formatMessage(ActivityLabelI18n[activity.type])
                      : activity.type}
                  </P>
                  <MetadataContainer>
                    <FormattedMessage
                      id="ByUser"
                      defaultMessage="By {userName}"
                      values={{
                        userName: !activity.individual ? (
                          <FormattedMessage id="user.unknown" defaultMessage="Unknown" />
                        ) : (
                          <StyledLink as={LinkCollective} color="black.700" collective={activity.individual}>
                            <Flex alignItems="center" gridGap="8px">
                              <Avatar radius={24} collective={activity.individual} />
                              {activity.individual.name}
                            </Flex>
                          </StyledLink>
                        ),
                      }}
                    />
                    •
                    <DateTime value={activity.createdAt} dateStyle="medium" />
                  </MetadataContainer>
                </Box>
              ))}
            </ActivityLogContainer>
          )}
        </React.Fragment>
      )}
      {data?.activities?.totalCount > ACTIVITY_LIMIT && (
        <Container display="flex" justifyContent="center" fontSize="14px" my={3}>
          <Pagination
            offset={offset}
            total={data.activities.totalCount}
            limit={ACTIVITY_LIMIT}
            ignoredQueryParams={['slug', 'section']}
          />
        </Container>
      )}
    </Box>
  );
};

ActivityLog.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default ActivityLog;
