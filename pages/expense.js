import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ExpenseWithData from '../components/expenses/ExpenseWithData';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';
import Link from '../components/Link';

import { addCollectiveCoverData } from '../lib/graphql/queries';

import { withUser } from '../components/UserProvider';

class ExpensePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, ExpenseId } }) {
    return { slug: collectiveSlug, ExpenseId: parseInt(ExpenseId) };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    ExpenseId: PropTypes.number,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      isPayActionLocked: false,
    };
  }

  render() {
    const { data, ExpenseId, LoggedInUser } = this.props;

    if (!data.Collective) return <ErrorPage data={data} />;

    const collective = data.Collective;

    return (
      <div className="ExpensePage">
        <style jsx>
          {`
            .columns {
              display: flex;
            }

            .col.large {
              width: 100%;
              min-width: 30rem;
              max-width: 800px;
            }

            @media (max-width: 600px) {
              .columns {
                flex-direction: column-reverse;
              }
              .columns .col {
                max-width: 100%;
              }
            }

            .viewAllExpenses {
              font-size: 1.2rem;
            }
          `}
        </style>

        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveCover
            key={collective.slug}
            collective={collective}
            LoggedInUser={LoggedInUser}
            displayContributeLink={collective.isActive && collective.host ? true : false}
          />

          <div className="content">
            <div className=" columns">
              <div className="col large">
                <div className="viewAllExpenses">
                  <Link route={`/${collective.slug}/expenses`}>
                    <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />
                  </Link>
                </div>

                <ExpenseWithData
                  id={ExpenseId}
                  collective={collective}
                  view="details"
                  LoggedInUser={LoggedInUser}
                  allowPayAction={!this.state.isPayActionLocked}
                  lockPayAction={() => this.setState({ isPayActionLocked: true })}
                  unlockPayAction={() => this.setState({ isPayActionLocked: false })}
                />
              </div>
            </div>
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withUser(addCollectiveCoverData(ExpensePage));
