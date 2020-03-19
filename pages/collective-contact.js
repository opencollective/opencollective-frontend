import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { get } from 'lodash';

import { ssrNotFoundError } from '../lib/nextjs_utils';
import { generateNotFoundError } from '../lib/errors';
import { withUser } from '../components/UserProvider';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import AuthenticatedPage from '../components/AuthenticatedPage';
import MessageBox from '../components/MessageBox';
import { FormattedMessage } from 'react-intl';
import CollectiveNavbar from '../components/CollectiveNavbar';
import CollectiveContactForm from '../components/CollectiveContactForm';

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
      };
    } else {
      return {
        title: 'Contact collective',
        image: '/static/images/defaultBackgroundImage.png',
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
        ssrNotFoundError(); // Force 404 when rendered server side
        return <ErrorPage error={generateNotFoundError(collectiveSlug, true)} log={false} />;
      }
    }

    const collective = data && data.Collective;
    return (
      <AuthenticatedPage {...this.getPageMetaData(collective)} withoutGlobalStyles>
        {() =>
          data.loading ? (
            <Loading />
          ) : (
            <CollectiveThemeProvider collective={data.Collective}>
              <Container>
                <CollectiveNavbar collective={data.Collective} />
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

// eslint-disable graphql/template-strings
const getCollective = graphql(
  gql`
    query ContactPage($collectiveSlug: String!) {
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
      }
    }
  `,
);

export default withUser(getCollective(CollectiveContact));
