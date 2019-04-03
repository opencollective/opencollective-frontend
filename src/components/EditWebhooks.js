import React from 'react';
import PropTypes from 'prop-types';

import { Button, Form } from 'react-bootstrap';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import { get } from 'lodash';
import InputField from './InputField';
import events from '../constants/events';

class EditWebhooks extends React.Component {
  static propTypes = {
    webhooks: PropTypes.arrayOf(PropTypes.object).isRequired,
    onChange: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = { webhooks: [...props.webhooks] || [{}] };
    this.renderWebhook = this.renderWebhook.bind(this);
    this.addWebhook = this.addWebhook.bind(this);
    this.removeWebhook = this.removeWebhook.bind(this);
    this.editWebhook = this.editWebhook.bind(this);
    this.onChange = props.onChange.bind(this);

    this.defaultType = this.props.defaultType || 'TICKET';

    this.messages = defineMessages({
      'webhooks.url.label': {
        id: 'webhooks.url.label',
        defaultMessage: 'URL',
      },
      'webhooks.types.label': {
        id: 'webhooks.types.label',
        defaultMessage: 'Types',
      },
      'webhooks.add': {
        id: 'webhooks.add',
        defaultMessage: 'add another webhook',
      },
      'webhooks.remove': {
        id: 'webhooks.remove',
        defaultMessage: 'remove webhook',
      },
    });

    const getOptions = arr => {
      return arr.map(key => {
        const obj = {};
        obj[key] = intl.formatMessage(this.messages[key]);
        return obj;
      });
    };

    this.fields = [
      {
        name: 'url',
        maxLength: 255,
        type: 'url',
        label: intl.formatMessage(this.messages['webhooks.url.label']),
      },
      {
        name: 'types',
        type: 'select',
        label: intl.formatMessage(this.messages['webhooks.types.label']),
        options: events.map(event => {
          return { value: event, label: event };
        }),
        multiple: true,
        defaultValue: [],
      },
    ];
  }

  editWebhook(index, fieldname, value) {
    const { webhooks } = this.state;
    webhooks[index] = {
      ...webhooks[index],
      role: webhooks[index].role || 'ADMIN',
    };
    const obj = {};
    if (fieldname.indexOf('.') !== -1) {
      const tokens = fieldname.split('.');
      const parent = tokens[0];
      fieldname = tokens[1];
      obj[parent] = {};
      obj[parent][fieldname] = value;
      webhooks[index][parent] = {
        ...webhooks[index][parent],
        [fieldname]: value,
      };
    } else {
      webhooks[index][fieldname] = value;
    }

    this.setState({ webhooks });
    this.onChange({ webhooks });
  }

  addWebhook(webhook) {
    const { webhooks } = this.state;
    webhooks.push(webhook || {});
    this.setState({ webhooks });
  }

  removeWebhook(index) {
    const { webhooks } = this.state;
    if (index < 0 || index > webhooks.length) return;
    webhooks.splice(index, 1);
    this.setState({ webhooks });
    this.onChange({ webhooks });
  }

  renderWebhook(webhook, index) {
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
  }

  render() {
    const { intl } = this.props;

    return (
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
            :global(.webhook) {
              margin: 3rem 0;
            }
          `}
        </style>

        <div className="webhooks">
          <h2>{this.props.title}</h2>
          {this.state.webhooks.map(this.renderWebhook)}
        </div>
        <div className="editWebhooksActions">
          <Button bsStyle="primary" onClick={() => this.addWebhook({})}>
            {intl.formatMessage(this.messages['webhooks.add'])}
          </Button>
        </div>
      </div>
    );
  }
}

export default withIntl(EditWebhooks);
