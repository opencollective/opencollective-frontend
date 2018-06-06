import React, { Fragment } from 'react';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import { transactionFields } from '../graphql/queries';

import Body from '../components/Body';
import Button from '../components/Button';
import Footer from '../components/Footer';
import Header from '../components/Header';
import TransactionSimple from '../components/TransactionSimple';
import { Link } from '../server/pages';

class HomePage extends React.Component {
  state = {
    LoggedInUser: {},
  }

  async componentDidMount() {
    const LoggedInUser = this.props.getLoggedInUser && await this.props.getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const {
      transactions: {
        transactions,
      },
      loading,
    } = this.props.data;
    const {
      LoggedInUser,
    } = this.state;

    if (loading) {
      return <p>loading...</p>;
    }

    return (
      <Fragment>
        <style jsx>{`
          .ai-center { align-items: center; }
          .f-subheadline { font-size: 5rem; }
          .flex { display: flex; }
          .pa3 { padding: 1rem; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .w-50 { width: 50%; }
          .list { list-style: none; }
          .item {
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.2);
            margin-bottom: 0.3625rem;
          }
        `}</style>
        <Header
          title="Home"
          LoggedInUser={LoggedInUser}
        />
        <Body>
          <div className="flex pa3">
            <div className="w-50">
              <h1 className="f-subheadline text-left">A new form of association, <br /> <strong>transparent by design.</strong></h1>

              <p>
                It's time to break the mold. 21st century citizens need organizations where all members share the mission;
                 where anybody can contribute; where leaders can change; and where money works in full transparency.
                Open Collective provides the digitals tools you need to take your group a step closer in that direction.
              </p>

              <p className="f4 bold">The movement has begun. Are you ready?</p>

              <div className="flex ai-center">
                <Button>Join the movement</Button>
                <Link href="/learn-more">How it works ></Link>
              </div>
            </div>

            <div className="w-50">
              <p className="text-center">Latest Transactions</p>
              <ul className="list" style={{ maxHeight: '50rem', overflow: 'scroll' }}>
                {transactions.map((transaction) => <li key={transaction.id} className="pa3 item"><TransactionSimple {...transaction} /></li>)}
              </ul>
            </div>
          </div>

        </Body>
        <Footer />
      </Fragment>
    );
  }
}

const query = gql`
  query home {
    transactions {
      transactions {
        amount
        createdAt
        currency
        id
        type
        fromCollective {
          id
          image
          name
          slug
        }
        host {
          name
          slug
        }
        ... on Order {
          subscription {
            interval
          }
        }
      }
    }
  }
`;

const addHomeData = graphql(query)

export { HomePage as MockHomePage };
export default withData(withLoggedInUser(addHomeData(withIntl(HomePage))));
