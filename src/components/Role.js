import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';

class Role extends React.Component {

  static propTypes = {
    role: PropTypes.string // ADMIN | MEMBER | BACKER | FUNDRAISER | ATTENDEE
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'ADMIN': { id: 'roles.admin.label', defaultMessage: 'Core Contributor' },
      'MEMBER': { id: 'roles.member.label', defaultMessage: 'Contributor' },
      'ATTENDEE': { id: 'roles.attendee.label', defaultMessage: 'Attendee' },
      'FUNDRAISER': { id: 'roles.fundraiser.label', defaultMessage: 'Fundraiser' },
      'BACKER': { id: 'roles.backer.label', defaultMessage: 'Backer' }
    })
  }

  render() {

    const { role, intl } = this.props;

    if (!this.messages[role]) {
      return (<div />);
    }

    return (
      <div className="Role">
        <style jsx>{`
        .Role {
          box-sizing: border-box;
          height: 22px;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          border: 1px solid #CACBCC;
          border-radius: 4px;
          background-color: #FFFFFF;
          text-align: center;
        }
        label {
          color: #666F80;
          font-family: Rubik;
          font-size: 11px;
          font-weight: normal;
          line-height: 13px;
          text-align: center;
          margin: 0;
        }
        `}</style>
        <label>{intl.formatMessage(this.messages[role])}</label>
      </div>
    );
  }
}

export default withIntl(Role);
