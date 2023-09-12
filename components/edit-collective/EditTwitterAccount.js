import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { cloneDeep, pick } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { gqlV1 } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledTextarea from '../StyledTextarea';
import { Label, P, Span } from '../Text';
import { TOAST_TYPE, withToasts } from '../ToastProvider';
import { Switch } from '../ui/Switch';

const DEFAULT_TWEETS = {
  newBacker: '{backerTwitterHandle} thank you for your contribution of {amount} 🙏 - it makes a difference!',
  tenBackers: `🎉 {collective} just reached 10 financial contributors! Thank you {topBackersTwitterHandles} 🙌
  Support them too!`,
  fiftyBackers: `🎉 {collective} just reached 50 financial contributors!! 🙌
  Support them too!`,
  oneHundred: `🎉 {collective} just reached 100 financial contributors!! 🙌
  Support them too!`,
  oneThousandBackers: `🎉 {collective} just reached 1,000 financial contributors!!! 🙌
  Support them too!`,
};

class EditTwitterAccount extends React.Component {
  static propTypes = {
    connectedAccount: PropTypes.object.isRequired,
    collective: PropTypes.object,
    intl: PropTypes.object.isRequired,
    editConnectedAccount: PropTypes.func.isRequired,
    addToast: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.renderNotification = this.renderNotification.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.messages = defineMessages({
      'newBacker.toggle.label': {
        id: 'connectedAccounts.twitter.newBacker.toggle.label',
        defaultMessage: 'New financial contributors',
      },
      'newBacker.toggle.description': {
        id: 'connectedAccounts.twitter.newBacker.toggle.description',
        defaultMessage:
          'Whenever you have a new contributor that has provided a twitter username, a tweet will be sent from your connected account',
      },
      'monthlyStats.toggle.label': {
        id: 'connectedAccounts.twitter.monthlyStats.toggle.label',
        defaultMessage: 'Monthly stats',
      },
      'monthlyStats.toggle.description': {
        id: 'connectedAccounts.twitter.monthlyStats.toggle.description',
        defaultMessage:
          'On the first of the month, automatically send a tweet with your latest stats (new and top contributors)',
      },
      'updatePublished.toggle.label': {
        id: 'connectedAccounts.twitter.updatePublished.toggle.label',
        defaultMessage: 'Update published',
      },
      'updatePublished.toggle.description': {
        id: 'connectedAccounts.twitter.updatePublished.toggle.description',
        defaultMessage: 'Send a tweet whenever you publish an Update',
      },
      'tenBackers.toggle.label': {
        id: 'connectedAccounts.twitter.tenBackers.toggle.label',
        defaultMessage: '10 contributors',
      },
      'tenBackers.toggle.description': {
        id: 'connectedAccounts.twitter.tenBackers.toggle.description',
        defaultMessage: 'Whenever one of the Collectives that you are Hosting reaches 10 contributors',
      },
      'oneHundredBackers.toggle.label': {
        id: 'connectedAccounts.twitter.oneHundredBackers.toggle.label',
        defaultMessage: '100 contributors',
      },
      'oneHundredBackers.toggle.description': {
        id: 'connectedAccounts.twitter.oneHundredBackers.toggle.description',
        defaultMessage: 'Whenever one of the Collectives that you are Hosting reaches 100 contributors',
      },
      'oneThousandBackers.toggle.label': {
        id: 'connectedAccounts.twitter.oneThousandBackers.toggle.label',
        defaultMessage: '1,000 contributors',
      },
      'oneThousandBackers.toggle.description': {
        id: 'connectedAccounts.twitter.oneThousandBackers.toggle.description',
        defaultMessage: 'Whenever one of the Collectives that you are Hosting reaches 1,000 contributors',
      },
    });

    const connectedAccount = cloneDeep(props.connectedAccount);
    connectedAccount.settings = connectedAccount.settings || {};
    this.getNotificationTypes().forEach(notificationType => {
      connectedAccount.settings[notificationType] = connectedAccount.settings[notificationType] || { active: false };
    });

    this.state = { isSaving: false, isModified: false, connectedAccount };
  }

