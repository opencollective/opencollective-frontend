import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Add } from '@styled-icons/material/Add';
import { Close } from '@styled-icons/material/Close';
import { cloneDeep, difference, get, pick } from 'lodash';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';
import { isURL } from 'validator';

import { CollectiveType } from '../../../lib/constants/collectives';
import { WebhookEvents, WebhookEventsList } from '../../../lib/constants/notificationEvents';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { gqlV1 } from '../../../lib/graphql/helpers';
import { i18nWebhookEventType } from '../../../lib/i18n/webhook-event-type';
import { compose } from '../../../lib/utils';

import { Box, Flex } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledHr from '../../StyledHr';
import StyledInputGroup from '../../StyledInputGroup';
import StyledSelect from '../../StyledSelect';
import { Label, P, Span } from '../../Text';

import WebhookActivityInfoModal, { hasWebhookEventInfo } from './WebhookActivityInfoModal';

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
      moreInfoModal: null,
      modified: false,
      webhooks: cloneDeep(this.getWebhooksFromProps(props)),
      isLoaded: false,
      status: null,
      error: '',
    };
  }

  componentDidUpdate(oldProps) {
    if (this.getWebhooksFromProps(oldProps) !== this.getWebhooksFromProps(this.props)) {
      this.setState({ webhooks: cloneDeep(this.getWebhooksFromProps(this.props)) });
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
        'collective.expense.deleted',
        'collective.expense.updated',
        'collective.expense.rejected',
        'collective.expense.approved',
        'collective.expense.paid',
        'collective.monthly',
        'collective.transaction.paid',
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

    if ([CollectiveType.USER, CollectiveType.ORGANIZATION].includes(collectiveType) && !isHost) {
      removeList.push(
        'collective.update.created',
        'collective.update.published',
        'collective.expense.created',
        'collective.transaction.created',
      );
    }

    return difference(WebhookEventsList, removeList);
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
      const result = await this.props.editWebhooks({ collectiveId: this.props.data.Collective.id, notifications });
      this.setState({ modified: false, status: 'saved', webhooks: cloneDeep(result.data.editWebhooks) });
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
        <Box my={[0, 3]}>
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
            <FormattedMessage id="webhooks.remove" defaultMessage="Remove webhook" />
          </StyledButton>
        </Box>

        <Box width={[1, 0.75]}>
          <Box mb={4}>
            <Label fontSize="14px" mb={1}>
              <FormattedMessage id="webhooks.url.label" defaultMessage="URL" />
            </Label>
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
            <Label fontSize="14px" mb={1}>
              <FormattedMessage defaultMessage="Activity" />
            </Label>
            <Flex alignItems="center">
              <StyledSelect
                minWidth={300}
                isSearchable={false}
                inputId="event-type-select"
                options={this.getEventTypes(data.Collective.type, data.Collective.isHost).map(eventType => ({
                  label: i18nWebhookEventType(intl, eventType),
                  value: eventType,
                }))}
                value={{ label: i18nWebhookEventType(intl, webhook.type), value: webhook.type }}
                onChange={({ value }) => this.editWebhook(index, 'type', value)}
              />
              {hasWebhookEventInfo(webhook.type) && (
                <StyledButton
                  buttonSize="tiny"
                  isBorderless
                  title={intl.formatMessage({ id: 'moreInfo', defaultMessage: 'More info' })}
                  onClick={() => this.setState({ moreInfoModal: webhook.type })}
                  ml={2}
                >
                  <InfoCircle size={24} color="#a3a3a3" />
                </StyledButton>
              )}
            </Flex>
          </Box>
          {data.Collective.isHost &&
            [WebhookEvents.COLLECTIVE_EXPENSE_CREATED, WebhookEvents.COLLECTIVE_TRANSACTION_CREATED].includes(
              webhook.type,
            ) && (
              <MessageBox type="warning" mt={2} withIcon>
                <FormattedMessage
                  defaultMessage="This event will only be triggered when the activity occurs on {host}'s account, not on its hosted initiatives."
                  values={{ host: this.props.collectiveSlug }}
                />
              </MessageBox>
            )}
          {this.state.moreInfoModal && (
            <WebhookActivityInfoModal
              activity={this.state.moreInfoModal}
              onClose={() => this.setState({ moreInfoModal: null })}
            />
          )}
        </Box>
      </Flex>
    );
  };

  render() {
    const { webhooks, status, error } = this.state;
    const { data } = this.props;
    const webhooksCount = webhooks.length;

    if (data.loading) {
      return <Loading />;
    }

    return (
      <div>
        <P fontSize="14px" lineHeight="18px">
          <FormattedMessage
            defaultMessage="You can use Webhooks to build custom integrations with Open Collective. Slack and Discord webhooks are natively supported. You can also integrate them with tools like Zapier, IFTTT, or Huginn. Learn more about this from <DocLink>the documentation</DocLink> or see how you can go further using our <GraphqlAPILink>public GraphQL API</GraphqlAPILink>."
            values={{
              GraphqlAPILink: getI18nLink({
                href: 'https://docs.opencollective.com/help/contributing/development/api#graphql-api',
                openInNewTab: true,
              }),
              DocLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/collectives/collective-settings/integrations#webhooks-generic-slack-discord',
                openInNewTab: true,
              }),
            }}
          />
        </P>

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
            <FormattedMessage
              defaultMessage="Add {existingWebhooksCount, select, 0 {your first} other {another}} webhook"
              values={{ existingWebhooksCount: webhooksCount }}
            />
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
            loading={status === 'loading'}
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

const editCollectiveWebhooksQuery = gqlV1/* GraphQL */ `
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

const editCollectiveWebhooksMutation = gqlV1/* GraphQL */ `
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
