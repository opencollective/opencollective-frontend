import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { defineMessages } from 'react-intl';

import withIntl from '../lib/withIntl';
import Container from './Container';

const RolesWrapper = styled(Container)`
  box-sizing: border-box;
  height: 24px;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  border: 1px solid #f5f7fa;
  border-radius: 100px;
  background-color: #f5f7fa;
  text-align: center;
`;

const RoleLabel = styled.label`
  color: #71757a;
  font-size: 12px;
  font-weight: normal;
  line-height: 13px;
  text-align: center;
  margin: 0;
`;

class Role extends React.Component {
  static propTypes = {
    role: PropTypes.string, // ADMIN | MEMBER | BACKER | FUNDRAISER | ATTENDEE
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      ADMIN: { id: 'roles.admin.label', defaultMessage: 'Core Contributor' },
      MEMBER: { id: 'roles.member.label', defaultMessage: 'Contributor' },
      ATTENDEE: { id: 'roles.attendee.label', defaultMessage: 'Attendee' },
      FUNDRAISER: {
        id: 'roles.fundraiser.label',
        defaultMessage: 'Fundraiser',
      },
      BACKER: { id: 'roles.backer.label', defaultMessage: 'Backer' },
    });
  }

  render() {
    const { role, intl } = this.props;

    if (!this.messages[role]) {
      return <div />;
    }

    return (
      <RolesWrapper>
        <RoleLabel>{intl.formatMessage(this.messages[role])}</RoleLabel>
      </RolesWrapper>
    );
  }
}

export default withIntl(Role);
