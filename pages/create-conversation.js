import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../lib/allowed-features';
import { NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import ContainerOverlay from '../components/ContainerOverlay';
import CreateConversationForm from '../components/conversations/CreateConversationForm';
import ErrorPage from '../components/ErrorPage';
import { Box } from '../components/Grid';
import Link from '../components/Link';
import Loading from '../components/Loading';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import StyledLink from '../components/StyledLink';
import { withUser } from '../components/UserProvider';

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class CreateConversationPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, tag } }) {
    return { collectiveSlug, tag };
  }

  static propTypes = {
    /** @ignore from getInitialProps */
    collectiveSlug: PropTypes.string.isRequired,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
    /** @ignore from withUser */
    loadingLoggedInUser: PropTypes.bool,
    /** @ignore from withRouter */
    router: PropTypes.object,
    /** @ignore from apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        type: PropTypes.string.isRequired,
        twitterHandle: PropTypes.string,
        imageUrl: PropTypes.string,
        conversationsTags: PropTypes.arrayOf(PropTypes.string),
      }),
    }).isRequired, // from withData
  };

  getPageMetaData(collective) {
    if (collective) {
      return { title: `${collective.name} - New conversation` };
    } else {
      return { title: `New conversation` };
    }
  }

  onCreateSuccess = async conversation => {
    const { collectiveSlug } = this.props;
    await this.props.router.push(`${collectiveSlug}/conversations/${conversation.slug}-${conversation.id}`);
  };

  getSuggestedTags(collective) {
    const tagsStats = (collective && collective.conversationsTags) || null;
    return tagsStats && tagsStats.map(({ tag }) => tag);
  }

  render() {
    const { collectiveSlug, data, LoggedInUser, loadingLoggedInUser, router } = this.props;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      } else if (!hasFeature(data.account, FEATURES.CONVERSATIONS)) {
        return <PageFeatureNotSupported />;
      }
    }

    const collective = data && data.account;
    return (
      <Page collective={collective} {...this.getPageMetaData(collective)}>
        {data.loading ? (
          <Container borderTop="1px solid #E8E9EB">
            <Loading />
          </Container>
        ) : (
          <CollectiveThemeProvider collective={collective}>
            <Container borderTop="1px solid #E8E9EB">
              <CollectiveNavbar
                collective={collective}
                selected={Sections.CONVERSATIONS}
                selectedCategory={NAVBAR_CATEGORIES.CONNECT}
              />
              <Container position="relative">
                {!loadingLoggedInUser && !LoggedInUser && (
                  <ContainerOverlay>
                    <SignInOrJoinFree routes={{ join: `/create-account?next=${encodeURIComponent(router.asPath)}` }} />
                  </ContainerOverlay>
                )}
                <Box maxWidth={1160} m="0 auto" px={[2, 3, 4]} py={[4, 5]}>
                  <StyledLink as={Link} color="black.600" href={`${collectiveSlug}/conversations`}>
                    &larr; <FormattedMessage id="Conversations.GoBack" defaultMessage="Back to conversations" />
                  </StyledLink>
                  <Box mt={4}>
                    <CreateConversationForm
                      collective={collective}
                      LoggedInUser={LoggedInUser}
                      loading={loadingLoggedInUser}
                      onSuccess={this.onCreateSuccess}
                      suggestedTags={this.getSuggestedTags(collective)}
                    />
                  </Box>
                </Box>
              </Container>
            </Container>
          </CollectiveThemeProvider>
        )}
      </Page>
    );
  }
}

const createConversationPageQuery = gqlV2/* GraphQL */ `
  query CreateConversationPage($collectiveSlug: String!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      slug
      name
      type
      description
      settings
      imageUrl
      twitterHandle
      conversationsTags {
        id
        tag
      }
      features {
        ...NavbarFields
      }

      ... on AccountWithHost {
        isApproved
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

const addCreateConversationPageData = graphql(createConversationPageQuery, {
  options: {
    context: API_V2_CONTEXT,
  },
});

export default withUser(withRouter(addCreateConversationPageData(CreateConversationPage)));
