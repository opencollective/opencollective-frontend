import React from 'react';
import PropTypes from 'prop-types';

import { Button, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { get } from 'lodash';
import InputField from '../components/InputField';

class EditMembers extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    members: PropTypes.arrayOf(PropTypes.object).isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = { members: [...props.members] || [{}] };
    this.renderMember = this.renderMember.bind(this);
    this.addMember = this.addMember.bind(this);
    this.removeMember = this.removeMember.bind(this);
    this.editMember = this.editMember.bind(this);
    this.onChange = props.onChange.bind(this);

    this.defaultType = this.props.defaultType || 'TICKET';

    this.messages = defineMessages({
      'members.role.label': { id: 'members.role.label', defaultMessage: 'role' },
      'members.add': { id: 'members.add', defaultMessage: 'add another member' },
      'members.remove': { id: 'members.remove', defaultMessage: 'remove member' },
      'ADMIN': { id: 'roles.admin.label', defaultMessage: 'Core Contributor' },
      'MEMBER': { id: 'roles.member.label', defaultMessage: 'Contributor' },
      'user.name.label': { id: 'user.name.label', defaultMessage: 'name' },
      'user.description.label': { id: 'user.description.label', defaultMessage: 'description' },
      'user.email.label': { id: 'user.email.label', defaultMessage: 'email' },
    });

    const getOptions = (arr) => {
      return arr.map(key => {
        const obj = {};
        obj[key] = intl.formatMessage(this.messages[key]);
        return obj;
      })
    }

    this.fields = [
      {
        name: 'role',
        type: 'select',
        options: getOptions(['ADMIN', 'MEMBER']),
        defaultValue: this.defaultType,
        label: intl.formatMessage(this.messages['members.role.label'])
      },
      {
        name: 'member.name',
        disabled: (member) => (member.id > 0),
        label: intl.formatMessage(this.messages['user.name.label'])
      },
      {
        name: 'member.email',
        type: 'email',
        disabled: (member) => (member.id > 0),
        label: intl.formatMessage(this.messages['user.email.label'])
      },
      {
        name: 'description',
        label: intl.formatMessage(this.messages['user.description.label'])
      }
    ];
  }

  editMember(index, fieldname, value) {
    const members = this.state.members;
    members[index] = { ... members[index], role: members[index].role || 'ADMIN' };
    const obj = {};
    if (fieldname.indexOf('.') !== -1) {
      const tokens = fieldname.split('.');
      const parent = tokens[0];
      fieldname = tokens[1];
      obj[parent] = {};
      obj[parent][fieldname] = value;
      members[index][parent] = { ...members[index][parent], [fieldname]: value } ;
    } else {
      members[index][fieldname] = value;
    }

    this.setState({members});
    this.onChange({members});
  }

  addMember(member) {
    const members = this.state.members;
    members.push(member || {});
    this.setState({members});
  }

  removeMember(index) {
    let members = this.state.members;
    if (index < 0 || index > members.length) return;
    members = [...members.slice(0, index), ...members.slice(index+1)];
    this.setState({members});
    this.onChange({members});
  }

  renderMember(member, index) {
    const { intl } = this.props;

    return (
      <div className="member" key={`member-${index}`}>
        <div className="memberActions">
          <a className="removeMember" href="#" onClick={() => this.removeMember(index)}>{intl.formatMessage(this.messages[`members.remove`])}</a>
        </div>
        <Form horizontal>
          {this.fields.map(field => (!field.when || field.when(member)) && <InputField
            className="horizontal"
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type}
            disabled={typeof field.disabled === 'function' ? field.disabled(member) : field.disabled}
            defaultValue={get(member,field.name) || field.defaultValue}
            options={field.options}
            pre={field.pre}
            placeholder={field.placeholder}
            onChange={(value) => this.editMember(index, field.name, value)}
            />)}
        </Form>
      </div>
    );
  }

  render() {
    const { intl, collective } = this.props;

    return (
      <div className="EditMembers">
        <style jsx>{`
          :global(.memberActions) {
            text-align: right;
            font-size: 1.3rem;
          }
          :global(.field) {
            margin: 1rem;
          }
          .editMembersActions {
            text-align: right;
            margin-top: -1rem;
          }
          p {
            font-size: 1.3rem;
          }
          :global(.member) {
            margin: 3rem 0;
          }
        `}</style>

        <div className="members">
          <h2>{this.props.title}</h2>
          { collective.type === 'COLLECTIVE' &&
          <p><FormattedMessage id="members.edit.description" defaultMessage="Note: Only Core Contributors can edit this collective and approve or reject expenses." /></p>
          }
          {this.state.members.map(this.renderMember)}
        </div>
        <div className="editMembersActions">
          <Button bsStyle="primary" onClick={() => this.addMember({})}>{intl.formatMessage(this.messages[`members.add`])}</Button>
        </div>

      </div>
    );
  }

}

export default withIntl(EditMembers);