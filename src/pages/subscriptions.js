import React from 'react'

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import SubscriptionsWithData from '../components/SubscriptionsWithData';
import withIntl from '../lib/withIntl';
import withData from '../lib/withData'
import colors from '../constants/colors';
import { addGetLoggedInUserFunction } from '../graphql/queries';

class SubscriptionsPage extends React.Component {

  static getInitialProps({ query: { collectiveSlug }}) {
    return { slug: collectiveSlug }
  }

  constructor(props) {
    super(props);
    this.state = {}
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const { slug } = this.props;
    return (
      <div className="SubscriptionsPage">
        <Header
          title={`Subscriptions`}
          description="All the collectives that you are giving money to"
          LoggedInUser={this.state.LoggedInUser}
        />
        <style jsx>{`
        .Subscriptions-container {
          background-color: ${colors.offwhite};
          overflow: hidden;
          min-height: 500px;
        }
        .content {
          align-items: left;
          color: black;
          margin: auto;
          margin-top: 100px;
          margin-left: 32px;
          max-width: 1024px;
        }
        .small .content {
          margin-top: 0px;
        }
        .Subscriptions-header {
          text-align: left;
          overflow: hidden;
          max-width: 1024px;
        }
        .Subscriptions-title {
          margin: auto;
          font-family: Rubik;
          font-size: 40px;
          font-weight: 700;
          line-height: 1.08;
          text-align: left;
          color: ${colors.black};
          letter-spacing: -0.5px;
          border-left: 4px solid ${colors.ocblue};
          padding-left: 32px;
        }
        `}
        </style>
        <Body>
          <div className='Subscriptions-container'>
            <div className='content'>
              <div className='Subscriptions-header'>
                <div className='Subscriptions-title'>
                    {slug}'s subscriptions
                </div>
              </div>

              <div className='Subscriptions-listing'>
                <SubscriptionsWithData
                  slug={this.props.slug}
                  LoggedInUser={this.state.LoggedInUser}
                  />
              </div>
            </div>
          </div>

        </Body>
        <Footer />

      </div>
    )
  }
}

export default withData(addGetLoggedInUserFunction(withIntl(SubscriptionsPage)));
