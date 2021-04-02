import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Add } from '@styled-icons/material/Add';
import { Close } from '@styled-icons/material/Close';
import { difference, get, pick } from 'lodash';
import memoizeOne from 'memoize-one';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { isURL } from 'validator';

import { CollectiveType } from '../../../lib/constants/collectives';
import events from '../../../lib/constants/notificationEvents';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { compose } from '../../../lib/utils';

import { Box, Flex } from '../../Grid';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledHr from '../../StyledHr';
import StyledInputGroup from '../../StyledInputGroup';
import StyledSelect from '../../StyledSelect';
import { Span } from '../../Text';
import SettingsTitle from '../SettingsTitle';

const messages = defineMessages({
  'webhooks.url.label': {
    id: 'webhooks.url.label',
    defaultMessage: 'URL',
  },
  'webhooks.types.label': {
    id: 'webhooks.types.label',
    defaultMessage: 'Activity',
  },
  'webhooks.add': {
    id: 'webhooks.add',
    defaultMessage: 'Add another webhook',
  },
  'webhooks.remove': {
    id: 'webhooks.remove',
    defaultMessage: 'Remove webhook',
  },
  'webhooks.save': {
    id: 'webhooks.save',
    defaultMessage: 'Save {count} webhooks',
  },
});

const EMPTY_WEBHOOKS = [];

class Webhooks extends React.Component {
  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    editWebhooks: PropTypes.func,
    /** From graphql query */
    data: PropTypes.object.isRequired,
    /** From intl */
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      modified: false,
      webhooks: [...this.getWebhooksFromProps(props)],
      isLoaded: false,
      status: null,
      error: '',
    };
  }

  componentDidUpdate(oldProps) {
    if (this.getWebhooksFromProps(oldProps) !== this.getWebhooksFromProps(this.props)) {
      this.setState({ webhooks: [...this.getWebhooksFromProps(this.props)] });
    }
  }

  getWebhooksFromProps = props => {
    return get(props, 'data.Collective.notifications', EMPTY_WEBHOOKS);
  };

  validateWebhookUrl = value => {
    return isURL(value);
  };

  cleanWebhookUrl = value => {
    return value ? value.trim().replace(/https?:\/\//, '') : '';
  };

  getEventTypes = memoizeOne((collectiveType, isHost) => {
    const removeList = [];

    if (collectiveType !== CollectiveType.COLLECTIVE) {
      removeList.push(
        'collective.comment.created',
        'collective.expense.created',
        'collective.expense.deleted',
        'collective.expense.updated',
        'collective.expense.rejected',
        'collective.expense.approved',
        'collective.expense.paid',
        'collective.monthly',
        'collective.transaction.created',
        'collective.transaction.paid',
        'collective.update.created',
        'collective.update.published',
      );
    }
    if (collectiveType !== CollectiveType.ORGANIZATION) {
      removeList.push('organization.collective.created', 'user.created');
    }
    if (collectiveType !== CollectiveType.EVENT) {
      removeList.push('ticket.confirmed');
    }
    if (!isHost) {
      removeList.push('collective.apply', 'collective.approved', 'collective.created');
    }

    return difference(events, removeList);
  });

  editWebhook = (index, fieldname, value) => {
    const { webhooks, status } = this.state;
    let newStatus = status;

    if (fieldname === 'webhookUrl') {
      const cleanValue = this.cleanWebhookUrl(value);
      webhooks[index][fieldname] = cleanValue;
      const isValid = webhooks.every(webhook => this.validateWebhookUrl(webhook.webhookUrl));
      newStatus = isValid ? null : 'invalid';
    } else {
      webhooks[index][fieldname] = value;
    }
    this.setState({ webhooks, modified: true, status: newStatus });
  };

  addWebhook = () => {
    const { webhooks } = this.state;
    webhooks.push({ webhookUrl: '', type: 'all' });
    this.setState({ webhooks, modified: true, status: 'invalid' });
  };

  removeWebhook = index => {
    const { webhooks } = this.state;
    if (index < 0 || index > webhooks.length) {
      return;
    }
    webhooks.splice(index, 1);
    this.setState({ webhooks, modified: true });
  };

  handleSubmit = async () => {
    this.setState({ status: 'loading' });
    const { webhooks } = this.state;
    const notifications = webhooks.map(webhook => pick(webhook, ['type', 'webhookUrl', 'id']));

    try {
      await this.props.editWebhooks({ collectiveId: this.props.data.Collective.id, notifications });
      this.setState({ modified: false, status: 'saved' });
      setTimeout(() => {
        this.setState({ status: null });
      }, 3000);
    } catch (e) {
      const message = getErrorFromGraphqlException(e).message;
      this.setState({ status: 'error', error: message });
    }
  };

  renderWebhook = (webhook, index) => {
    const { intl, data } = this.props;

    return (
      <Flex
        py={4}
        key={index}
        width={[0.9, 1]}
        mx={['auto', 0]}
        px={[0, 3, 0]}
        flexWrap="wrap"
        flexDirection="row-reverse"
        justifyContent="space-between"
      >
        <Box my={[0, 4]}>
          <StyledButton
            width={1}
            py={1}
            px={3}
            buttonSize="small"
            buttonStyle="standard"
            onClick={() => this.removeWebhook(index)}
          >
            <Close size="1.2em" />
            {'  '}
            {intl.formatMessage(messages['webhooks.remove'])}
          </StyledButton>
        </Box>

        <Box width={[1, 0.75]}>
          <Box mb={4}>
            <Span fontSize="14px" mb={1}>
              {intl.formatMessage(messages['webhooks.url.label'])}
            </Span>
            <StyledInputGroup
              type="type"
              name="webhookUrl"
              prepend="https://"
              error={!this.validateWebhookUrl(webhook.webhookUrl)}
              value={this.cleanWebhookUrl(webhook.webhookUrl)}
              onChange={({ target }) => this.editWebhook(index, 'webhookUrl', target.value)}
            />
          </Box>
          <Box>
            <Span fontSize="14px">{intl.formatMessage(messages['webhooks.types.label'])}</Span>
            <StyledSelect
              inputId="event-type-select"
              options={this.getEventTypes(data.Collective.type, data.Collective.isHost).map(webhook => ({
                label: webhook,
                value: webhook,
              }))}
              value={{ label: webhook.type, value: webhook.type }}
              onChange={({ value }) => this.editWebhook(index, 'type', value)}
            />
          </Box>
        </Box>
      </Flex>
    );
  };

  render() {
    const { webhooks, status, error } = this.state;
    const { intl, data } = this.props;
    const webhooksCount = webhooks.length;

    if (data.loading) {
      return <Loading />;
    }

    return (
      <div>
        <SettingsTitle>
          <FormattedMessage id="editCollective.menu.webhooks" defaultMessage="Webhooks" />
        </SettingsTitle>

        <div>{webhooks.map(this.renderWebhook)}</div>

        {webhooksCount > 0 && <StyledHr borderColor="black.300" />}

        <Box width={[0.9, 0.75]} mx={['auto', 0]} my={3}>
          <StyledButton
            width={1}
            px={[0, 3, 0]}
            borderRadius={6}
            buttonSize="medium"
            buttonStyle="standard"
            css={'border-style: dashed'}
            onClick={() => this.addWebhook()}
          >
            <Add size="1.2em" />
            {'  '}
            {intl.formatMessage(messages['webhooks.add'])}
          </StyledButton>
        </Box>

        {status === 'error' && (
          <Box my={3}>
            <MessageBox type="error">{error}</MessageBox>
          </Box>
        )}

        <Box mr={3}>
          <StyledButton
            px={4}
            buttonSize="medium"
            buttonStyle="primary"
            onClick={this.handleSubmit}
            loading={status == 'loading'}
            disabled={data.loading || !this.state.modified || status === 'invalid'}
          >
            {status === 'saved' ? (
              <Span textTransform="capitalize">
                <FormattedMessage id="saved" defaultMessage="Saved" />
              </Span>
            ) : (
              <FormattedMessage
                id="webhooks.save"
                defaultMessage="Save {count} webhooks"
                values={{ count: webhooksCount }}
              />
            )}
          </StyledButton>
        </Box>
      </div>
    );
  }
}

