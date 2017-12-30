import React from 'react';
import PropTypes from 'prop-types';
import CollectiveCard from './CollectiveCard';

class Membership extends React.Component {

  static propTypes = {
    membership: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);

  }

  render() {
    const { membership, LoggedInUser } = this.props;
    const { collective } = membership;

    if (!collective) {
      console.error(">>> no collective attached to this membership:", membership);
      return <div />;
    }

    const name = ((collective.name && collective.name.match(/^null/)) ? null : collective.name) || collective.slug;

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
          <CollectiveCard
            membership={membership}
            collective={collective}
            LoggedInUser={LoggedInUser}
            />
        </div>
      </div>
    )
  }

}

export default Membership;