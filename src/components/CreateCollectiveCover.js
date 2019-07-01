import React from 'react';
import PropTypes from 'prop-types';
import CollectiveCover from './CollectiveCover';
import { get } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';

class CreateCollectiveCover extends React.Component {
  static propTypes = {
    host: PropTypes.object,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'host.apply.title': {
        id: 'host.apply.title',
        defaultMessage: 'Apply to create a new {hostname} collective',
      },
      'collective.create.title': {
        id: 'collective.create.title',
        defaultMessage: 'Create an Open Collective',
      },
      'collective.create.description': {
        id: 'collective.create.description',
        defaultMessage: 'The place for your community to collect money and share your finance in full transparency.',
      },
    });

    this.host = props.host || {
      type: 'COLLECTIVE',
      settings: {
        apply: {
          title: this.props.intl.formatMessage(this.messages['collective.create.title']),
          description: this.props.intl.formatMessage(this.messages['collective.create.description']),
        },
      },
    };
  }

  error(msg) {
    this.setState({ result: { error: msg } });
  }

  resetError() {
    this.error();
  }

  render() {
    const { intl } = this.props;

    const title =
      get(this.host, 'settings.apply.title') ||
      intl.formatMessage(this.messages['host.apply.title'], {
        hostname: this.host.name,
      });
    const description =
      get(this.host, 'settings.apply.description') ||
      intl.formatMessage(this.messages['collective.create.description'], {
        hostname: this.host.name,
      });

    return (
      <CollectiveCover
        href={`/${this.host.slug}`}
        title={title}
        description={description}
        collective={this.host}
        className="small"
      />
    );
  }
}

export default injectIntl(CreateCollectiveCover);