  getNotificationTypes = () => {
    const notificationTypes = [];
    if (this.props.collective.type === 'COLLECTIVE') {
      notificationTypes.push('newBacker', 'monthlyStats', 'updatePublished');
    }
    if (this.props.collective.isHost) {
      notificationTypes.push('tenBackers', 'oneHundredBackers', 'oneThousandBackers');
    }

    return notificationTypes;
  };

  async onClick() {
    this.setState({ isSaving: true });
    try {
      const connectedAccount = pick(this.state.connectedAccount, ['id', 'settings']);
      await this.props.editConnectedAccount({ variables: { connectedAccount } });
      this.setState({ isModified: false });
      this.props.addToast({ type: TOAST_TYPE.SUCCESS, message: 'Twitter settings updated' });
    } finally {
      this.setState({ isSaving: false });
    }
  }

  handleChange(notification, attr, val) {
    const connectedAccount = cloneDeep(this.state.connectedAccount);
    connectedAccount.settings[notification][attr] = val;
    this.setState({ connectedAccount, isModified: true });
  }

  renderNotification(notificationType) {
    const { intl } = this.props;
    const { connectedAccount } = this.state;
    const defaultTweet = DEFAULT_TWEETS[notificationType];
    return (
      <Box margin="16px 0" key={notificationType}>
        <Flex alignItems="center">
          <Box flex="0 1" flexBasis={['100%', '25%']}>
            <Label htmlFor={`${notificationType}.active`} fontWeight="700" fontSize="14px" cursor="pointer">
              {intl.formatMessage(this.messages[`${notificationType}.toggle.label`])}
            </Label>
          </Box>
          <div>
            <Switch
              id={`${notificationType}.active`}
              name={`${notificationType}.active`}
              checked={connectedAccount.settings[notificationType].active}
              onCheckedChange={checked => this.handleChange(notificationType, 'active', checked)}
            />
          </div>
        </Flex>
        {this.messages[`${notificationType}.toggle.description`] && (
          <Flex>
            <Box flex="0 1" flexBasis={[0, '25%']} />
            <Box flex="1 1" flexBasis={['100%', '75%']} pl="12px">
              <P fontSize="13px" color="black.600">
                {intl.formatMessage(this.messages[`${notificationType}.toggle.description`])}
              </P>
            </Box>
          </Flex>
        )}
        {defaultTweet && (
          <Flex mt={2} flexWrap="wrap">
            <Box flex="0 1" flexBasis={[0, '25%']} />
            <Box flex="1 1" flexBasis={['100%', '75%']} pl="12px">
              <StyledTextarea
                maxLength={280}
                minHeight="100px"
                width="100%"
                showCount={true}
                name={`${notificationType}.tweet`}
                defaultValue={connectedAccount.settings[notificationType].tweet || ''}
                placeholder={defaultTweet}
                onChange={event => this.handleChange(notificationType, 'tweet', event.target.value)}
              />
            </Box>
          </Flex>
        )}
      </Box>
    );
  }

  render() {
    return (
      <details>
        <summary>
          <Span fontSize="15px" color="blue.500">
            <FormattedMessage id="Settings" defaultMessage="Settings" />
          </Span>
        </summary>
        <div>
          {this.getNotificationTypes().map(this.renderNotification)}
          <Flex flexWrap="wrap">
            <Box width={[1, '25%']} />
            <Box width={[1, '75%']}>
              <StyledButton
                disabled={!this.state.isModified}
                buttonStyle="primary"
                buttonSize="small"
                onClick={this.onClick}
                loading={this.state.isSaving}
                minWidth={100}
              >
                <FormattedMessage id="save" defaultMessage="Save" />
              </StyledButton>
            </Box>
          </Flex>
        </div>
      </details>
    );
  }
}

const editConnectedAccountMutation = gqlV1/* GraphQL */ `
  mutation EditConnectedAccount($connectedAccount: ConnectedAccountInputType!) {
    editConnectedAccount(connectedAccount: $connectedAccount) {
      id
      settings
    }
  }
`;

const addEditConnectedAccountMutation = graphql(editConnectedAccountMutation, {
  name: 'editConnectedAccount',
});

export default injectIntl(addEditConnectedAccountMutation(withToasts(EditTwitterAccount)));
