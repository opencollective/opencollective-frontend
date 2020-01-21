import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { defineMessages, injectIntl } from 'react-intl';

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
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      ADMIN: { id: 'Member.Role.ADMIN', defaultMessage: 'Collective Admin' },
      MEMBER: { id: 'Member.Role.MEMBER', defaultMessage: 'Core Contributor' },
      ATTENDEE: { id: 'Member.Role.ATTENDEE', defaultMessage: 'Attendee' },
      FUNDRAISER: {
        id: 'Member.Role.FUNDRAISER',
        defaultMessage: 'Fundraiser',
      },
      BACKER: { id: 'Member.Role.BACKER', defaultMessage: 'Financial Contributor' },
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

export default injectIntl(Role);
