import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { H3, H4, P } from '../../Text';

import { parseToBoolean } from '../../../lib/utils';
import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import ConnectedAccounts from './ConnectedAccounts';

class SendingMoney extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  render() {
    const services = [];
    if (hasFeature(this.props.collective, FEATURES.TRANSFERWISE) || parseToBoolean(process.env.TRANSFERWISE_ENABLED)) {
      services.push('transferwise');
    }
    return (
      <Fragment>
        <H3>
          <FormattedMessage id="editCollective.sendingMoney" defaultMessage={'Sending Money'} />
        </H3>
        <ConnectedAccounts
          collective={this.props.collective}
          connectedAccounts={this.props.collective.connectedAccounts}
          services={services}
        />
        <H4 mt={2}>
          <FormattedMessage id="PayoutMethod.Type.Paypal" defaultMessage={'PayPal'} />
        </H4>
        <P>
          <FormattedMessage
            id="collective.sendMoney.description"
            defaultMessage={"PayPal is activated by default, you don't have to configure anything."}
          />
        </P>
      </Fragment>
    );
  }
}

export default injectIntl(SendingMoney);
