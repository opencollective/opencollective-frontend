import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import { getCollectivePageMetadata } from '../lib/collective';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import type { Account } from '../lib/graphql/types/v2/graphql';

import AuthenticatedPage from '../components/AuthenticatedPage';
import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { accountNavbarFieldsFragment } from '../components/collective-navbar/fragments';
import CollectiveContactForm from '../components/CollectiveContactForm';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';

const getPageMetaData = (intl: IntlShape, collective: Account) => {
  const baseMetadata = getCollectivePageMetadata(collective);
  if (collective) {
    return {
      ...baseMetadata,
      title: intl.formatMessage(
        { id: 'ContactCollective', defaultMessage: 'Contact {collective}' },
        { collective: collective.name },
      ),
      noRobots: false,
    };
  } else {
    return {
      ...baseMetadata,
      title: 'Contact collective',
      noRobots: false,
    };
  }
};

/**
 * A page to contact accounts.
 */
const CollectiveContact = () => {
  const intl = useIntl();
  const router = useRouter();
  const collectiveSlug = router.query?.collectiveSlug as string;

  // We query here rather than SSR cause the query is authenticated
  const { loading, data, error } = useQuery(collectiveContactPageQuery, {
    variables: { collectiveSlug },
    context: API_V2_CONTEXT,
  });

  if (!loading) {
    if (error) {
      return <ErrorPage data={error} />;
    } else if (!data?.account) {
      return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
    }
  }

  return (
    <AuthenticatedPage {...getPageMetaData(intl, data?.account)}>
      {() =>
        !data?.account ? (
          <Loading />
        ) : (
          <CollectiveThemeProvider collective={data.account}>
            <Container>
              <CollectiveNavbar collective={data.account} selectedCategory={NAVBAR_CATEGORIES.CONNECT} />
              <Container py={[4, 5]} px={[2, 3, 4]}>
                {!data.account.permissions.contact.allowed ? (
                  <MessageBox type="warning" withIcon maxWidth={600} m="0 auto">
                    <FormattedMessage
                      id="CollectiveContact.NotAllowed"
                      defaultMessage="This Collective can't be contacted via Open Collective."
                    />
                  </MessageBox>
                ) : (
                  <CollectiveContactForm collective={data.account} />
                )}
              </Container>
            </Container>
          </CollectiveThemeProvider>
        )
      }
    </AuthenticatedPage>
  );
};

const collectiveContactPageQuery = gql`
  query CollectiveContactPage($collectiveSlug: String!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      slug
      name
      type
      permissions {
        id
        contact {
          allowed
        }
      }
      description
      settings
      imageUrl
      twitterHandle
      features {
        id
        ...NavbarFields
      }
    }
  }
  ${accountNavbarFieldsFragment}
`;

// ignore unused exports default
// next.js export
export default CollectiveContact;
