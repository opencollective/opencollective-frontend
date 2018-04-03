import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { addCollectiveCoverData, addGetLoggedInUserFunction } from '../graphql/queries';
import Loading from '../components/Loading';
import NotFound from '../components/NotFoundPage';
import ErrorPage from '../components/ErrorPage';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import ExpenseWithData from '../components/ExpenseWithData';
import CommentsWithData from '../components/CommentsWithData';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl'
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';

class ExpensePage extends React.Component {

  static getInitialProps (props) {
    const { query: { collectiveSlug, ExpenseId }, data } = props;
    console.log(">>> getInitialProps", props);
    return { slug: collectiveSlug, data, ExpenseId }
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    this.setState({ LoggedInUser });
  }

  render() {
    const { data, ExpenseId } = this.props;
    const { LoggedInUser } = this.state;
    console.log(">>> render props", this.props);
    if (data.loading) return (<Loading />);
    if (!data.Collective) return (<NotFound />);
    
    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }

    const collective = data.Collective;

    const action = {
      label: <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />,
      href: `/${collective.slug}/expenses`
    }

    const subtitle = <FormattedMessage id="expense.subtitle" defaultMessage="Expense" values={{ }} />

    return (
      <div className="ExpensePage">
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
              .col {
                max-width: 100%;
              }
            }
          }
        `}</style>

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

            <div className=" columns" >

              <div className="col large">
                <ExpenseWithData
                  id={ExpenseId}
                  collective={collective}
                  LoggedInUser={this.state.LoggedInUser}
                  />

                <CommentsWithData
                  ExpenseId={ExpenseId}
                  collective={collective}
                  LoggedInUser={this.state.LoggedInUser}
                  />
              </div>

              <div className="col side">
              </div>

            </div>
          </div>

        </Body>

        <Footer />

      </div>
    );
  }

}

export default withData(addGetLoggedInUserFunction(addCollectiveCoverData(withIntl(ExpensePage))));