import React from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';

import { Box } from '../components/Grid';
import Link from '../components/Link';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

class RecurringContributionsRedirectPage extends React.Component {
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
        Router.push('/signin', '/signin?next=/recurring-contributions');
      } else {
        setTimeout(() => Router.push(`/${LoggedInUser.collective.slug}/recurring-contributions`), 100);
      }
    }
  }

  render() {
    const { LoggedInUser } = this.props;
    return (
      <Page title="Subscriptions" description="All the collectives that you are giving money to">
        <Box py={[5, 6, 7]} textAlign="center">
          <strong>Redirecting...</strong>
          {LoggedInUser && (
            <div>
              This page has moved. Your recurring financial contributions are now at
              <Link route="recurring-contributions" params={{ slug: LoggedInUser.collective.slug }}>
                <span>
                  {' '}
                  /{LoggedInUser.collective.slug}
                  /recurring-contributions
                </span>
              </Link>
            </div>
          )}
        </Box>
      </Page>
    );
  }
}

export default withUser(RecurringContributionsRedirectPage);
