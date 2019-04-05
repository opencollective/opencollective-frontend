import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';

import TransactionsWithData from '../apps/expenses/components/TransactionsWithData';

import { addCollectiveCoverData } from '../graphql/queries';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import Page from '../components/Page';
import Loading from '../components/Loading';

class TransactionsPage extends React.Component {
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
    this.state = { Collective: get(props, 'data.Collective') };
  }

  async componentDidMount() {
    const { getLoggedInUser, data } = this.props;
    const LoggedInUser = await getLoggedInUser();
    const Collective = (data && data.Collective) || this.state.collective;
    this.setState({ LoggedInUser, Collective });
  }

  componentDidUpdate(oldProps) {
    // We store the component in state and update only if the next one is not
    // null because of a bug in Apollo where it strips the `Collective` from data
    // during re-hydratation.
    // See https://github.com/opencollective/opencollective/issues/1872
    const currentCollective = get(this.props, 'data.Collective');
    if (currentCollective && get(oldProps, 'data.Collective') !== currentCollective) {
      this.setState({ Collective: currentCollective });
    }
  }

  render() {
    const { LoggedInUser } = this.state;
    const collective = get(this.props, 'data.Collective') || this.state.Collective;

    if (!collective && this.props.data.loading) {
      return (
        <Page title="Transactions">
          <Loading />
        </Page>
      );
    } else if (!collective) {
      return <ErrorPage data={this.props.data} />;
    }

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
            key={collective.slug}
          />

          <div className="content">
            <TransactionsWithData
              collective={collective}
              LoggedInUser={this.state.LoggedInUser}
              showCSVlink={true}
              filters={true}
              dateDisplayType="date"
            />
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withData(withIntl(withLoggedInUser(addCollectiveCoverData(TransactionsPage))));
