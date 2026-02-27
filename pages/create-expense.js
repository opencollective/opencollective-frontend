import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../lib/allowed-features';
import { expenseSubmissionAllowed, getCollectivePageMetadata, isHiddenAccount } from '../lib/collective';
import { generateNotFoundError } from '../lib/errors';
import { gql } from '../lib/graphql/helpers';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL, getCollectivePageRoute } from '../lib/url-helpers';
import UrlQueryHelper from '../lib/UrlQueryHelper';
import { compose } from '../lib/utils';

import CollectiveNavbar from '../components/collective-navbar';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import ContainerOverlay from '../components/ContainerOverlay';
import ErrorPage from '../components/ErrorPage';
import { Flex } from '../components/Grid';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import SignInOrJoinFree, { SignInOverlayBackground } from '../components/SignInOrJoinFree';
import { SubmitExpenseFlow } from '../components/submit-expense/SubmitExpenseFlow';
import { withUser } from '../components/UserProvider';

const CreateExpensePageUrlQueryHelper = new UrlQueryHelper({
  collectiveSlug: { type: 'string' },
  parentCollectiveSlug: { type: 'string' },
  customData: { type: 'json' },
});

const NAVBAR_CALLS_TO_ACTION = { hasSubmitExpense: false, hasRequestGrant: false };

class CreateExpensePage extends React.Component {
  static getInitialProps({ query: query }) {
    return CreateExpensePageUrlQueryHelper.decode(query);
  }

  static propTypes = {
    /** from getInitialProps */
    collectiveSlug: PropTypes.string.isRequired,
    parentCollectiveSlug: PropTypes.string,
    customData: PropTypes.object,
    /** from withUser */
    LoggedInUser: PropTypes.object,
    /** from withUser */
    loadingLoggedInUser: PropTypes.bool,
    /** from withRouter */
    router: PropTypes.object,
    /** from apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      refetch: PropTypes.func,
      account: PropTypes.object,
    }).isRequired,
  };

  componentDidMount() {
    const { router, data } = this.props;
    const account = data?.account;
    addParentToURLIfMissing(router, account, '/expenses/new');

    if (this.props.LoggedInUser) {
      this.props.data.refetch();
    }
  }

  componentDidUpdate(oldProps) {
    if (!oldProps.LoggedInUser && this.props.LoggedInUser) {
      this.props.data.refetch();
    }
  }

  getPageMetaData(collective) {
    const baseMetadata = getCollectivePageMetadata(collective);
    const canonicalURL = `${getCollectivePageCanonicalURL(collective)}/expenses/new`;
    if (collective) {
      return { ...baseMetadata, title: `${collective.name} - New expense`, canonicalURL };
    } else {
      return { ...baseMetadata, title: `New expense`, canonicalURL };
    }
  }

  render() {
    const { collectiveSlug, data, LoggedInUser, loadingLoggedInUser, router } = this.props;

    if (!data.loading) {
      if (data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account || isHiddenAccount(data.account)) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      } else if (
        (!hasFeature(data.account, FEATURES.RECEIVE_EXPENSES) && !hasFeature(data.account, FEATURES.RECEIVE_GRANTS)) ||
        data.account.supportedExpenseTypes.length === 0
      ) {
        return <PageFeatureNotSupported />;
      } else if (data.account.isArchived) {
        return <PageFeatureNotSupported showContactSupportLink={false} />;
      }
    }

    const collective = data.account;

    return (
      <Page collective={collective} {...this.getPageMetaData(collective)}>
        {!expenseSubmissionAllowed(collective, LoggedInUser) ? (
          <Flex justifyContent="center" p={5}>
            <MessageBox type="error" withIcon>
              <FormattedMessage
                id="mustBeMemberOfCollective"
                defaultMessage="You must be a member of the collective to see this page"
              />
            </MessageBox>
          </Flex>
        ) : !loadingLoggedInUser && !LoggedInUser ? (
          <React.Fragment>
            <CollectiveNavbar collective={collective} isLoading={!collective} callsToAction={NAVBAR_CALLS_TO_ACTION} />
            <Container position="relative" minHeight={[null, 800]}>
              <ContainerOverlay
                py={[2, null, 6]}
                top="0"
                position={['fixed', null, 'absolute']}
                justifyContent={['center', null, 'flex-start']}
              >
                <SignInOverlayBackground>
                  <SignInOrJoinFree
                    showOCLogo={false}
                    showSubHeading={false}
                    hideFooter
                    routes={{ join: `/create-account?next=${encodeURIComponent(router.asPath)}` }}
                  />
                </SignInOverlayBackground>
              </ContainerOverlay>
            </Container>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <CollectiveNavbar collective={collective} isLoading={!collective} callsToAction={NAVBAR_CALLS_TO_ACTION} />
            <SubmitExpenseFlow
              submitExpenseTo={collectiveSlug}
              onClose={() => {
                router.push(`${getCollectivePageRoute(collective)}/expenses`);
              }}
            />
          </React.Fragment>
        )}
      </Page>
    );
  }
}

const createExpensePageQuery = gql`
  query CreateExpensePage($collectiveSlug: String!) {
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
      currency
      isArchived
      isActive
      isSuspended
      expensePolicy
      supportedExpenseTypes
      features {
        id
        ...NavbarFieldsV1
        MULTI_CURRENCY_EXPENSES
      }
      expensesTags {
        id
        tag
      }

      stats {
        id
        balance {
          valueInCents
          currency
        }
        balanceWithBlockedFunds: balance(withBlockedFunds: true) {
          valueInCents
          currency
        }
      }

      ... on AccountWithHost {
        isApproved
        host {
          id
        }
      }

      ... on Organization {
        isHost
        isActive
        host {
          id
        }
      }

      ... on AccountWithParent {
        parent {
          id
          slug
          expensePolicy
          imageUrl
          backgroundImageUrl
          twitterHandle
        }
      }
    }
  }

  ${collectiveNavbarFieldsFragment}
`;

const addCreateExpensePageData = graphql(createExpensePageQuery, {
  options: {
    fetchPolicy: 'cache-and-network',
  },
});

const addHoc = compose(withUser, withRouter, addCreateExpensePageData);

// next.js export
// ts-unused-exports:disable-next-line
export default addHoc(CreateExpensePage);
