import React from 'react';
import { useApolloClient, useQuery } from '@apollo/client';
import { cloneDeep, invert, keyBy } from 'lodash-es';
import { Info, PlusCircle, Save, Trash, WebhookIcon } from 'lucide-react';
import memoizeOne from 'memoize-one';
import type { IntlShape } from 'react-intl';
import { defineMessages, FormattedMessage } from 'react-intl';
import { isURL } from 'validator';

import { FEATURES, isFeatureEnabled } from '../../../lib/allowed-features';
import { CollectiveType } from '../../../lib/constants/collectives';
import { WebhookEvents } from '../../../lib/constants/notificationEvents';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { gql } from '../../../lib/graphql/helpers';
import { i18nWebhookEventType } from '../../../lib/i18n/webhook-event-type';
import type { ActivityType, EditCollectiveWebhooksQuery } from '@/lib/graphql/types/v2/graphql';
import injectIntl from '@/lib/injectIntl';

import { getI18nLink } from '../../I18nFormatters';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledInputGroup from '../../StyledInputGroup';
import StyledSelect from '../../StyledSelect';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { Separator } from '../../ui/Separator';
import { toast } from '../../ui/useToast';

import WebhookActivityInfoModal, { hasWebhookEventInfo } from './WebhookActivityInfoModal';

const EMPTY_WEBHOOKS = [];

// Group webhook events by category
const WEBHOOK_EVENT_GROUPS = defineMessages({
  all: {
    defaultMessage: 'General',
    id: 'settings.general',
    events: [WebhookEvents.ALL, WebhookEvents.COLLECTIVE_COMMENT_CREATED, WebhookEvents.COLLECTIVE_TRANSACTION_CREATED],
  },
  expenses: {
    defaultMessage: 'Expenses',
    id: 'Expenses',
    events: [
      WebhookEvents.COLLECTIVE_EXPENSE_CREATED,
      WebhookEvents.COLLECTIVE_EXPENSE_UPDATED,
      WebhookEvents.COLLECTIVE_EXPENSE_DELETED,
      WebhookEvents.COLLECTIVE_EXPENSE_REJECTED,
      WebhookEvents.COLLECTIVE_EXPENSE_APPROVED,
      WebhookEvents.COLLECTIVE_EXPENSE_PAID,
    ],
  },
  contributions: {
    defaultMessage: 'Contributions',
    id: 'Contributions',
    events: [
      WebhookEvents.COLLECTIVE_MEMBER_CREATED,
      WebhookEvents.SUBSCRIPTION_CANCELED,
      WebhookEvents.ORDER_PROCESSED,
      WebhookEvents.ORDER_PENDING_CREATED,
      WebhookEvents.TICKET_CONFIRMED,
    ],
  },
  updates: {
    defaultMessage: 'Updates',
    id: 'updates',
    events: [WebhookEvents.COLLECTIVE_UPDATE_CREATED, WebhookEvents.COLLECTIVE_UPDATE_PUBLISHED],
  },
  host: {
    defaultMessage: 'Fiscal Host',
    id: 'Fiscalhost',
    events: [
      WebhookEvents.COLLECTIVE_APPLY,
      WebhookEvents.COLLECTIVE_APPROVED,
      WebhookEvents.COLLECTIVE_REJECTED,
      WebhookEvents.COLLECTIVE_CREATED,
      WebhookEvents.CONNECTED_ACCOUNT_CREATED,
    ],
  },
  virtualCards: {
    defaultMessage: 'Virtual Cards',
    id: 'VirtualCards.Title',
    events: [WebhookEvents.VIRTUAL_CARD_PURCHASE],
  },
});

// The UI uses the activity values (e.g. `collective.expense.created`), GraphQL v2 uses the enum names
const ACTIVITY_TYPE_BY_EVENT: Record<string, string> = Object.fromEntries(
  Object.entries(WebhookEvents).map(([key, value]) => [value, key === 'ALL' ? 'ACTIVITY_ALL' : key]),
);
const EVENT_BY_ACTIVITY_TYPE = invert(ACTIVITY_TYPE_BY_EVENT);

const toActivityType = (type: string) => (ACTIVITY_TYPE_BY_EVENT[type] ?? type) as ActivityType;
const fromActivityType = (activityType: string) => EVENT_BY_ACTIVITY_TYPE[activityType] ?? activityType;

