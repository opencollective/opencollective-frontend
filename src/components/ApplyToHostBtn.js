import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo'
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'

import withIntl from '../lib/withIntl';
import Button from './Button';


class ApplyToHostBtn extends React.Component {

  static propTypes = {
    LoggedInUser: PropTypes.object,
    host: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = {};
  }
  
  async onClick() {
    const { host } = this.props;
    const CollectiveInputType = {
      id: this.collective.id,
      HostCollectiveId: host.id
    }
    console.log(">>> editCollective", CollectiveInputType);
    const res = await this.props.editCollective(CollectiveInputType);
    console.log(">>> res", res);
  }

  render() {
    const { LoggedInUser, host } = this.props;
    if (LoggedInUser) {
      const memberships = LoggedInUser.memberOf.filter(m => m.role === 'ADMIN' && m.collective.type === 'COLLECTIVE' && m.collective.stats.balance === 0);
      memberships.sort((a,b) => a.id < b.id);
      this.collective = memberships[0].collective;
    }

    return (
      <div className="ApplyToHostBtn">
        { !LoggedInUser &&
          <Button className="blue" href={`/${host.slug}/apply`}><FormattedMessage id="host.apply.create.btn" defaultMessage="Apply to create a collective" /></Button>
        }
        { LoggedInUser &&
          <Button onClick={this.onClick} className="blue"><FormattedMessage id="host.apply.btn" defaultMessage="Apply to host {collective}" values={{ collective: this.collective.name }} /></Button>
        }
      </div>
    );
  }

}

const applyToHostQuery = gql`
mutation editCollective($collective: CollectiveInputType!) {
  editCollective(collective: $collective) {
    id
    isActive
    host {
      id
      slug
    }
  }
}
`;

const addMutation = graphql(applyToHostQuery, {
  props: ( { mutate }) => ({
    editCollective: async (CollectiveInputType) => {
      return await mutate({ variables: { collective: CollectiveInputType } })
    }
  })
});

export default addMutation(withIntl(ApplyToHostBtn));
