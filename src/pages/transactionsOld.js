import React from 'react';
import PropTypes from 'prop-types';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';

import TransactionsWithDataOld from '../apps/expenses/components/TransactionsWithDataOld';

import { addCollectiveCoverData } from '../graphql/queries';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

class TransactionsOldPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveCoverData
    data: PropTypes.object.isRequired, // from withData
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;

    if (!data.Collective) return <ErrorPage data={data} />;

    const collective = data.Collective;
    const cta = ['USER', 'ORGANIZATION'].indexOf(collective.type) === -1 && {
      href: `/${collective.slug}#contribute`,
      label: 'contribute',
    };

    return (
      <div className="TransactionsPage">
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <CollectiveCover
            collective={collective}
            href={`/${collective.slug}`}
            cta={cta}
            LoggedInUser={LoggedInUser}
          />

          <div className="content">
            <TransactionsWithDataOld
              collective={collective}
              LoggedInUser={this.state.LoggedInUser}
              showOldTransactions={true}
              showCSVlink={true}
              filters={true}
            />
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withData(
  withIntl(withLoggedInUser(addCollectiveCoverData(TransactionsOldPage))),
);