const editCollectiveWebhooksQuery = gql`
  query EditCollectiveWebhooks($collectiveSlug: String) {
    Collective(slug: $collectiveSlug) {
      id
      type
      slug
      isHost
      notifications(channel: "webhook") {
        id
        type
        active
        webhookUrl
      }
    }
  }
`;

const editCollectiveWebhooksMutation = gql`
  mutation EditCollectiveWebhooks($collectiveId: Int!, $notifications: [NotificationInputType]) {
    editWebhooks(collectiveId: $collectiveId, notifications: $notifications) {
      id
      type
      active
      webhookUrl
    }
  }
`;

const addEditCollectiveWebhooksData = graphql(editCollectiveWebhooksQuery);

const editEditCollectiveWebhooksMutation = graphql(editCollectiveWebhooksMutation, {
  props: ({ mutate, ownProps }) => ({
    editWebhooks: variables =>
      mutate({
        variables,
        update: (cache, { data: { editWebhooks } }) => {
          const { Collective } = cache.readQuery({
            query: editCollectiveWebhooksQuery,
            variables: { collectiveSlug: ownProps.collectiveSlug },
          });
          cache.writeQuery({
            query: editCollectiveWebhooksQuery,
            data: { Collective: { ...Collective, notifications: editWebhooks } },
          });
        },
      }),
  }),
});

const addGraphql = compose(addEditCollectiveWebhooksData, editEditCollectiveWebhooksMutation);

export default injectIntl(addGraphql(Webhooks));
