import React, { Fragment } from 'react';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

import withData from '../lib/withData'
import withIntl from '../lib/withIntl';

import Body from '../components/Body';
import Button from '../components/Button';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { Link } from '../server/pages';

class HomePage extends React.Component {
  render() {
    return (
      <Fragment>
        <style jsx>{`
          .ai-center { align-items: center; }
          .f-subheadline { font-size: 5rem; }
          .flex { display: flex; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .w-50 { width: 50%; }
        `}</style>
        <Header
          title="Home"
        />
        <Body>
          <div className="flex">
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
    allTransactions {
      transactions {
        amount
        currency
        type
      }
    }
  }
`;

const addHomeData = graphql(query)

export { HomePage as MockHomePage };
export default withData(addHomeData(HomePage));
