import React from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';

import colors from '../lib/constants/colors';

import Body from '../components/Body';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Link from '../components/Link';
import { withUser } from '../components/UserProvider';

class SubscriptionsRedirectPage extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  async componentDidMount() {
    this.checkLoggedInUser();
  }

  async componentDidUpdate() {
    this.checkLoggedInUser();
  }

  checkLoggedInUser() {
    const { LoggedInUser, loadingLoggedInUser } = this.props;

    if (!loadingLoggedInUser) {
      if (!LoggedInUser) {
        Router.push('/signin', '/signin?next=/subscriptions');
      } else {
        setTimeout(
          () =>
            Router.push(
              `/subscriptions?collectiveSlug=${LoggedInUser.collective.slug}`,
              `/${LoggedInUser.collective.slug}/subscriptions`,
            ),
          4000,
        );
      }
    }
  }

  render() {
    const { LoggedInUser } = this.props;
    return (
      <div className="SubscriptionsPage">
        <Header
          title={'Subscriptions'}
          description="All the collectives that you are giving money to"
          LoggedInUser={LoggedInUser}
        />
        <style jsx>
          {`
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
              font-size: 40px;
              font-weight: 700;
              line-height: 1.08;
              text-align: left;
              color: ${colors.black};
              border-left: 4px solid ${colors.ocblue};
              padding-left: 32px;
            }
            .link {
              cursor: pointer;
              color: ${colors.blue};
            }
            .redirect-message {
              padding-top: 25px;
              font-size: 24px;
              font-weight: 500;
              padding: 37px;
            }
          `}
        </style>
        <Body>
          <div className="SubscriptionsRedirect-container">
            <div className="content">
              <div className="Subscriptions-header">
                <div className="Subscriptions-title">
                  {LoggedInUser && (
                    <div>
                      This page has moved. Your recurring financial contributions are now at
                      <Link
                        route={'subscriptions'}
                        params={{
                          collectiveSlug: LoggedInUser.collective.slug,
                        }}
                      >
                        <span className="link">
                          {' '}
                          /{LoggedInUser.collective.slug}
                          /subscriptions
                        </span>
                      </Link>
                      . Redirecting...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withUser(SubscriptionsRedirectPage);
