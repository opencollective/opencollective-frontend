import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import { connectAccount, disconnectAccount } from '../../lib/api';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';
import { getWebsiteUrl } from '../../lib/utils';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import { P } from '../Text';

import EditPayPalAccount from './EditPayPalAccount';
import EditTransferWiseAccount from './EditTransferWiseAccount';
import EditTwitterAccount from './EditTwitterAccount';

class EditConnectedAccount extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    connectedAccounts: PropTypes.arrayOf(PropTypes.object),
    options: PropTypes.object,
    editMode: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    service: PropTypes.string,
    connectedAccount: PropTypes.object,
    variation: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.state = {
      editMode: props.editMode || false,
      connectedAccount: props.connectedAccount,
    };
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);

    this.messages = defineMessages({
      'collective.connectedAccounts.reconnect.button': {
        id: 'collective.connectedAccounts.reconnect.button',
        defaultMessage: 'Reconnect',
      },
      'collective.connectedAccounts.disconnect.button': {
        id: 'collective.connectedAccounts.disconnect.button',
        defaultMessage: 'Disconnect',
      },
      'collective.connectedAccounts.stripe.button': {
        id: 'collective.connectedAccounts.stripe.button',
        defaultMessage: 'Connect Stripe',
      },
      'collective.connectedAccounts.stripe.description': {
        id: 'collective.create.connectedAccounts.stripe.description',
        defaultMessage: 'Connect a Stripe account to start accepting financial contributions.',
      },
      'collective.connectedAccounts.stripe.connected': {
        id: 'collective.connectedAccounts.stripe.connected',
        defaultMessage: 'Stripe account connected on {updatedAt, date, short}',
      },
      'collective.connectedAccounts.twitter.button': {
        id: 'collective.connectedAccounts.twitter.button',
        defaultMessage: 'Connect Twitter',
      },
      'collective.connectedAccounts.twitter.description': {
        id: 'collective.connectedAccounts.twitter.description',
        defaultMessage: 'Connect a Twitter account to automatically thank new financial contributors',
      },
      'collective.connectedAccounts.twitter.connected': {
        id: 'collective.connectedAccounts.twitter.connected',
        defaultMessage: 'Twitter account @{username} connected on {updatedAt, date, short}',
      },
      'collective.connectedAccounts.github.button': {
        id: 'collective.connectedAccounts.github.button',
        defaultMessage: 'Connect GitHub',
      },
      'collective.connectedAccounts.github.description': {
        id: 'collective.connectedAccounts.github.description',
        defaultMessage: 'Connect a GitHub account to verify your identity and add it to your profile',
      },
      'collective.connectedAccounts.github.connected': {
        id: 'collective.connectedAccounts.github.connected',
        defaultMessage: 'GitHub account {username} connected on {updatedAt, date, short}',
      },
    });
    this.services = ['stripe', 'paypal', 'twitter', 'github', 'transferwise'];
  }

  connect(service) {
    const { collective, options } = this.props;

    if (service === 'github' || service === 'twitter') {
      const redirectUrl = `${getWebsiteUrl()}/api/connected-accounts/${service}/oauthUrl`;
      const redirectUrlParams = new URLSearchParams({ CollectiveId: collective.id });

      const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        redirectUrlParams.set('access_token', accessToken); // eslint-disable-line camelcase
      }

      window.location.href = `${redirectUrl}?${redirectUrlParams.toString()}`;

      return;
    }

    connectAccount(collective.id, service, options)
      .then(json => {
        return (window.location.href = json.redirectUrl);
      })
      .catch(err => {
        console.error(`>>> /api/connected-accounts/${service} error`, err);
      });
  }

  disconnect(service) {
    const { collective } = this.props;

    disconnectAccount(collective.id, service)
      .then(json => {
        if (json.deleted === true) {
          this.setState({
            connectedAccount: null,
          });
        }
      })
      .catch(err => {
        console.error(`>>> /api/connected-accounts/${service}/disconnect error`, err);
      });
  }

  render() {
    const { intl, service, collective, variation } = this.props;
    const { connectedAccount } = this.state;

    let vars = {};
    if (connectedAccount) {
      vars = {
        username: connectedAccount.username,
        updatedAt: new Date(connectedAccount.updatedAt),
      };
    }

    if (service === 'transferwise') {
      // Notice we're passing props.connectedAccount to EditTransferWiseAccount
      // This happens because the component will take care of refetching data from
      // the DB to make sure it is displaying accurate information.
      return (
        <EditTransferWiseAccount collective={collective} connectedAccount={this.props.connectedAccount} intl={intl} />
      );
    } else if (service === 'paypal') {
      return (
        <EditPayPalAccount
          collective={collective}
          connectedAccount={this.props.connectedAccount}
          variation={variation}
          intl={intl}
        />
      );
    }

    return (
      <Flex className="EditConnectedAccount">
        {!connectedAccount && (
          <Box>
            <P fontSize="12px" color="black.600" fontWeight="normal" mb={2}>
              {intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.description`])}
            </P>
            <StyledButton
              data-cy={`connect-${service}-button`}
              buttonSize="small"
              onClick={() => this.connect(service)}
              mb={2}
            >
              {intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.button`])}
            </StyledButton>
          </Box>
        )}
        {connectedAccount && (
          <Flex flexDirection="column">
            <Box>{intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.connected`], vars)}</Box>
            {connectedAccount.service === 'twitter' && (
              <Box my={2}>
                <EditTwitterAccount collective={collective} connectedAccount={connectedAccount} />
              </Box>
            )}
            <Box mt={1}>
              <StyledButton buttonSize="small" onClick={() => this.connect(service)}>
                {intl.formatMessage(this.messages['collective.connectedAccounts.reconnect.button'])}
              </StyledButton>{' '}
              <StyledButton buttonSize="small" onClick={() => this.disconnect(service)}>
                {intl.formatMessage(this.messages['collective.connectedAccounts.disconnect.button'])}
              </StyledButton>
            </Box>
          </Flex>
        )}
      </Flex>
    );
  }
}

export default injectIntl(EditConnectedAccount);
