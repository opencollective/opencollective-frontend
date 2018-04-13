import React from 'react'

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import CollectivesForRedeemPageWithData from '../components/CollectivesForRedeemPageWithData';
import OrderForm from '../components/OrderForm';
import withIntl from '../lib/withIntl';
import withData from '../lib/withData'
import { isValidUrl } from '../lib/utils';
import colors from '../constants/colors';
import { addGetLoggedInUserFunction } from '../graphql/queries';


class RedeemPage extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      LoggedInUser: null
    }

  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    return (
      <div className="RedeemPage">
        <Header
          title="Redeem gift card"
          description="Use your gift card to support open source projects that you are contributing to."
          LoggedInUser={this.state.LoggedInUser}
        />
        <style jsx global>{`
          .Redeem-hero .ctabtn a {
            color: white !important;
          }
        `}</style>
        <style jsx>{`
        .Redeem-container {
          background-color: ${colors.offwhite};
        }
        .Redeem-hero {
          display: flex;
          align-items: center;
          position: relative;
          text-align: center;
          min-height: 500px;
          width: 100%;
          overflow: hidden;
        }
        .small .Redeem-hero {
          height: 22rem;
          min-height: 22rem;
        }
        .backgroundCover {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('/static/images/redeem-cover-background.svg');
        }
        .content {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
          color: black;
          margin-top: 70px;
        }
        .small .content {
          margin-top: 0px;
        }
        .Redeem-hero-line1 {
          margin: auto;
          font-family: Rubik;
          font-size: 40px;
          font-weight: 700;
          line-height: 1.08;
          text-align: center;
          color: ${colors.white};
          letter-spacing: -0.5px;
          padding-bottom: 20px;
        }
        .Redeem-hero-line2 {
          margin: auto;
          margin-top: 40px;      
          height: 78px;
          font-family: Rubik;
          font-size: 16px;
          line-height: 1.63;
          text-align: center;
          color: ${colors.white};
          text-align: center;
        }
        .Redeem-hero-line3 {
          margin: auto;
          margin-top: 40px;
          font-family: Rubik;
          font-size: 18px;
          font-weight: 500;
          line-height: 1.44;
          text-align: center;
          color: ${colors.white};
        }
        .Redeem-hero :global(.ctabtn) {
          width: auto;
          min-width: 20rem;
          padding: 0 2rem;
          margin: 2rem 0 0 0;
          font-family: Lato;
          text-transform: uppercase;
          background-color: #75cc1f;
          font-size: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white !important;
          border-radius: 2.8rem;
        }
        .Redeem-listing {
          margin: auto;
          margin-top: -80px;
          max-width: 1024px;
        }
        .cardsList {
          display: flex;
          flex-wrap: wrap;
          flex-direction: row;
          justify-content: center;
        }
        @media(max-width: 600px) {
          h1 {
            font-size: 2.5rem;
          }
        }
        `}
        </style>
        <Body>
          <div className='Redeem-container'>

            <div className='Redeem-hero'>
              <div className='backgroundCover' />
              <div className='content'>
                <div className='Redeem-hero-line1'>
                  Redeem Gift Card
                </div>
                <div className='Redeem-hero-line2'>
                  Open Collective helps communities - like open source projects, meetups, etc - raise money and operate transparently.

                  It's easy. Enter your gift code at the bottom of a project and we'll credit them with your gift card amount.
                </div>
                <div className='Redeem-hero-line3'>
                  Check out some of our popular collectives below!
                </div>
              </div>
            </div>

            <div className='Redeem-listing'>
              <div className="cardsList">
                <CollectivesForRedeemPageWithData
                  HostCollectiveId={11004} // hard-coded to only show open source projects
                  orderBy="balance"
                  orderDirection="DESC"
                  limit={12}
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

export default withData(addGetLoggedInUserFunction(withIntl(RedeemPage)));
