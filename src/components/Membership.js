import React from 'react';
import PropTypes from 'prop-types';
import CollectiveCard from './CollectiveCard';

class Membership extends React.Component {

  static propTypes = {
    membership: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);

  }

  render() {
    const { membership } = this.props;
    const { collective } = membership;

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
          <CollectiveCard membership={membership} collective={collective} />
        </div>
      </div>
    )
  }

}

export default Membership;