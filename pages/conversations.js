import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../lib/allowed-features';
import { getCollectivePageMetadata, shouldIndexAccountOnSearchEngines } from '../lib/collective';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import ConversationsList from '../components/conversations/ConversationsList';
import { conversationListFragment } from '../components/conversations/graphql';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import Link from '../components/Link';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import StyledButton from '../components/StyledButton';
import StyledTag from '../components/StyledTag';
import { H1, H4, P } from '../components/Text';
import { withUser } from '../components/UserProvider';

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class ConversationsPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, tag } }) {
    return { collectiveSlug, tag };
  }

  static propTypes = {
    /** @ignore from getInitialProps */
    collectiveSlug: PropTypes.string.isRequired,
    /** @ignore from getInitialProps */
    tag: PropTypes.string,
    /** @ignore from apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        type: PropTypes.string.isRequired,
        twitterHandle: PropTypes.string,
        imageUrl: PropTypes.string,
        canContact: PropTypes.bool,
        conversations: PropTypes.shape({
          nodes: PropTypes.arrayOf(PropTypes.object),
        }).isRequired,
        conversationsTags: PropTypes.arrayOf(
          PropTypes.shape({
            tag: PropTypes.string.isRequired,
          }),
        ).isRequired,
      }),
    }).isRequired, // from withData
    router: PropTypes.object,
  };

  getPageMetaData(collective) {
    const baseMetadata = getCollectivePageMetadata(collective);
    if (collective) {
      return {
        ...baseMetadata,
        title: `${collective.name}'s conversations`,
        noRobots: !shouldIndexAccountOnSearchEngines(collective),
      };
    } else {
      return { ...baseMetadata, title: 'Conversations' };
    }
  }

  resetTag = () => {
    const { collectiveSlug } = this.props;
    this.props.router.push(`/${collectiveSlug}/conversations`);
  };

  /** Must only be called when dataIsReady */
  renderConversations(conversations) {
    const { collectiveSlug } = this.props;
    if (conversations.length > 0) {
      return <ConversationsList collectiveSlug={collectiveSlug} conversations={conversations} />;
    } else {
      return (
        <div>
          {this.props.tag && (
            <MessageBox mb={4} type="info" withIcon>
              <FormattedMessage
                id="conversations.noMatch"
                defaultMessage="No conversation matching the given criteria."
              />
            </MessageBox>
          )}
          <Link href={`/${collectiveSlug}/conversations/new`}>
            <StyledButton buttonStyle="primary" buttonSize="large">
              <FormattedMessage id="conversations.createFirst" defaultMessage="Start a new conversation" />
            </StyledButton>
          </Link>
        </div>
      );
    }
  }

  render() {
    const { collectiveSlug, data } = this.props;
    const conversations = get(data, 'account.conversations.nodes', []);

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      }
    }

    const collective = data.account;
    const dataIsReady = collective && collective.conversations;
    if (collective && !hasFeature(collective, FEATURES.CONVERSATIONS)) {
      return <PageFeatureNotSupported />;
    }

    return (
      <Page collective={collective} {...this.getPageMetaData(collective)}>
        {!dataIsReady && data.loading ? (
          <Container>
            <Loading />
          </Container>
        ) : (
          <CollectiveThemeProvider collective={collective}>
            <Container data-cy="page-conversations">
              <CollectiveNavbar collective={collective} selectedCategory={NAVBAR_CATEGORIES.CONNECT} />
              <Container py={[4, 5]} px={[2, 3, 4]}>
                <Container maxWidth={1200} m="0 auto">
                  <H1 fontSize="40px" fontWeight="normal" textAlign="left" mb={2}>
                    <FormattedMessage id="conversations" defaultMessage="Conversations" />
                  </H1>
                  <Flex flexWrap="wrap" alignItems="center" mb={4} pr={2} justifyContent="space-between">
                    <P color="black.700">
                      <FormattedMessage
                        id="conversations.subtitle"
                        defaultMessage="Let’s get the discussion going! This is a space for the community to converse, ask questions, say thank you, and get things done together."
                      />
                    </P>
                    {conversations.length > 0 && (
                      <Flex flex="0 0 300px" flexWrap="wrap" mt={2}>
                        <Link href={`/${collectiveSlug}/conversations/new`}>
                          <StyledButton buttonStyle="primary" m={2}>
                            <FormattedMessage id="conversations.create" defaultMessage="Create a Conversation" />
                          </StyledButton>
                        </Link>
                      </Flex>
                    )}
                  </Flex>
                  <Flex flexDirection={['column-reverse', null, 'row']} justifyContent="space-between">
                    <Box mr={[null, null, null, 5]} flex="1 1 73%">
                      {this.renderConversations(conversations)}
                    </Box>
                    <Box mb={3} flex="1 1 27%">
                      {collective.conversationsTags.length > 0 && (
                        <React.Fragment>
                          <H4 px={2} mb={3}>
                            <FormattedMessage id="Tags" defaultMessage="Tags" />
                          </H4>
                          <Flex flexWrap="wrap" mx={2}>
                            {collective.conversationsTags.map(({ tag }) =>
                              tag === this.props.tag ? (
                                <StyledTag
                                  key={tag}
                                  type="info"
                                  variant="rounded-right"
                                  mb="4px"
                                  mr="4px"
                                  closeButtonProps={{ onClick: this.resetTag }}
                                >
                                  {tag}
                                </StyledTag>
                              ) : (
                                <Link key={tag} href={{ pathname: `/${collectiveSlug}/conversations`, query: { tag } }}>
                                  <StyledTag variant="rounded-right" mb="4px" mr="4px">
                                    {tag}
                                  </StyledTag>
                                </Link>
                              ),
                            )}
                          </Flex>
                        </React.Fragment>
                      )}
                    </Box>
                  </Flex>
                </Container>
              </Container>
            </Container>
          </CollectiveThemeProvider>
        )}
      </Page>
    );
  }
}

const conversationsPageQuery = gql`
  query ConversationsPage($collectiveSlug: String!, $tag: String) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      legacyId
      slug
      name
      type
      description
      settings
      twitterHandle
      imageUrl
      backgroundImageUrl
      ... on AccountWithParent {
        parent {
          id
          imageUrl
          backgroundImageUrl
          twitterHandle
        }
      }
      conversations(tag: $tag) {
        ...ConversationListFragment
      }
      conversationsTags {
        id
        tag
      }
      ... on Collective {
        isApproved
      }
      features {
        id
        ...NavbarFields
      }
    }
  }
  ${conversationListFragment}
  ${collectiveNavbarFieldsFragment}
`;

const addConversationsPageData = graphql(conversationsPageQuery, {
  options: {
    // Because this list is updated often, using this option ensures that the list gets
    // properly updated when doing things like redirecting after a conversation delete.
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  },
});

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(withRouter(addConversationsPageData(ConversationsPage)));
