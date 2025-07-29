import React from 'react';
import { useQuery } from '@apollo/client';
import { Lock } from '@styled-icons/fa-solid/Lock';
import { get, isEmpty } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type { Account, Update } from '../../../lib/graphql/types/v2/schema';
import { getCollectivePageRoute, getDashboardRoute } from '../../../lib/url-helpers';
import { formatDate } from '../../../lib/utils';

import Avatar from '../../Avatar';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import HTMLContent from '../../HTMLContent';
import Link from '../../Link';
import LinkCollective from '../../LinkCollective';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledCard from '../../StyledCard';
import StyledLink from '../../StyledLink';
import StyledTooltip from '../../StyledTooltip';
import { P, Span } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

export const getUpdatesSectionQueryVariables = (slug, isAdmin = false) => {
  return { slug, onlyPublishedUpdates: !isAdmin };
};

/** Query to re-fetch updates */
export const updatesSectionQuery = gql`
  query UpdatesSection($slug: String!, $onlyPublishedUpdates: Boolean) {
    account(slug: $slug) {
      id
      updates(limit: 3, onlyPublishedUpdates: $onlyPublishedUpdates) {
        nodes {
          id
          slug
          title
          summary
          createdAt
          publishedAt
          isPrivate
          userCanSeeUpdate
          fromAccount {
            id
            type
            name
            slug
            imageUrl
          }
        }
      }
    }
  }
`;

const PrivateUpdateMesgBox = styled(MessageBox)`
  height: 40px;
  background: #f0f8ff;
  border: 1px solid #b8deff;
  box-sizing: border-box;
  border-radius: 6px;
  margin: 10px 0;
  padding: 10px;
  font-size: 12px;
  color: #71757a;
  display: flex;
  align-items: center;
`;

/**
 * Displays collective's updates.
 */
const SectionUpdates = ({ collective, isAdmin }) => {
  const { data } = useQuery<{ account: Account }>(updatesSectionQuery, {
    context: API_V2_CONTEXT,
    variables: getUpdatesSectionQueryVariables(collective.slug, isAdmin),
  });

  const updates = get(data, 'account.updates.nodes', [] as Update[]);

  // Nothing to show if updates is empty and user can't add new ones
  if (isEmpty(updates) && !isAdmin) {
    return null;
  }

  // TODO loading state?
  // TODO error state
  return (
    <ContainerSectionContent pb={4}>
      <SectionTitle fontSize={['20px', '24px', '32px']} color="black.700" mb={24}>
        <FormattedMessage
          id="CollectivePage.SectionUpdates.Title"
          defaultMessage="News from {collectiveName}"
          values={{
            collectiveName: collective.name,
          }}
        />
      </SectionTitle>
      <Flex mb={4} justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <P
          color="black.700"
          my={2}
          css={{
            flex: '1 0 50%',
            maxWidth: 700,
          }}
        >
          <FormattedMessage id="section.updates.subtitle" defaultMessage="Updates on our activities and progress." />
        </P>
        {isAdmin && (
          <Link href={`${getDashboardRoute(collective)}/updates/new`}>
            <StyledButton data-cy="create-new-update-btn" buttonStyle="primary" my={[2, 0]}>
              <Span fontSize="16px" fontWeight="bold" mr={2}>
                +
              </Span>
              <FormattedMessage id="updates.new.title" defaultMessage="New update" />
            </StyledButton>
          </Link>
        )}
      </Flex>
      {isEmpty(updates) ? (
        <div>
          <MessageBox my={[3, 5]} type="info" withIcon maxWidth={700} fontStyle="italic" fontSize="14px">
            <FormattedMessage
              id="SectionUpdates.PostFirst"
              defaultMessage="Report your progress and keep your community up to date."
            />
          </MessageBox>
        </div>
      ) : (
        <Box mt={[3, 5]} mb={[3, 4]}>
          <StyledCard>
            {updates.map((update, idx) => (
              <Container
                key={update.id}
                p={24}
                display="flex"
                justifyContent="space-between"
                borderBottom={idx === updates.length - 1 ? undefined : '1px solid #e6e8eb'}
              >
                <Flex>
                  <Box mr={3}>
                    <LinkCollective collective={update.fromAccount}>
                      <Avatar collective={update.fromAccount} radius={40} />
                    </LinkCollective>
                  </Box>
                  <Flex flexDirection="column" justifyContent="space-between">
                    <Link href={`${getCollectivePageRoute(collective)}/updates/${update.slug}`}>
                      <P color="black.900" fontWeight="600" mb={2}>
                        {update.title}
                      </P>
                    </Link>
                    {update.userCanSeeUpdate ? (
                      <Container>
                        <HTMLContent
                          style={{
                            display: 'inline',
                          }}
                          content={update.summary}
                        />
                        {` `}
                        <StyledLink
                          as={Link}
                          fontSize="12px"
                          href={`${getCollectivePageRoute(collective)}/updates/${update.slug}`}
                        >
                          <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
                        </StyledLink>
                      </Container>
                    ) : (
                      <PrivateUpdateMesgBox type="info" data-cy="mesgBox">
                        <FormattedMessage
                          id="update.private.cannot_view_message"
                          defaultMessage="Contribute to {collective} to see this Update"
                          values={{
                            collective: collective.name,
                          }}
                        />
                      </PrivateUpdateMesgBox>
                    )}
                    <Container color="black.600" mt={2} fontSize="12px">
                      {update.isPrivate && (
                        <StyledTooltip
                          content={() => (
                            <FormattedMessage
                              id="update.private.lock_text"
                              defaultMessage="This update is for contributors only"
                            />
                          )}
                        >
                          <Box mr={1}>
                            <Lock
                              data-tip
                              data-for="privateLockText"
                              data-cy="privateIcon"
                              size={12}
                              cursor="pointer"
                            />
                          </Box>
                        </StyledTooltip>
                      )}
                      {update.publishedAt ? (
                        <FormattedMessage
                          id="update.publishedAtBy"
                          defaultMessage="Published on {date} by {author}"
                          values={{
                            date: formatDate(update.publishedAt, {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }),
                            author: <LinkCollective collective={update.fromAccount} />,
                          }}
                        />
                      ) : (
                        <FormattedMessage
                          id="update.createdAtBy"
                          defaultMessage="Created on {date} (draft) by {author}"
                          values={{
                            date: formatDate(update.createdAt),
                            author: <LinkCollective collective={update.fromAccount} />,
                          }}
                        />
                      )}
                    </Container>
                  </Flex>
                </Flex>
              </Container>
            ))}
          </StyledCard>
          {updates.length > 0 && (
            <Link href={`${getCollectivePageRoute(collective)}/updates`}>
              <StyledButton data-cy="view-all-updates-btn" mt={4} width={1} buttonSize="small" fontSize="14px">
                <FormattedMessage id="CollectivePage.SectionUpdates.ViewAll" defaultMessage="View all updates" /> →
              </StyledButton>
            </Link>
          )}
        </Box>
      )}
    </ContainerSectionContent>
  );
};

export default SectionUpdates;
