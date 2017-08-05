import React from 'react';
import PropTypes from 'prop-types';

import CollectiveCard from './CollectiveCard';

import { defineMessages, injectIntl } from 'react-intl';
import { pickAvatar } from '../lib/collective.lib';

class Membership extends React.Component {

  static propTypes = {
    order: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      INTERESTED: { id: 'order.status.interested', defaultMessage: '{name} is interested' },
      YES: { id: 'order.status.yes', defaultMessage: '{name} is going' }
    });

  }

  render() {
    const { membership } = this.props;
    const { collective } = membership;

    const user = collective.user || {};
    const name = ((collective.name && collective.name.match(/^null/)) ? null : collective.name) || collective.slug || user.email && user.email.substr(0, user.email.indexOf('@'));

    if (!name) return (<div/>);

    return (
      <div>
        <style jsx>{`
        .Membership {
          float: left;
          margin: 1rem;
        }
        `}</style>
        <div className="Membership">
          <CollectiveCard membership={membership} collective={collective} />
        </div>
      </div>
    )
  }

}

export default injectIntl(Membership);