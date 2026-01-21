import React from 'react';
import PropTypes from 'prop-types';
import { withApollo } from '@apollo/client/react/hoc';
import * as Sentry from '@sentry/browser';
import { capitalize, pick } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { connectAccount, connectAccountCallback, disconnectAccount } from '../../lib/api';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';
import { isValidUrl, parseToBoolean } from '../../lib/utils';

import { ConnectedAccountsTable } from '../ConnectedAccountsTable';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import Spinner from '../Spinner';
import { P } from '../Text';
import { Button } from '../ui/Button';
import { toast } from '../ui/useToast';

class EditConnectedAccount extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    options: PropTypes.object,
    intl: PropTypes.object.isRequired,
    service: PropTypes.string,
    connectedAccount: PropTypes.object,
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
    if (service === 'github') {
      const redirectUrl = `${process.env.API_URL}/connected-accounts/${service}/oauthUrl`;
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
          { defaultMessage: 'Error while connecting {service} account', id: 'FWMal2' },
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
          { defaultMessage: 'Error while disconnecting {service} account', id: 'zaq5cs' },
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
    const { intl, service, connectedAccount, router } = this.props;
    const { isConnecting } = this.state;

    if (service === 'transferwise' || service === 'paypal') {
      return null;
    }

    const disableReason = this.messages[`collective.connectedAccounts.${service}.disableReason`];
    return (
      <Box width="100%">
        {this.isConnectCallback() ? (
          <Flex flexDirection="column" alignItems="center" my={4}>
            <Spinner size={32} />
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
              <ConnectedAccountsTable
                connectedAccounts={[connectedAccount]}
                disconnect={() => this.disconnect(service)}
                reconnect={() => this.connect(service)}
              />
            ) : (
              <Box>
                <p className="mb-3 text-sm text-gray-700">
                  {intl.formatMessage(this.messages[`collective.connectedAccounts.${service}.description`])}
                </p>
                <Button
                  data-cy={`connect-${service}-button`}
                  size="sm"
                  onClick={() => this.connect(service)}
                  loading={isConnecting}
                  className="max-w-xs"
                >
                  {intl.formatMessage(
                    { defaultMessage: 'Connect {service}', id: 'C9HmCs' },
                    { service: capitalize(service) },
                  )}
                </Button>
              </Box>
            )}
          </div>
        )}
      </Box>
    );
  }
}

export default injectIntl(withRouter(withApollo(EditConnectedAccount)));
