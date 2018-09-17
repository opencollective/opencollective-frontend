import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import withIntl from '../lib/withIntl';
import Button from './Button';
import ApplyToHostBtnLoggedIn from './ApplyToHostBtnLoggedIn';
import { get } from 'lodash';
import HelpTooltip from './HelpTooltip';

class ApplyToHostBtn extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    host: PropTypes.object.isRequired,
  };

  render() {
    const { LoggedInUser, host } = this.props;

    return (
      <div className="ApplyToHostBtn">
        <style jsx>
          {`
            .hostConditions {
              margin: 5px;
              font-size: 11pt;
            }
          `}
        </style>
        {!LoggedInUser && (
          <Button className="blue" href={`/${host.slug}/apply`}>
            <FormattedMessage
              id="host.apply.create.btn"
              defaultMessage="Apply to create a collective"
            />
          </Button>
        )}
        {LoggedInUser && (
          <ApplyToHostBtnLoggedIn LoggedInUser={LoggedInUser} host={host} />
        )}
        <div className="hostConditions">
          <FormattedMessage
            id="transaction.hostFeeInHostCurrency"
            defaultMessage="{hostFeePercent} host fee"
            values={{ hostFeePercent: `${host.hostFeePercent || 0}%` }}
          />
          <HelpTooltip className="dark">
            <FormattedMessage
              id="host.hostFee.help"
              defaultMessage="The host fee is the fee that the host charges your collective to take care of paying out the expenses that have been approved and to take care of recording all transactions in their books to comply with local fiscal authorities."
            />
          </HelpTooltip>
          {get(host, 'settings.tos') && (
            <span>
              &nbsp; - &nbsp;
              <a href={get(host, 'settings.tos')}>
                <FormattedMessage
                  id="host.tos"
                  defaultMessage="Terms of Service"
                />
              </a>
            </span>
          )}
        </div>
      </div>
    );
  }
}

export default withIntl(ApplyToHostBtn);
