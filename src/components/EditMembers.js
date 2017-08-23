import React from 'react';
import PropTypes from 'prop-types';

import { Button, Form } from 'react-bootstrap';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import { get } from 'lodash';
import InputField from '../components/InputField';

class EditMembers extends React.Component {

  static propTypes = {
    members: PropTypes.arrayOf(PropTypes.object).isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = { members: [...props.members] || [{}] };
    this.renderTier = this.renderTier.bind(this);
    this.addMember = this.addMember.bind(this);
    this.removeTier = this.removeTier.bind(this);
    this.editMember = this.editMember.bind(this);
    this.onChange = props.onChange.bind(this);

    this.defaultType = this.props.defaultType || 'TICKET';

    this.messages = defineMessages({
      'members.role.label': { id: 'members.role.label', defaultMessage: 'role' },
      'members.add': { id: 'members.add', defaultMessage: 'add member' },
      'members.remove': { id: 'members.remove', defaultMessage: 'remove member' },
      'ADMIN': { id: 'roles.admin.label', defaultMessage: 'core contributor' },
      'CONTRIBUTOR': { id: 'roles.contributor.label', defaultMessage: 'contributor' },
      'user.name.label': { id: 'user.name.label', defaultMessage: 'name' },
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
        options: getOptions(['ADMIN', 'CONTRIBUTOR']),
        defaultValue: this.defaultType,
        label: intl.formatMessage(this.messages['members.role.label'])
      },
      {
        name: 'member.name',
        label: intl.formatMessage(this.messages['user.name.label'])
      },
      {
        name: 'member.email',
        type: 'email',
        when: (member) => !member.id,
        label: intl.formatMessage(this.messages['user.email.label'])
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

  removeTier(index) {
    let members = this.state.members;
    if (index < 0 || index > members.length) return;
    members = [...members.slice(0, index), ...members.slice(index+1)];
    this.setState({members});
    this.onChange({members});
  }

  renderTier(member, index) {
    const { intl } = this.props;

    return (
      <div className="member" key={`member-${index}`}>
        <div className="memberActions">
          <a className="removeTier" href="#" onClick={() => this.removeTier(index)}>{intl.formatMessage(this.messages[`members.remove`])}</a>
        </div>
        <Form horizontal>
          {this.fields.map(field => (!field.when || field.when(member)) && <InputField
            className="horizontal"
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type}
            defaultValue={field.defaultValue}
            value={get(member,field.name)}
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
    const { intl } = this.props;

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
          :global(.member) {
            margin: 3rem 0;
          }
        `}</style>

        <div className="members">
          <h2>{this.props.title}</h2>
          {this.state.members.map(this.renderTier)}
        </div>
        <div className="editMembersActions">
          <Button bsStyle="primary" onClick={() => this.addMember({})}>{intl.formatMessage(this.messages[`members.add`])}</Button>
        </div>

      </div>
    );
  }

}

export default withIntl(EditMembers);