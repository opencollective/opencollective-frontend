import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { FormattedMessage } from 'react-intl'
import SectionTitle from './SectionTitle';
import Member from './Member';

class TeamSection extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired, // collective.id
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { collective, LoggedInUser } = this.props;

    let action;
    if (LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      action = {
        href: `/${collective.slug}/edit#members`,
        label: <FormattedMessage id="sections.team.edit" defaultMessage="Edit team members" />
      }
    }

    const members = collective.members.filter(m => m.role === 'ADMIN' || m.role === 'MEMBER');

    return (
      <section id="team">
        <style jsx>{`
          .Members.cardsList {
            display: flex;
            flex-wrap: wrap;
          }
        `}</style>
        <SectionTitle section="team" action={action} />
        <div className="Members cardsList">
          {members.map((member) =>
            (<Member
              key={member.id}
              member={member}
              collective={collective}
              LoggedInUser={LoggedInUser}
            />)
          )}
        </div>
      </section>
    );
  }

}

export default withIntl(TeamSection);
