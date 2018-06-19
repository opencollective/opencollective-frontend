import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import CollectiveCover from './CollectiveCover';
import { defineMessages } from 'react-intl';

class HostsCover extends React.Component {

  static propTypes = {
    host: PropTypes.object,
    title: PropTypes.string,
    description: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      "host.create.title": { id: "host.create.title", defaultMessage: "Become a host" }
    });
    this.collective = { type: "COLLECTIVE" };
  }

  error(msg) {
    this.setState({ result: { error: msg }})
  }

  resetError() {
    this.error();
  }

  render() {
    const { intl, title, description } = this.props;

    return (
      <CollectiveCover
        href="/hosts"
        title={title}
        description={description}
        collective={this.collective}
        className="small"
        />
    );
  }

}

export default withIntl(HostsCover);
