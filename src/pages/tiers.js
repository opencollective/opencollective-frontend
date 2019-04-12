import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { get } from 'lodash';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
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
import { addCollectiveData } from '../graphql/queries';
import { P, H3 } from '../components/Text';

class TiersPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveData
    query: PropTypes.object, // from getInitialProps
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { LoggedInUser, data = {}, intl } = this.props;

    if (!data || !data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    const logo = collective.image || get(collective.parentCollective, 'image');

    return (
      <div>
        <Header
          title={'Tiers'}
          description="All the collectives that you are giving money to"
          LoggedInUser={LoggedInUser}
        />
        <Body>
          {data.loading ? (
            <Loading />
          ) : (
            <Fragment>
              <Container display="flex" flexDirection="column" alignItems="center" width={1} my={4}>
                <Link href={`/${collective.slug}`}>
                  <Logo
                    src={logo}
                    className="TiersPage"
                    type={collective.type}
                    website={collective.website}
                    height="10rem"
                    key={logo}
                  />
                  <H3 lineHeight={1.2} color="black.800" textAlign="center">
                    {collective.name}
                  </H3>
                </Link>
                <P lineHeight={4} fontSize="1.6rem" color="black.500">
                  Support this collective
                </P>
              </Container>
              <Container mx={4} px={4} my={4}>
                {collective.isActive && collective.host && (
                  <Container display="flex" justifyContent="center" mx={4} width={1}>
                    {collective.tiers.map(tier => (
                      <TierCard
                        key={`TierCard-${tier.slug}`}
                        collective={collective}
                        tier={tier}
                        intl={intl}
                        className="TiersPage"
                      />
                    ))}
                  </Container>
                )}
                <Container display="flex" justifyContent="center" width={1} my={4}>
                  <Link route="orderCollective" params={{ collectiveSlug: collective.slug, verb: 'donate' }}>
                    <a>
                      <FormattedMessage id="collective.tiers.donate" defaultMessage="Or make a one time donation" />
                    </a>
                  </Link>
                </Container>
              </Container>
            </Fragment>
          )}
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withData(withIntl(withUser(addCollectiveData(TiersPage))));
