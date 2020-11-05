import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Lock } from '@styled-icons/fa-solid';
import { get, isEmpty } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { formatDate } from '../../../lib/utils';

import Avatar from '../../Avatar';
import Container from '../../Container';
import ConversationsList from '../../conversations/ConversationsList';
import { conversationListFragment, updateListFragment } from '../../conversations/graphql';
import { Box, Flex } from '../../Grid';
import HTMLContent from '../../HTMLContent';
import Link from '../../Link';
import LinkCollective from '../../LinkCollective';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledCard from '../../StyledCard';
import StyledLink from '../../StyledLink';
import StyledTooltip from '../../StyledTooltip';
import { H3, P, Span } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import { updatesFieldsFragment } from '../graphql/fragments';
import SectionHeader from '../SectionHeader';

export const connectSectionQuery = gqlV2/* GraphQL */ `
  query ConnectSection($collectiveSlug: String!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      conversations(limit: 3) {
        ...ConversationListFragment
      }
      updates {
        ...UpdateListFragment
      }
    }
  }
  ${conversationListFragment}
  ${updateListFragment}
`;

/** Query to re-fetch updates */
export const updatesSectionQuery = gql`
  query UpdatesSection($slug: String!, $onlyPublishedUpdates: Boolean) {
    Collective(slug: $slug) {
      id
      updates(limit: 3, onlyPublishedUpdates: $onlyPublishedUpdates) {
        ...UpdatesFields
      }
    }
  }

  ${updatesFieldsFragment}
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
 * Connect section (comprises Conversations and Updates).
 */
class SectionConnect extends React.PureComponent {
  static propTypes = {
    /** Collective */
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,

    /** From GraphQL */
    data: PropTypes.shape({
      refetch: PropTypes.func,
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.shape({
        conversations: PropTypes.shape({
          totalCount: PropTypes.number,
          nodes: PropTypes.arrayOf(PropTypes.object),
        }),
        updates: PropTypes.shape({
          totalCount: PropTypes.number,
          nodes: PropTypes.arrayOf(PropTypes.object),
        }),
      }),
    }),

    section: PropTypes.string,

    /** Does user can see Updates drafts? */
    isAdmin: PropTypes.bool.isRequired,
    /** Is user loggedIn? */
    isLoggedIn: PropTypes.bool.isRequired,
  };

  componentDidUpdate(oldProps) {
    // If user log in/out we need to refresh data as it depends on the current user
    const refetch = get(this.props.data, 'refetch');
    if (oldProps.isLoggedIn !== this.props.isLoggedIn && refetch) {
      refetch();
    }
  }

  renderUpdatesSubsection() {
    const { collective, data, isAdmin } = this.props;
    const updates = get(data, 'account.updates', {});

    if (isEmpty(updates)) {
      return null;
    }

    // Nothing to show if updates is empty and user can't add new ones
    if (isEmpty(updates.nodes) && !isAdmin) {
      return null;
    }

    return (
      <React.Fragment>
        <ContainerSectionContent>
          <Flex mb={3} justifyContent="space-between" alignItems="center" flexWrap="wrap">
            <H3 fontSize="20px" fontWeight="600" color="black.700">
              <FormattedMessage id="updates" defaultMessage="Updates" />
            </H3>
            {/* TO DO: CONTRIBUTOR AVATARS */}
            {isAdmin && (
              <Link route="createUpdate" params={{ collectiveSlug: collective.slug }}>
                <StyledButton data-cy="create-new-update-btn" buttonStyle="primary">
                  <Span fontSize="16px" fontWeight="bold" mr={2}>
                    +
                  </Span>
                  <FormattedMessage id="CollectivePage.SectionUpdates.CreateBtn" defaultMessage="Create a new update" />
                </StyledButton>
              </Link>
            )}
          </Flex>
          {isEmpty(updates.nodes) ? (
            <div>
              <MessageBox my={5} type="info" withIcon maxWidth={700} fontStyle="italic" fontSize="14px">
                <FormattedMessage
                  id="SectionUpdates.PostFirst"
                  defaultMessage="Use this section to promote your actions and keep your community up-to-date."
                />
              </MessageBox>
            </div>
          ) : (
            <StyledCard data-cy="updatesList">
              {updates.nodes.map((update, idx) => (
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
                      <Link route="update" params={{ collectiveSlug: collective.slug, updateSlug: update.slug }}>
                        <P color="black.900" fontWeight="600" mb={2}>
                          {update.title}
                        </P>
                      </Link>
                      {update.userCanSeeUpdate ? (
                        <Container>
                          <HTMLContent style={{ display: 'inline' }} content={update.summary} />
                          {` `}
                          <StyledLink
                            as={Link}
                            fontSize="12px"
                            route="update"
                            params={{ collectiveSlug: collective.slug, updateSlug: update.slug }}
                          >
                            <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
                          </StyledLink>
                        </Container>
                      ) : (
                        <PrivateUpdateMesgBox type="info" data-cy="mesgBox">
                          <FormattedMessage
                            id="update.private.cannot_view_message"
                            defaultMessage="Become a backer of {collective} to see this update"
                            values={{ collective: collective.name }}
                          />
                        </PrivateUpdateMesgBox>
                      )}
                      <Container color="black.400" mt={2} fontSize="12px">
                        {update.isPrivate && (
                          <StyledTooltip
                            content={() => (
                              <FormattedMessage id="update.private.lock_text" defaultMessage="This update is private" />
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
                            defaultMessage={'Created on {date} (draft) by {author}'}
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
          )}
          {updates.nodes.length > 0 && (
            <Link route="updates" params={{ collectiveSlug: collective.slug }}>
              <StyledButton data-cy="view-all-updates-btn" mt={4} width={1} buttonSize="small" fontSize="14px">
                <FormattedMessage id="CollectivePage.SectionUpdates.ViewAll" defaultMessage="View all updates" /> →
              </StyledButton>
            </Link>
          )}
        </ContainerSectionContent>
      </React.Fragment>
    );
  }

  renderConversationsSubsection() {
    const { collective, data } = this.props;
    const conversations = get(data, 'account.conversations', {});

    return (
      <React.Fragment>
        <ContainerSectionContent>
          <Flex mb={3} justifyContent="space-between" alignItems="center" flexWrap="wrap">
            <H3 fontSize="20px" fontWeight="600" color="black.700">
              <FormattedMessage id="conversations" defaultMessage="Conversations" />
            </H3>
            <Link route="create-conversation" params={{ collectiveSlug: collective.slug }}>
              <StyledButton buttonStyle="primary">
                <Span fontSize="16px" fontWeight="bold" mr={2}>
                  &larr;
                </Span>
                <FormattedMessage id="conversations.create" defaultMessage="Create conversation" />
              </StyledButton>
            </Link>
          </Flex>
          {isEmpty(conversations.nodes) ? (
            <Box my={5}>
              <Link route="create-conversation" params={{ collectiveSlug: collective.slug }}>
                <StyledButton buttonStyle="primary" buttonSize="large">
                  <FormattedMessage id="conversations.createFirst" defaultMessage="Start a new conversation" />
                </StyledButton>
              </Link>
            </Box>
          ) : (
            <Box>
              <ConversationsList collectiveSlug={collective.slug} conversations={conversations.nodes} />
            </Box>
          )}
          {conversations.totalCount > 3 && (
            <Link route="conversations" params={{ collectiveSlug: collective.slug }}>
              <StyledButton width="100%" mt={4} buttonSize="small" fontSize="14px">
                <FormattedMessage id="Conversations.ViewAll" defaultMessage="View all conversations" /> →
              </StyledButton>
            </Link>
          )}
        </ContainerSectionContent>
      </React.Fragment>
    );
  }

  render() {
    const { data, section } = this.props;

    return (
      <ContainerSectionContent pt={5} pb={3}>
        <SectionHeader
          section={section}
          subtitle={<FormattedMessage id="section.connect.subtitle" defaultMessage="Let’s get the ball rolling!" />}
          info={
            <FormattedMessage
              id="section.connect.info"
              defaultMessage="Start conversations with your community or share updates on how things are going."
            />
          }
        />
        {data.loading ? (
          <Container py={[5, 6]}>
            <Loading />
          </Container>
        ) : (
          <React.Fragment>
            <Box mb={3}>{this.renderUpdatesSubsection()}</Box>
            <Box mt={3}>{this.renderConversationsSubsection()}</Box>
          </React.Fragment>
        )}
      </ContainerSectionContent>
    );
  }
}

export const getConnectSectionQueryVariables = (slug, isAdmin = false) => {
  return { collectiveSlug: slug, onlyPublishedUpdates: !isAdmin };
};

const addConnectSectionData = graphql(connectSectionQuery, {
  options: props => ({
    variables: getConnectSectionQueryVariables(props.collective.slug, props.isAdmin),
    context: API_V2_CONTEXT,
  }),
});

export default injectIntl(addConnectSectionData(SectionConnect));
