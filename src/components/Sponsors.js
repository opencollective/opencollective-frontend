import React from 'react';
import PropTypes from 'prop-types';
import UserCard from './UserCard';

class Sponsors extends React.Component {

  static propTypes = {
    sponsors: PropTypes.arrayOf(PropTypes.object).isRequired
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { sponsors } = this.props;
    if (!sponsors || sponsors.length === 0) return (<div/>);
    return (
      <div className="Sponsors" >
        <style jsx>{`
        .Sponsors {
          max-width: 640px;
          margin: 3rem auto 3rem;
          text-align: center;
          overflow: hidden;
        }
        `}</style>
        {sponsors.map((sponsor, index) =>
          <UserCard type="sponsor" key={`sponsor${index}`} user={sponsor} />
        )}
      </div>
    )
  }

}

export default Sponsors;