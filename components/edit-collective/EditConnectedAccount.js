import React from 'react';
import PropTypes from 'prop-types';
import { withApollo } from '@apollo/client/react/hoc';
import * as Sentry from '@sentry/browser';
import { capitalize, pick } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { connectAccount, connectAccountCallback, disconnectAccount } from '../../lib/api';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';
import { getWebsiteUrl, isValidUrl, parseToBoolean } from '../../lib/utils';

import DateTime from '../DateTime';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledSpinner from '../StyledSpinner';
import { P } from '../Text';
import { toast } from '../ui/useToast';

import EditPayPalAccount from './EditPayPalAccount';
import EditTransferWiseAccount from './EditTransferWiseAccount';
import EditTwitterAccount from './EditTwitterAccount';

class EditConnectedAccount extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    connectedAccounts: PropTypes.arrayOf(PropTypes.object),
    options: PropTypes.object,
    intl: PropTypes.object.isRequired,
    service: PropTypes.string,
    connectedAccount: PropTypes.object,
    variation: PropTypes.bool,
    router: PropTypes.object,
    client: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { isConnecting: false, isDisconnecting: false };

    // To disable a service, add a message with a key like `collective.connectedAccounts.${service}.disableReason`.
    this.messages = defineMessages({
      // Stripe
      'collective.connectedAccounts.stripe.description': {
        id: 'collective.create.connectedAccounts.stripe.description',
        defaultMessage: 'Connect a Stripe account to start accepting financial contributions.',
      },
      // Twitter
      'collective.connectedAccounts.twitter.description': {
        id: 'collective.connectedAccounts.twitter.description',
        defaultMessage: 'Connect a Twitter account to automatically thank new financial contributors',
      },
      // Github
      'collective.connectedAccounts.github.description': {
        id: 'collective.connectedAccounts.github.description',
        defaultMessage: 'Connect a GitHub account to verify your identity and add it to your profile',
      },
    });
  }

  componentDidMount() {
    if (this.isConnectCallback()) {
      this.handleConnectCallback();
    }
  }

  isConnectCallback() {
    return parseToBoolean(this.props.router.query.callback);
  }

  async handleConnectCallback() {
    const urlParams = this.props.router.query || {};
    const { intl, collective, router } = this.props;
    const { service } = urlParams;

    try {
      // API call
      const success = await connectAccountCallback(collective.id, service, pick(urlParams, ['code', 'state']));
      if (!success) {
        throw new Error('Failed to connect account');
      }

      // Success!
      toast({
        variant: 'success',
        message: intl.formatMessage(
          { defaultMessage: 'Successfully connected {service} account', id: 'p63wXt' },
          { service },
        ),
      });

      // Refetch connected accounts
      await this.refetchConnectedAccounts();
    } catch (e) {
      Sentry.captureException(e);

      // Not showing the exact error message to users as raw fetch messages are not user friendly
      toast({
        variant: 'error',
        message: intl.formatMessage(
          { defaultMessage: 'Error while connecting {service} account', id: 'FWMal2' },
          { service },
        ),
      });
    } finally {
      // Update URL to remove callback params
      const pathname = router.asPath.split('?')[0];
      router.replace({ pathname, query: {} }, undefined, { shallow: true });
    }
  }

  connect = async service => {
    const { collective, options } = this.props;
    this.setState({ isConnecting: true });

    // Redirect to OAuth flow
    if (service === 'github' || service === 'twitter') {
      const redirectUrl = `${getWebsiteUrl()}/api/connected-accounts/${service}/oauthUrl`;
      const redirectUrlParams = new URLSearchParams({ CollectiveId: collective.id });
      const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        redirectUrlParams.set('access_token', accessToken);
      }

      window.location.href = `${redirectUrl}?${redirectUrlParams.toString()}`;
      return;
    }

    try {
      const json = await connectAccount(collective.id, service, options);
      if (!json?.redirectUrl || !isValidUrl(json.redirectUrl)) {
        throw new Error('Invalid redirect URL');
      }

      window.location.href = json.redirectUrl;
    } catch (e) {
      this.setState({ isConnecting: false });
      Sentry.captureException(e);
      toast({
        variant: 'error',
        title: this.props.intl.formatMessage(
          { defaultMessage: 'Error while connecting {service} account' },
          { service },
        ),
        message: e.message,
      });
    }
  };

  disconnect = async service => {
    const { collective } = this.props;
    this.setState({ isDisconnecting: true });

    try {
      const json = await disconnectAccount(collective.id, service);
      if (json.deleted === true) {
        this.refetchConnectedAccounts();
      }
    } catch (e) {
      Sentry.captureException(e);
      toast({
        variant: 'error',
        message: this.props.intl.formatMessage(
          { defaultMessage: 'Error while disconnecting {service} account' },
          { service },
        ),
      });
    } finally {
      this.setState({ isDisconnecting: false });
    }
  };

  /**
   * Forces a refetch of connected accounts to prevent caching issues.
   * This unfortunately refetches the entire settings query, see https://github.com/opencollective/opencollective/issues/1451
   */
  refetchConnectedAccounts = () => {
    return this.props.client.refetchQueries({ include: ['EditCollectivePage'] });
  };

  render() {
    const { intl, service, collective, variation, connectedAccount, router } = this.props;
    const { isConnecting, isDisconnecting } = this.state;

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

    const disableReason = this.messages[`collective.connectedAccounts.${service}.disableReason`];
    return (
      <Box width="100%">
        {this.isConnectCallback() ? (
          <Flex flexDirection="column" alignItems="center" my={4}>
            <StyledSpinner size={32} />
            <P mt={2} fontSize="12px" color="black.600" fontWeight="normal">
              <FormattedMessage defaultMessage="Connecting..." id="5y2qWO" />
            </P>
          </Flex>
        ) : (
          <div>
            {disableReason && !parseToBoolean(router?.query?.overrideDisabled) && (
              <MessageBox type="warning" withIcon mb={3}>
                {intl.formatMessage(disableReason)}
              </MessageBox>
            )}
            {connectedAccount ? (
              <Flex flexDirection="column" width="100%">
                {Boolean(connectedAccount.settings?.needsReconnect) && (
                  <MessageBox type="warning" withIcon mb={3}>
                    <FormattedMessage
                      defaultMessage="This account is currently inactive. Please reconnect it to continue using it."
                      id="8n8mAu"
                    />
                  </MessageBox>
                )}
                <P mb={2}>
                  <FormattedMessage
                    defaultMessage="{service} account {username} connected on {date}"
                    id="ur9IXI"
                    values={{
                      service: capitalize(connectedAccount.service),
                      username: !connectedAccount.username ? '' : <strong>@{connectedAccount.username}</strong>,
                      date: (
                        <i>
                          <DateTime value={connectedAccount.updatedAt} />
                        </i>
                      ),
                    }}
                  />
                </P>
                <Flex mt={1} gridGap="8px" flexWrap="wrap">
                  <StyledButton
                    buttonSize="small"
                    onClick={() => this.connect(service)}
                    loading={isConnecting}
                    disabled={disableReason}
                  >
                    <FormattedMessage id="collective.connectedAccounts.reconnect.button" defaultMessage="Reconnect" />
                  </StyledButton>
                  <StyledButton buttonSize="small" onClick={() => this.disconnect(service)} loading={isDisconnecting}>
                    <FormattedMessage id="collective.connectedAccounts.disconnect.button" defaultMessage="Disconnect" />
                  </StyledButton>
                </Flex>
                {!disableReason && connectedAccount.service === 'twitter' && (
                  <Box my={3}>
                    <EditTwitterAccount collective={collective} connectedAccount={connectedAccount} />
                  </Box>
                )}
              </Flex>
            ) : (
              <Box>
                <P fontSize="12px" color="black.600" fontWeight="normal" mb={2}>
                  {intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.description`])}
                </P>
                <StyledButton
                  data-cy={`connect-${service}-button`}
                  buttonSize="small"
                  onClick={() => this.connect(service)}
                  loading={isConnecting}
                  minWidth={120}
                  mb={2}
                >
                  {intl.formatMessage(
                    { defaultMessage: 'Connect {service}', id: 'C9HmCs' },
                    { service: capitalize(service) },
                  )}
                </StyledButton>
              </Box>
            )}
          </div>
        )}
      </Box>
    );
  }
}

export default injectIntl(withRouter(withApollo(EditConnectedAccount)));
