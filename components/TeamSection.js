import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Flex } from './Grid';
import MemberCard from './MemberCard';
import SectionTitle from './SectionTitle';

class TeamSection extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired, // collective.id
    LoggedInUser: PropTypes.object,
  };

  render() {
    const { collective, LoggedInUser } = this.props;

    let action;
    if (LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      action = {
        href: `/${collective.slug}/edit/members`,
        label: <FormattedMessage id="sections.team.edit" defaultMessage="Edit team members" />,
      };
    }

    const members = collective.members.filter(m => m.role === 'ADMIN' || m.role === 'MEMBER');
    return (
      <section id="team">
        <style jsx>
          {`
            .Members.cardsList {
              display: flex;
              flex-wrap: wrap;
            }
          `}
        </style>
        <SectionTitle section="team" action={action} />
        <Flex justifyContent="space-evenly" flexWrap="wrap">
          {members.map(({ id, role, since, member }) => (
            <MemberCard key={id} role={role} since={since} collective={member} m={3} />
          ))}
        </Flex>
      </section>
    );
  }
}

export default TeamSection;
