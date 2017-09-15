import React from 'react';
import PropTypes from 'prop-types';
import Member from './Member';

class Members extends React.Component {

  static propTypes = {
    members: PropTypes.arrayOf(PropTypes.object).isRequired
  }

  render() {
    const { className } = this.props;
    const members = [...this.props.members];
    members.sort((a, b) => b.totalDonations - a.totalDonations);
    if (!members || members.length === 0) return (<div />);
    const size = members.length > 50 ? 'small' : 'large';
    const viewMode = className && className.match(/sponsor/i) ? 'ORGANIZATION' : 'USER';

    console.log(">>> ", this.props.className, ":", members);
    return (
      <div className={`Members ${this.props.className}`} >
        <style jsx>{`
        .Members {
          max-width: 640px;
          margin: 3rem auto 3rem;
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
        }

        .Members.sponsors {
          max-width: 100%;
        }
        `}</style>
        {members.map((member, index) =>
          <Member
            key={`member${index}`}
            className={`${this.props.className} ${size}`}
            member={member}
            viewMode={viewMode}
            />
        )}
      </div>
    )
  }

}

export default Members;