import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo'
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'

import withIntl from '../lib/withIntl';
import Button from './Button';
import ApplyToHostBtnLoggedIn from './ApplyToHostBtnLoggedIn';

class ApplyToHostBtn extends React.Component {

  static propTypes = {
    LoggedInUser: PropTypes.object,
    host: PropTypes.object.isRequired,
  };

  render() {
    const { LoggedInUser, host } = this.props;

    return (
      <div className="ApplyToHostBtn">
        { !LoggedInUser &&
          <Button className="blue" href={`/${host.slug}/apply`}><FormattedMessage id="host.apply.create.btn" defaultMessage="Apply to create a collective" /></Button>
        }
        { LoggedInUser &&
          <ApplyToHostBtnLoggedIn LoggedInUser={LoggedInUser} host={host} />
        }
      </div>
    );
  }
}

export default withIntl(ApplyToHostBtn);