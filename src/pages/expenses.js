import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ExpensesWithData from '../apps/expenses/components/ExpensesWithData';
import ExpensesStatsWithData from '../apps/expenses/components/ExpensesStatsWithData';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';
import SectionTitle from '../components/SectionTitle';

import { addCollectiveCoverData } from '../graphql/queries';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

class ExpensesPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug, filter, value } }) {
    return { slug: collectiveSlug, filter, value };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    filter: PropTypes.string,
    value: PropTypes.string,
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

    if (!data.Collective) return (<ErrorPage data={data} />);

    const collective = data.Collective;

    let action, subtitle, filter;
    if (this.props.value) {
      action = {
        label: <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />,
        href: `/${collective.slug}/expenses`,
      };

      if (this.props.filter === 'categories') {
        const category = decodeURIComponent(this.props.value);
        filter = { category };
        subtitle = <FormattedMessage id="expenses.byCategory" defaultMessage="Expenses in {category}" values={{ category }} />;
      }
      if (this.props.filter === 'recipients') {
        const recipient = decodeURIComponent(this.props.value);
        filter = { recipient };
        subtitle = <FormattedMessage id="expenses.byRecipient" defaultMessage="Expenses by {recipient}" values={{ recipient }} />;
      }
    }

    return (
      <div className="ExpensesPage">
        <style jsx>{`
          .columns {
            display: flex;
          }

          .col.side {
            width: 100%;
            min-width: 20rem;
            max-width: 25%;
            margin-left: 5rem;
          }

          .col.large {
            width: 100%;
            min-width: 30rem;
            max-width: 75%;
          }

          @media(max-width: 600px) {
            .columns {
              flex-direction: column-reverse;
            }
            .columns .col {
              max-width: 100%;
            }
          }
        `}
        </style>

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
            cta={{ href: `/${collective.slug}#contribute`, label: 'contribute' }}
            LoggedInUser={LoggedInUser}
            />

          <div className="content" >

            <SectionTitle section="expenses" subtitle={subtitle} action={action} />

            <div className=" columns" >

              <div className="col large">
                <ExpensesWithData
                  collective={collective}
                  LoggedInUser={this.state.LoggedInUser}
                  filter={filter}
                  />
              </div>

              <div className="col side">
                <ExpensesStatsWithData slug={collective.slug} />
              </div>

            </div>
          </div>

        </Body>

        <Footer />

      </div>
    );
  }

}

export default withData(withIntl(withLoggedInUser(addCollectiveCoverData(ExpensesPage))));
