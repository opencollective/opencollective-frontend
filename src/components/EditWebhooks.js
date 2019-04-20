import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form } from 'react-bootstrap';
import { defineMessages } from 'react-intl';
import { get, pick, isEmpty } from 'lodash';
import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import withIntl from '../lib/withIntl';
import InputField from './InputField';
import events from '../constants/events';
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

  handleSubmit = () => {
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

    this.setState({ modified: false });
  };

  renderWebhook = (webhook, index) => {
    const { intl } = this.props;

    return (
      <div className="webhook" key={`webhook-${index}-${webhook.id}`}>
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
    const { webhooks } = this.state;
    const {
      intl,
      data: { loading },
    } = this.props;

    return loading ? (
      <Loading />
    ) : (
      <div className="EditWebhooks">
        <style jsx>
          {`
            :global(.webhookActions) {
              text-align: right;
              font-size: 1.3rem;
            }
            :global(.field) {
              margin: 1rem;
            }
            .editWebhooksActions {
              text-align: right;
              margin-top: -1rem;
            }
            p {
              font-size: 1.3rem;
            }
            .actions {
              margin: 5rem auto 1rem;
              text-align: center;
            }
            :global(.webhook) {
              margin: 3rem 0;
            }
          `}
        </style>

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
            Save
          </Button>
        </div>
      </div>
    );
  }
}

const getWebhooks = graphql(gql`
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
`);

const addData = compose(getWebhooks);

export default withIntl(addData(EditWebhooks));
