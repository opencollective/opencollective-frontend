import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { get, pick, isEmpty } from 'lodash';
import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import events from '../constants/notificationEvents';
import Loading from './Loading';
import StyledButton from './StyledButton';
import { Add } from 'styled-icons/material/Add';
import { Close } from 'styled-icons/material/Close';
import { Flex, Box } from '@rebass/grid';
import StyledHr from './StyledHr';
import StyledSelect from './StyledSelect';
import StyledInputGroup from './StyledInputGroup';

class EditWebhooks extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    collectiveSlug: PropTypes.string.isRequired,
    editWebhooks: PropTypes.func,
    /** From graphql query */
    data: PropTypes.object.isRequired,
    /** From intl */
    intl: PropTypes.object.isRequired,
  };

  static getDerivedStateFromProps(props, state) {
    const webhooks = {};

    if (!state.isLoaded && !isEmpty(props.data.Collective)) {
      get(props, 'data.Collective.notifications', []).forEach(x => {
        if (!(x.webhookUrl in webhooks)) {
          webhooks[x.webhookUrl] = pick(x, ['webhookUrl']);
          webhooks[x.webhookUrl].activities = [];
        }
        webhooks[x.webhookUrl].activities.push(x.type);
      });

      return { webhooks: Object.values(webhooks), isLoaded: true };
    }

    return null;
  }

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = {
      modified: false,
      webhooks: {},
      isLoaded: false,
      status: null,
      error: '',
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
        defaultMessage: 'Add another webhook',
      },
      'webhooks.remove': {
        id: 'webhooks.remove',
        defaultMessage: 'Remove webhook',
      },
      loading: { id: 'loading', defaultMessage: 'Loading' },
      save: { id: 'save', defaultMessage: 'Save' },
      saved: { id: 'saved', defaultMessage: 'Saved' },
      title: { id: 'webhooks', defaultMessage: 'Webhooks' },
    });

    this.fields = [
      {
        name: 'webhookUrl',
        maxLength: 255,
        type: 'url',
        label: intl.formatMessage(this.messages['webhooks.url.label']),
        required: true,
        defaultValue: '',
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
        required: true,
      },
    ];
  }

  getWebhookCount = () => Object.keys(this.state.webhooks).length;

  editWebhook = (index, fieldname, value) => {
    const { webhooks } = this.state;
    webhooks[index][fieldname] = value;
    this.setState({ webhooks, modified: true });
  };

  addWebhook = () => {
    const { webhooks } = this.state;
    webhooks.push({ webhookUrl: '', activities: [] });
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
      if (!(notification.webhookUrl && notification.activities)) continue;

      for (const activity of notification.activities) {
        if (!activity) continue;

        notifications.push({
          id: notification.id,
          channel: 'webhook',
          type: activity,
          active: true,
          webhookUrl: notification.webhookUrl,
        });
      }
    }

    try {
      await this.props.editWebhooks({ collectiveId: this.props.data.Collective.id, notifications });

      this.setState({ modified: false, status: 'saved' });
      setTimeout(() => {
        this.setState({ status: null });
      }, 3000);
    } catch (e) {
      if (e && e.graphQLErrors) {
        const { message } = e.graphQLErrors[0];
        this.setState({ status: 'error', error: message });
      }
    }
  };

  renderWebhook = (webhook, index) => {
    const { intl } = this.props;
    const webHookCount = this.getWebhookCount();
    const [url, activities] = this.fields;

    return (
      <div className="webhook" key={index}>
        <style jsx>
          {`
            p.input-index-indicator {
              margin: 0;
              padding: 0;
              transform: translate(-36px, 1px);
              position: absolute;
              color: #d7d9e0;
              font-size: 2.5rem;
            }
            p.input-label {
              margin: 0;
              padding: 0;
              position: absolute;
              transform: translate(1px, -28px);
            }
            div.margin {
              margin: 4rem 0 4rem 0;
            }
          `}
        </style>
        <Flex flexDirection={['column-reverse', null, 'row']} my={4}>
          <Flex justifyContent="space-between" css={{ flexGrow: 1 }}>
            <Box css={{ width: '65%' }}>
              <form>
                <div className="margin">
                  <p className="input-index-indicator">{index + 1}</p>
                  <p className="input-label">{url.label}</p>
                  <StyledInputGroup
                    key={url.name}
                    name={url.name}
                    type={url.type}
                    required={url.required}
                    placeholder={url.placeholder || ''}
                    value={get(webhook, url.name)}
                    prepend="http://"
                    onChange={value => this.editWebhook(index, url.name, value.target.value)}
                    disabled={typeof url.disabled === 'function' ? url.disabled(webhook) : url.disabled}
                  />
                  <div className="margin">
                    <p className="input-label">{activities.label}</p>
                    <StyledSelect
                      minWidth={1}
                      key={activities.name}
                      name={activities.name}
                      options={activities.options.map(i => i.label).flat()}
                      value={get(webhook, activities.name)}
                      multiple={activities.multiple}
                      defaultValue={url.defaultValue}
                      required={url.required}
                      onChange={value => this.editWebhook(index, activities.name, value.value)}
                      disabled={
                        typeof activities.disabled === 'function' ? activities.disabled(webhook) : activities.disabled
                      }
                    />
                  </div>
                </div>
              </form>
            </Box>
            <Box>
              <div className="margin">
                <StyledButton
                  buttonStyle="standard"
                  buttonSize="small"
                  px={4}
                  mt={2}
                  onClick={() => this.removeWebhook(index)}
                  hidden={webHookCount <= 1}
                >
                  <Close size="1em" />
                  {'  '}
                  {intl.formatMessage(this.messages['webhooks.remove'])}
                </StyledButton>
              </div>
            </Box>
          </Flex>
        </Flex>
      </div>
    );
  };

  render() {
    const { webhooks, status, error } = this.state;
    const {
      intl,
      data: { loading },
    } = this.props;

    let submitBtnMessageId = 'save';
    if (['loading', 'saved'].includes(status)) {
      submitBtnMessageId = 'saved';
    }
    const submitBtnLabel = this.messages[submitBtnMessageId] && intl.formatMessage(this.messages[submitBtnMessageId]);
    const submitBtnLabelEnd = this.messages['title'] && intl.formatMessage(this.messages['title']);
    const captializedSubmitBtnLabel = submitBtnLabel.charAt(0).toUpperCase() + submitBtnLabel.slice(1);
    const webHookCount = this.getWebhookCount();

    return loading ? (
      <Loading />
    ) : (
      <div css={{ 'margin-left': '2.5rem' }} className="EditWebhooks">
        <style jsx>
          {`
            .error {
              color: red;
            }
          `}
        </style>
        <div className="webhooks">
          <h2 className="">{this.props.title}</h2>
          <StyledHr my={4} />
          {webhooks.map(this.renderWebhook)}
        </div>

        <div className="editWebhooksActions">
          <StyledButton
            buttonStyle="standard"
            buttonSize="medium"
            onClick={this.addWebhook}
            css={{ width: '65%' }}
            borderStyle="dashed"
            borderWidth="1px"
            borderRadius={4}
            px={4}
          >
            <Add size="1em" />
            {'  '}
            {intl.formatMessage(this.messages['webhooks.add'])}
          </StyledButton>
        </div>

        <StyledHr my={4} />

        {status === 'error' && <div className="error">{error}</div>}

        <div className="actions">
          <StyledButton
            buttonStyle="primary"
            buttonSize="medium"
            onClick={this.handleSubmit}
            disabled={loading || !this.state.modified}
            loading={status == 'loading'}
            px={4}
          >
            {captializedSubmitBtnLabel}
            {'  '}
            {webHookCount}
            {'  '}
            {submitBtnLabelEnd}
          </StyledButton>
        </div>
      </div>
    );
  }
}

const getCollectiveWithNotifications = gql`
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
`;

const getWebhooks = graphql(getCollectiveWithNotifications);

const editWebhooks = graphql(
  gql`
    mutation editWebhooks($collectiveId: Int!, $notifications: [NotificationInputType]) {
      editWebhooks(collectiveId: $collectiveId, notifications: $notifications) {
        id
      }
    }
  `,
  {
    props: ({ mutate, ownProps }) => ({
      editWebhooks: variables =>
        mutate({
          variables,
          refetchQueries: [
            {
              query: getCollectiveWithNotifications,
              variables: { collectiveSlug: ownProps.collectiveSlug },
            },
          ],
        }),
    }),
  },
);

const addData = compose(
  getWebhooks,
  editWebhooks,
);

export default injectIntl(addData(EditWebhooks));