const cleanWebhookUrl = value => {
  return value ? value.trim().replace(/https?:\/\//, '') : '';
};

interface Notification {
  id?: string;
  type: string;
  webhookUrl: string;
}

type WebhooksAccount = EditCollectiveWebhooksQuery['account'];

interface OwnProps {
  collectiveSlug: string;
}

interface Props extends OwnProps {
  intl: IntlShape;
  data: { account: WebhooksAccount; loading: boolean };
  webhooks: Notification[];
  saveWebhooks: (webhooks: Notification[]) => Promise<Notification[]>;
}

interface State {
  webhooks: Notification[];
  modified: boolean;
  status: string | null;
  moreInfoModal: string | null;
  isLoaded: boolean;
}

class Webhooks extends React.Component<Props, State> {
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
    // The reload after a failed save must not replace the edits
    if (!this.state.modified && this.getWebhooksFromProps(oldProps) !== this.getWebhooksFromProps(this.props)) {
      this.setState({ webhooks: cloneDeep(this.getWebhooksFromProps(this.props)) });
    }
  }

  getWebhooksFromProps = props => {
    return props.webhooks;
  };

  validateWebhookUrl = value => {
    return isURL(value);
  };

  cleanWebhookUrl = cleanWebhookUrl;

  getUnsupportedWebhookEvents = (collective): Set<string> => {
    const removeSet = new Set([WebhookEvents.COLLECTIVE_TRANSACTION_CREATED]); // Deprecating this event, see https://github.com/opencollective/opencollective/issues/7162

    // Features
    const canReceiveExpenses =
      isFeatureEnabled(collective, FEATURES.RECEIVE_EXPENSES) ||
      isFeatureEnabled(collective, FEATURES.FUNDS_GRANTS_MANAGEMENT);
    const canReceiveContributions = isFeatureEnabled(collective, FEATURES.RECEIVE_FINANCIAL_CONTRIBUTIONS);
    const canUseVirtualCards = isFeatureEnabled(collective, FEATURES.VIRTUAL_CARDS);
    const canUseUpdates = isFeatureEnabled(collective, FEATURES.UPDATES);

    // Build remove list based on features
    if (!canReceiveExpenses) {
      WEBHOOK_EVENT_GROUPS.expenses.events.forEach(event => removeSet.add(event));
    }
    if (!canReceiveContributions) {
      WEBHOOK_EVENT_GROUPS.contributions.events.forEach(event => removeSet.add(event));
    }
    if (!canUseVirtualCards) {
      WEBHOOK_EVENT_GROUPS.virtualCards.events.forEach(event => removeSet.add(event));
    }
    if (!canUseUpdates) {
      WEBHOOK_EVENT_GROUPS.updates.events.forEach(event => removeSet.add(event));
    }
    if (!canReceiveExpenses && !canReceiveContributions && !canUseUpdates) {
      removeSet.add(WebhookEvents.COLLECTIVE_COMMENT_CREATED);
    }

    // Collective type
    if (collective.type === CollectiveType.EVENT) {
      removeSet.add(WebhookEvents.SUBSCRIPTION_CANCELED); // No recurring contributions for events
    } else {
      removeSet.add(WebhookEvents.TICKET_CONFIRMED); // No tickets for non-events
    }

    // Host
    if (!collective.isHost) {
      WEBHOOK_EVENT_GROUPS.host.events.forEach(event => removeSet.add(event));
    }

    return removeSet;
  };

  getEventsOptions = memoizeOne(collective => {
    const toRemove = this.getUnsupportedWebhookEvents(collective);

    // Create options groups
    const { intl } = this.props;
    return Object.values(WEBHOOK_EVENT_GROUPS)
      .map(groupDetails => {
        return {
          label: intl.formatMessage(groupDetails),
          options: groupDetails.events
            .filter(type => !toRemove.has(type))
            .map(type => ({ value: type, label: i18nWebhookEventType(intl, type) })),
        };
      })
      .filter(group => group && group.options.length > 0);
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

    try {
      const savedWebhooks = await this.props.saveWebhooks(webhooks);
      this.setState({ modified: false, status: 'saved', webhooks: cloneDeep(savedWebhooks) });
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
            <Trash size={14} />
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
                options={this.getEventsOptions(data.account)}
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
          {data.account.isHost &&
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
                href: 'https://documentation.opencollective.com/development/api',
                openInNewTab: true,
              }),
              DocLink: getI18nLink({
                href: 'https://documentation.opencollective.com/collective-settings/integrations#webhooks-generic-slack-discord',
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
              values={{ collective: data.account.name || `@${data.account.slug}` }}
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

export const editCollectiveWebhooksQuery = gql`
  query EditCollectiveWebhooks($slug: String!) {
    account(slug: $slug) {
      id
      name
      type
      slug
      isHost
      features {
        id
        RECEIVE_EXPENSES
        FUNDS_GRANTS_MANAGEMENT
        VIRTUAL_CARDS
        RECEIVE_FINANCIAL_CONTRIBUTIONS
        UPDATES
      }
      webhooks(limit: 1000) {
        nodes {
          id
          activityType
          webhookUrl
        }
      }
    }
  }
`;

export const createWebhookMutation = gql`
  mutation CreateWebhook($webhook: WebhookCreateInput!) {
    createWebhook(webhook: $webhook) {
      id
    }
  }
`;

export const updateWebhookMutation = gql`
  mutation UpdateWebhook($webhook: WebhookUpdateInput!) {
    updateWebhook(webhook: $webhook) {
      id
    }
  }
`;

export const deleteWebhookMutation = gql`
  mutation DeleteWebhook($webhook: WebhookReferenceInput!) {
    deleteWebhook(webhook: $webhook) {
      id
    }
  }
`;

const getWebhooksFromAccount = (account: WebhooksAccount): Notification[] =>
  account?.webhooks.nodes.map(webhook => ({
    id: webhook.id,
    type: fromActivityType(webhook.activityType),
    webhookUrl: webhook.webhookUrl,
  })) ?? EMPTY_WEBHOOKS;

const WebhooksWithData = (props: OwnProps & { intl: IntlShape }) => {
  const client = useApolloClient();
  const { data, loading, error, refetch } = useQuery(editCollectiveWebhooksQuery, {
    variables: { slug: props.collectiveSlug },
  });
  const account = data?.account;
  const webhooks = React.useMemo(() => getWebhooksFromAccount(account), [account]);

  // Applies the difference between the saved webhooks and the edited ones. A created webhook gets its id in the form
  // right away, so saving again after an error does not create it twice.
  const saveWebhooks = async (editedWebhooks: Notification[]) => {
    // Without the reloaded list, saving again could repeat changes that were already saved
    const reload = () =>
      refetch().catch(() => {
        throw new Error(
          props.intl.formatMessage({
            defaultMessage: 'The webhooks could not be reloaded. Please reload the page to see what was saved.',
            id: '+nCy+p',
          }),
        );
      });
    const savedWebhooks = keyBy(webhooks, 'id');
    const editedIds = new Set(editedWebhooks.map(webhook => webhook.id));
    try {
      for (const webhook of webhooks.filter(webhook => !editedIds.has(webhook.id))) {
        await client.mutate({ mutation: deleteWebhookMutation, variables: { webhook: { id: webhook.id } } });
      }
      for (const webhook of editedWebhooks) {
        const saved = savedWebhooks[webhook.id];
        const isUrlEdited = !saved || cleanWebhookUrl(saved.webhookUrl) !== cleanWebhookUrl(webhook.webhookUrl);
        const values = {
          activityType: toActivityType(webhook.type),
          // The input only takes https URLs, but keep the saved scheme (e.g. http) when the URL is not edited
          webhookUrl: isUrlEdited ? `https://${cleanWebhookUrl(webhook.webhookUrl)}` : saved.webhookUrl,
        };
        if (!saved) {
          const result = await client.mutate({
            mutation: createWebhookMutation,
            variables: { webhook: { account: { id: account.id }, ...values } },
          });
          webhook.id = result.data.createWebhook.id;
        } else if (saved.type !== webhook.type || isUrlEdited) {
          await client.mutate({
            mutation: updateWebhookMutation,
            variables: { webhook: { id: webhook.id, ...values } },
          });
        }
      }
    } catch (e) {
      await reload(); // The changes made before the error were saved
      throw e;
    }
    const result = await reload();
    return getWebhooksFromAccount(result.data.account);
  };

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return <Webhooks {...props} data={{ account, loading }} webhooks={webhooks} saveWebhooks={saveWebhooks} />;
};

export default injectIntl(WebhooksWithData);
