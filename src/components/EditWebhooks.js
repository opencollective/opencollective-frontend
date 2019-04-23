import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form } from 'react-bootstrap';
import { defineMessages } from 'react-intl';
import { get, pick, isEmpty } from 'lodash';
import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import withIntl from '../lib/withIntl';
import InputField from './InputField';
import events from '../constants/notificationEvents';
import Loading from './Loading';

class EditWebhooks extends React.Component {
  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    /** From graphql query */
    data: PropTypes.object.isRequired,
    /** From intl */
    intl: PropTypes.object.isRequired,
  };

  static getDerivedStateFromProps(props, state) {
    const webhooks = {};

    if (isEmpty(state.webhooks) && !isEmpty(props.data.Collective)) {
      get(props, 'data.Collective.notifications', []).forEach(x => {
        if (!(x.webhookUrl in webhooks)) {
          webhooks[x.webhookUrl] = pick(x, ['webhookUrl']);
          webhooks[x.webhookUrl].activities = [];
        }
        webhooks[x.webhookUrl].activities.push(x.type);
      });

      return { ...state, webhooks: Object.values(webhooks) };
    }

    return state;
  }

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = {
      modified: false,
      webhooks: {},
      status: null,
    };

    this.messages = defineMessages({
      'webhooks.url.label': {
        id: 'webhooks.url.label',
        defaultMessage: 'URL',
      },
      'webhooks.types.label': {
        id: 'webhooks.types.label',
        defaultMessage: 'Activities',
      },
      'webhooks.add': {
        id: 'webhooks.add',
        defaultMessage: 'add another webhook',
      },
      'webhooks.remove': {
        id: 'webhooks.remove',
        defaultMessage: 'remove webhook',
      },
      loading: { id: 'loading', defaultMessage: 'loading' },
      save: { id: 'save', defaultMessage: 'save' },
      saved: { id: 'saved', defaultMessage: 'saved' },
    });

    this.fields = [
      {
        name: 'webhookUrl',
        maxLength: 255,
        type: 'url',
        label: intl.formatMessage(this.messages['webhooks.url.label']),
      },
      {
        name: 'activities',
        type: 'select',
        label: intl.formatMessage(this.messages['webhooks.types.label']),
        options: events.sort().map(event => {
          return { value: event, label: event };
        }),
        multiple: true,
        defaultValue: [],
      },
    ];
  }

  editWebhook = (index, fieldname, value) => {
    const { webhooks } = this.state;
    webhooks[index][fieldname] = value;
    this.setState({ webhooks, modified: true });
  };

  addWebhook = webhook => {
    const { webhooks } = this.state;
    webhooks.push(webhook || {});
    this.setState({ webhooks, modified: true });
  };

  removeWebhook = index => {
    const { webhooks } = this.state;
    if (index < 0 || index > webhooks.length) return;
    webhooks.splice(index, 1);
    this.setState({ webhooks, modified: true });
  };

  handleSubmit = async () => {
    this.setState({ status: 'loading' });
    const { webhooks } = this.state;
    const notifications = [];
    for (const notification of webhooks) {
      for (const activity of notification.activities) {
        notifications.push({
          id: notification.id,
          channel: 'webhook',
          type: activity,
          active: true,
          webhookUrl: notification.webhookUrl,
        });
      }
    }

    await this.props.editNotifications({ id: this.props.data.Collective.id, notifications });

    this.setState({ modified: false, status: 'saved' });
    setTimeout(() => {
      this.setState({ status: null });
    }, 3000);
  };

  renderWebhook = (webhook, index) => {
    const { intl } = this.props;

    return (
      <div className="webhook" key={`webhook-${webhook.id}`}>
        <div className="webhookActions">
          <a className="removeWebhook" href="#" onClick={() => this.removeWebhook(index)}>
            {intl.formatMessage(this.messages['webhooks.remove'])}
          </a>
        </div>
        <Form horizontal>
          {this.fields.map(
            field =>
              (!field.when || field.when(webhook)) && (
                <InputField
                  className="horizontal"
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  type={field.type}
                  disabled={typeof field.disabled === 'function' ? field.disabled(webhook) : field.disabled}
                  defaultValue={get(webhook, field.name) || field.defaultValue}
                  options={field.options}
                  pre={field.pre}
                  placeholder={field.placeholder}
                  multiple={field.multiple || false}
                  onChange={value => this.editWebhook(index, field.name, value)}
                />
              ),
          )}
        </Form>
      </div>
    );
  };

  render() {
    const { webhooks, status } = this.state;
    const {
      intl,
      data: { loading },
    } = this.props;

    let submitBtnMessageId = 'save';
    if (['loading', 'saved'].includes(status)) {
      submitBtnMessageId = status;
    }
    const submitBtnLabel = this.messages[submitBtnMessageId] && intl.formatMessage(this.messages[submitBtnMessageId]);

    return loading ? (
      <Loading />
    ) : (
      <div className="EditWebhooks">
        <div className="webhooks">
          <h2>{this.props.title}</h2>
          {webhooks.map(this.renderWebhook)}
        </div>
        <div className="editWebhooksActions">
          <Button bsStyle="primary" onClick={() => this.addWebhook({})}>
            {intl.formatMessage(this.messages['webhooks.add'])}
          </Button>
        </div>

        <div className="actions">
          <Button
            bsStyle="primary"
            type="submit"
            onClick={this.handleSubmit}
            disabled={loading || !this.state.modified}
          >
            {submitBtnLabel}
          </Button>
        </div>
      </div>
    );
  }
}

const getWebhooks = graphql(
  gql`
    query Collective($collectiveSlug: String) {
      Collective(slug: $collectiveSlug) {
        id
        type
        slug
        currency
        notifications(channel: "webhook") {
          id
          type
          active
          webhookUrl
        }
      }
    }
  `,
);

const editNotifications = graphql(
  gql`
    mutation editNotifications($id: Int!, $notifications: [NotificationInputType]) {
      editNotifications(id: $id, notifications: $notifications) {
        id
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      editNotifications: variables => mutate({ variables }),
    }),
  },
);

const addData = compose(
  getWebhooks,
  editNotifications,
);

export default withIntl(addData(EditWebhooks));
