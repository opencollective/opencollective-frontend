import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { get, pick, isEmpty } from 'lodash';
import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import events from '../lib/constants/notificationEvents';
import Loading from './Loading';

import { Span } from './Text';
import StyledHr from './StyledHr';
import MessageBox from './MessageBox';
import { Flex, Box } from '@rebass/grid';
import StyledButton from './StyledButton';
import StyledSelect from './StyledSelect';
import { Add } from 'styled-icons/material/Add';
import StyledInputGroup from './StyledInputGroup';
import { Close } from 'styled-icons/material/Close';
import { isEmpty as visEmpty, isLength } from 'validator';

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
      'webhooks.save': {
        id: 'webhooks.save',
        defaultMessage: 'Save {count} webhooks',
      },
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
        options: events.sort(),
        multiple: true,
        defaultValue: [],
        required: true,
      },
    ];
  }

  validate = index => {
    const { webhooks, status } = this.state;
    const filtered = webhooks.filter(
      ({ webhookUrl }) => visEmpty(webhookUrl, { ignore_whitespace: true }) || !isLength(webhookUrl, { min: 3 }),
    );
    filtered.length > 0 && status === null
      ? this.setState({ status: 'invalid' })
      : filtered.length == 0 && status === 'invalid'
      ? this.setState({ status: null })
      : null;
    return status === 'invalid' && !webhooks[index].webhookUrl ? true : false;
  };

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
    const [url, activity] = this.fields;

    return (
      <Flex
        py={4}
        key={index}
        width={[0.9, 1]}
        mx={['auto', 0]}
        px={[0, 3, 0]}
        flexWrap="wrap"
        flexDirection="row-reverse"
        bg={['red', 'blue', 'green']}
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
            {intl.formatMessage(this.messages['webhooks.remove'])}
          </StyledButton>
        </Box>

        <Box width={[1, 0.75]}>
          <Box mb={4}>
            <Span fontSize="Paragraph" mb={1}>
              {url.label}
            </Span>
            <Span fontSize="3rem" color="#D7D9E0" css={'transform: translate(-50px, 23px); position: absolute;'}>
              {index + 1}
            </Span>
            <StyledInputGroup
              type={url.type}
              name={url.name}
              label={url.label}
              prepend="https://"
              error={this.validate(index)}
              value={get(webhook, url.name)}
              onChange={({ target }) => this.editWebhook(index, url.name, target.value)}
            />
          </Box>
          <Box>
            <Span fontSize="Paragraph">{activity.label}</Span>
            <StyledSelect
              options={activity.options}
              value={get(webhook, activity.name)}
              onChange={({ value }) => this.editWebhook(index, activity.name, [value])}
            />
          </Box>
        </Box>
      </Flex>
    );
  };

  render() {
    const { webhooks, status, error } = this.state;
    const {
      intl,
      data: { loading },
    } = this.props;
    const webhooksCount = webhooks.length;

    return loading ? (
      <Loading />
    ) : (
      <div>
        <h2>{this.props.title}</h2>
        <StyledHr />

        <div>{webhooks.map(this.renderWebhook)}</div>

        {webhooksCount > 0 && <StyledHr />}

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
            {intl.formatMessage(this.messages['webhooks.add'])}
          </StyledButton>
        </Box>

        <Box width={[0.9, 0.75]} mx={['auto', 0]} my={3}>
          <StyledButton
            width={[1]}
            px={[0, 3, 0]}
            borderRadius={6}
            buttonSize="medium"
            buttonStyle="standard"
            css={'border-style: dashed'}
            onClick={() => this.addWebhook()}
          >
            <Add size="1.2em" />
            {'  '}
            {intl.formatMessage(this.messages['webhooks.add'])}
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
            disabled={loading || !this.state.modified || status == 'invalid'}
          >
            <FormattedMessage
              id="webhooks.save"
              defaultMessage="Save {count} webhooks"
              values={{ count: webhooksCount }}
            />
          </StyledButton>
        </Box>
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
