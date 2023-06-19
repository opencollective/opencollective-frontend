import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { WorkspaceHomeQuery } from '../../../../lib/graphql/types/v2/graphql';

import Container from '../../../Container';
import { Flex } from '../../../Grid';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledButton from '../../../StyledButton';
import { H1, H2 } from '../../../Text';
import { AdminSectionProps } from '../../types';

import { workspaceHomeQuery } from './query';
import TimelineItem from './TimelineItem';

const PAGE_SIZE = 20;

const Home = (props: AdminSectionProps) => {
  const router = useRouter();
  const slug = router.query?.as || props.account.slug;
  const { data, loading, error, fetchMore } = useQuery(workspaceHomeQuery, {
    variables: { slug, limit: PAGE_SIZE },
    context: API_V2_CONTEXT,
    fetchPolicy: 'network-only',
  });

  const activities: WorkspaceHomeQuery['activities']['nodes'] = data?.activities?.nodes || [];

  return (
    <Container>
      <H1 fontSize="32px" lineHeight="40px" fontWeight="normal">
        <FormattedMessage id="Dashboard.Home.Title" defaultMessage="This is your workspace" />
      </H1>
      <Flex flexDirection="column" mt="50px">
        <Flex justifyContent="space-between" alignItems="baseline" mb="32px">
          <H2 fontSize="20px" lineHeight="28px" fontWeight="700">
            <FormattedMessage id="Dashboard.Home.ActivityHeader" defaultMessage="Recent activity" />
          </H2>
        </Flex>
        {error ? (
          <MessageBoxGraphqlError error={error} />
        ) : loading ? (
          <React.Fragment>
            <TimelineItem />
            <TimelineItem />
            <TimelineItem />
            <TimelineItem />
            <TimelineItem isLast />
          </React.Fragment>
        ) : !activities ? (
          <MessageBox type="info" withIcon>
            <FormattedMessage defaultMessage="No activity yet" />
          </MessageBox>
        ) : (
          activities.map((activity, i) => (
            <TimelineItem key={activity.id} activity={activity} isLast={i === activities.length - 1} />
          ))
        )}
        <StyledButton
          mt={2}
          width="100%"
          buttonSize="small"
          onClick={() =>
            fetchMore({
              variables: { offset: activities.length },
              updateQuery: (prevResult, { fetchMoreResult }) => {
                const activities = fetchMoreResult?.activities;
                activities.nodes = [...prevResult.activities.nodes, ...activities.nodes];
                return { activities };
              },
            })
          }
        >
          <FormattedMessage defaultMessage="View more" />
        </StyledButton>
      </Flex>
    </Container>
  );
};

export default Home;
