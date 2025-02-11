import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { cloneDeep, difference, get, pick } from 'lodash';
import { Info, PlusCircle, Save, Trash, WebhookIcon } from 'lucide-react';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';
import { isURL } from 'validator';

import { FEATURES, isFeatureEnabled } from '../../../lib/allowed-features';
import { CollectiveType } from '../../../lib/constants/collectives';
import { WebhookEvents, WebhookEventsList } from '../../../lib/constants/notificationEvents';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { gqlV1 } from '../../../lib/graphql/helpers';
import { i18nWebhookEventType } from '../../../lib/i18n/webhook-event-type';
import { compose } from '../../../lib/utils';

import { getI18nLink } from '../../I18nFormatters';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import StyledInputGroup from '../../StyledInputGroup';
import StyledSelect from '../../StyledSelect';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { Separator } from '../../ui/Separator';
import { toast } from '../../ui/useToast';

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

  getEventTypes = memoizeOne(collective => {
    const removeList = [WebhookEvents.COLLECTIVE_TRANSACTION_CREATED]; // Deprecating this event, see https://github.com/opencollective/opencollective/issues/7162

    // Features
    const canReceiveExpenses = isFeatureEnabled(collective, FEATURES.RECEIVE_EXPENSES);
    const canReceiveContributions = isFeatureEnabled(collective, FEATURES.RECEIVE_FINANCIAL_CONTRIBUTIONS);
    const canUseVirtualCards = isFeatureEnabled(collective, FEATURES.VIRTUAL_CARDS);
    const canUseUpdates = isFeatureEnabled(collective, FEATURES.UPDATES);

    if (!canReceiveExpenses) {
      removeList.push(
        'collective.expense.created',
        'collective.expense.deleted',
        'collective.expense.updated',
        'collective.expense.rejected',
        'collective.expense.approved',
        'collective.expense.paid',
      );
    }
    if (!canReceiveContributions) {
      removeList.push('collective.member.created', 'subscription.canceled', 'order.thankyou');
    }
    if (!canUseVirtualCards) {
      removeList.push('virtualcard.purchase');
    }
    if (!canUseUpdates) {
      removeList.push('collective.update.created', 'collective.update.published');
    }
    if (!canReceiveExpenses && !canReceiveContributions && !canUseUpdates) {
      removeList.push('collective.comment.created');
    }

    // Collective type
    if (collective.type !== CollectiveType.COLLECTIVE) {
      removeList.push('collective.monthly');
    }
    if (collective.type !== CollectiveType.ORGANIZATION) {
      removeList.push('organization.collective.created', 'user.created');
    }
    if (collective.type === CollectiveType.EVENT) {
      removeList.push('subscription.canceled'); // No recurring contributions for events
    } else {
      removeList.push('ticket.confirmed');
    }

    // Host
    if (!collective.isHost) {
      removeList.push('collective.apply', 'collective.approved', 'collective.created');
    }
    if ([CollectiveType.USER, CollectiveType.ORGANIZATION].includes(collective.type) && !collective.isHost) {
      removeList.push('collective.transaction.created');
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
      toast({ variant: 'error', message });
      this.setState({ status: null });
    }
  };

  renderWebhook = (webhook, index) => {
    const { intl, data } = this.props;

    return (
      <div key={index} className="rounded-lg border bg-white p-6 text-card-foreground shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-slate-100 p-2">
              <WebhookIcon size={24} />
            </div>
            <span className="text-lg font-bold">
              <FormattedMessage defaultMessage="Webhook #{index}" id="webhook.index" values={{ index: index + 1 }} />
            </span>
          </div>
          <Button
            variant="outlineDestructive"
            onClick={() => this.removeWebhook(index)}
            title={intl.formatMessage({ id: 'webhooks.remove', defaultMessage: 'Remove webhook' })}
          >
            <Trash size={14} alt={intl.formatMessage({ id: 'webhooks.remove', defaultMessage: 'Remove webhook' })} />
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div>
            <Label htmlFor={`webhook-url-${index}`} className="text-sm font-medium">
              <FormattedMessage id="webhooks.url.label" defaultMessage="URL" />
            </Label>
            <StyledInputGroup
              id={`webhook-url-${index}`}
              type="type"
              name="webhookUrl"
              prepend="https://"
              error={!this.validateWebhookUrl(webhook.webhookUrl)}
              value={this.cleanWebhookUrl(webhook.webhookUrl)}
              onChange={({ target }) => this.editWebhook(index, 'webhookUrl', target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`event-type-select-${index}`}>
              <FormattedMessage defaultMessage="Activity" id="ZmlNQ3" />
            </Label>
            <div className="flex items-center">
              <StyledSelect
                inputId={`event-type-select-${index}`}
                minWidth={300}
                isSearchable={false}
                options={this.getEventTypes(data.Collective).map(eventType => ({
                  label: i18nWebhookEventType(intl, eventType),
                  value: eventType,
                }))}
                value={{ label: i18nWebhookEventType(intl, webhook.type), value: webhook.type }}
                onChange={({ value }) => this.editWebhook(index, 'type', value)}
              />
              {hasWebhookEventInfo(webhook.type) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  title={intl.formatMessage({ id: 'moreInfo', defaultMessage: 'More info' })}
                  onClick={() => this.setState({ moreInfoModal: webhook.type })}
                >
                  <Info className="text-slate-400" size={18} />
                </Button>
              )}
            </div>
          </div>
          {data.Collective.isHost &&
            [WebhookEvents.COLLECTIVE_EXPENSE_CREATED, WebhookEvents.COLLECTIVE_TRANSACTION_CREATED].includes(
              webhook.type,
            ) && (
              <MessageBox type="warning" mt={2} withIcon>
                <FormattedMessage
                  defaultMessage="This event will only be triggered when the activity occurs on {host}'s account, not on its hosted initiatives."
                  id="XruSTn"
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
        </div>
      </div>
    );
  };

  render() {
    const { webhooks, status } = this.state;
    const { data } = this.props;

    if (data.loading) {
      return <Loading />;
    }

    return (
      <div>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            defaultMessage="You can use Webhooks to build custom integrations with Open Collective. Slack and Discord webhooks are natively supported. You can also integrate them with tools like Zapier, IFTTT, or Huginn. Learn more about this from <DocLink>the documentation</DocLink> or see how you can go further using our <GraphqlAPILink>public GraphQL API</GraphqlAPILink>."
            id="gN829M"
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
        </p>

        <Separator className="my-6" />

        <div className="mt-8 mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold">
            <FormattedMessage
              defaultMessage="Webhooks for {collective}"
              id="RHr16v"
              values={{ collective: data.Collective.name || `@${data.Collective.slug}` }}
            />
          </h3>
          <Button onClick={this.addWebhook}>
            <PlusCircle className="mr-2 h-5 w-5" /> <FormattedMessage defaultMessage="New Webhook" id="q7eF+t" />
          </Button>
        </div>

        {webhooks.length === 0 ? (
          <div className="rounded-lg border bg-card py-12 text-center text-card-foreground shadow-xs">
            <WebhookIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h4 className="text-lg font-semibold">
              <FormattedMessage defaultMessage="No webhooks configured" id="prsPHX" />
            </h4>
          </div>
        ) : (
          <div className="flex flex-col gap-6">{webhooks.map(this.renderWebhook)}</div>
        )}

        <Button
          className="mt-8 w-full"
          onClick={this.handleSubmit}
          loading={status === 'loading'}
          disabled={data.loading || !this.state.modified || status === 'invalid'}
        >
          <Save size={16} className="mr-2" />
          {status === 'saved' ? (
            <span>
              <FormattedMessage id="saved" defaultMessage="Saved" />
            </span>
          ) : (
            <FormattedMessage id="save" defaultMessage="Save" />
          )}
        </Button>
      </div>
    );
  }
}

const editCollectiveWebhooksQuery = gqlV1/* GraphQL */ `
  query EditCollectiveWebhooks($collectiveSlug: String) {
    Collective(slug: $collectiveSlug) {
      id
      name
      type
      slug
      isHost
      features {
        RECEIVE_EXPENSES
        VIRTUAL_CARDS
        RECEIVE_FINANCIAL_CONTRIBUTIONS
        UPDATES
      }
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
