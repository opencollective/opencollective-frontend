import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { generateNotFoundError } from '../lib/errors';

import AuthenticatedPage from '../components/AuthenticatedPage';
import CollectiveNavbar from '../components/collective-navbar';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import CollectiveContactForm from '../components/CollectiveContactForm';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import { withUser } from '../components/UserProvider';

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class CollectiveContact extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { collectiveSlug };
  }

  static propTypes = {
    /** @ignore from getInitialProps */
    collectiveSlug: PropTypes.string.isRequired,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
    /** @ignore from apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      Collective: PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        type: PropTypes.string.isRequired,
        twitterHandle: PropTypes.string,
        imageUrl: PropTypes.string,
        canContact: PropTypes.bool,
      }),
    }).isRequired, // from withData
  };

  getPageMetaData(collective) {
    if (collective) {
      return {
        title: `Contact ${collective.name}`,
        description: collective.description,
        twitterHandle: collective.twitterHandle || get(collective, 'parentCollective.twitterHandle'),
        image: collective.image || get(collective, 'parentCollective.image'),
        noRobots: false,
      };
    } else {
      return {
        title: 'Contact collective',
        image: '/static/images/defaultBackgroundImage.png',
        noRobots: false,
      };
    }
  }

  setSubject = e => {
    this.setState({ subject: e.target.value });
  };

  setMessage = e => {
    this.setState({ message: e.target.value });
  };

  renderContent() {
    const { data } = this.props;

    if (!data.Collective.canContact) {
      return (
        <MessageBox type="warning" withIcon maxWidth={600} m="0 auto">
          <FormattedMessage
            id="CollectiveContact.NotAllowed"
            defaultMessage="This Collective can't be contacted via Open Collective."
          />
        </MessageBox>
      );
    } else {
      return <CollectiveContactForm collective={data.Collective} />;
    }
  }

  render() {
    const { collectiveSlug, data } = this.props;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.Collective) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      }
    }

    const collective = data && data.Collective;
    return (
      <AuthenticatedPage {...this.getPageMetaData(collective)}>
        {() =>
          data.loading ? (
            <Loading />
          ) : (
            <CollectiveThemeProvider collective={data.Collective}>
              <Container>
                <CollectiveNavbar collective={data.Collective} selectedCategory={NAVBAR_CATEGORIES.CONNECT} />
                <Container py={[4, 5]} px={[2, 3, 4]}>
                  {this.renderContent()}
                </Container>
              </Container>
            </CollectiveThemeProvider>
          )
        }
      </AuthenticatedPage>
    );
  }
}

const collectiveContactPageQuery = gql`
  query CollectiveContactPage($collectiveSlug: String!) {
    Collective(slug: $collectiveSlug, throwIfMissing: false) {
      id
      slug
      path
      name
      type
      canContact
      description
      settings
      imageUrl
      twitterHandle
      features {
        ...NavbarFields
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

const addCollectiveContactPageData = graphql(collectiveContactPageQuery);

export default withUser(addCollectiveContactPageData(CollectiveContact));
