import React, { Fragment } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Header from '../components/Header';
import Body from '../components/Body';
import Container from '../components/Container';
import TierCard from '../components/TierCard';
import Footer from '../components/Footer';
import Link from '../components/Link';
import Logo from '../components/Logo';
import Loading from '../components/Loading';
import ErrorPage from '../components/ErrorPage';
import { withUser } from '../components/UserProvider';
import { addCollectiveData } from '../lib/graphql/queries';
import { P, H3 } from '../components/Text';

const TierCardPage = styled(TierCard)`
  margin: 20px;
`;

class TiersPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveData
    query: PropTypes.object, // from getInitialProps
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  render() {
    const { LoggedInUser, data = {} } = this.props;

    if (!data || !data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;

    return (
      <div>
        <Header
          title={'Tiers'}
          description="Collective tiers"
          canonicalURL={`/${collective.slug}/contribute`}
          LoggedInUser={LoggedInUser}
        />
        <Body>
          {data.loading ? (
            <Loading />
          ) : (
            <Fragment>
              <Container display="flex" flexDirection="column" alignItems="center" width={1} my={4}>
                <Link href={`/${collective.slug}`}>
                  <Logo collective={collective} height="10rem" />
                </Link>
                <Link href={`/${collective.slug}`}>
                  <H3 lineHeight={1.2} color="black.800" textAlign="center">
                    {collective.name}
                  </H3>
                </Link>
                <P lineHeight={4} fontSize="1.6rem" color="black.500">
                  <FormattedMessage id="tiers.support.message" defaultMessage="Support this collective" />
                </P>
              </Container>
              <Container>
                {collective.isActive && collective.host && (
                  <Container display="flex" flexWrap="wrap" data-cy="tiers" justifyContent="center" m={4}>
                    {collective.tiers.map(tier => (
                      <TierCardPage key={`TierCard-${tier.id}`} collective={collective} tier={tier} />
                    ))}
                  </Container>
                )}
                {collective.isActive && collective.host && (
                  <Container display="flex" justifyContent="center" width={1} my={4}>
                    <Link route="orderCollective" params={{ collectiveSlug: collective.slug, verb: 'donate' }}>
                      <FormattedMessage
                        id="collective.tiers.donate"
                        defaultMessage="Or make a custom financial contribution"
                      />
                    </Link>
                  </Container>
                )}
              </Container>
            </Fragment>
          )}
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withUser(addCollectiveData(TiersPage));
