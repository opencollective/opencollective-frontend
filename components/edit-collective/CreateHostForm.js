import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { get, groupBy } from 'lodash';
import { withRouter } from 'next/router';
import { Button } from 'react-bootstrap';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { Router } from '../../server/pages';

import { Box, Flex } from '../Grid';
import InputField from '../InputField';

import CreateOrganizationForm from './CreateOrganizationForm';
import EditConnectedAccount from './EditConnectedAccount';

class CreateHostForm extends React.Component {
  static propTypes = {
    organizations: PropTypes.arrayOf(PropTypes.object).isRequired,
    collective: PropTypes.object.isRequired,
    userCollective: PropTypes.object.isRequired,
    createOrganization: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired, // when selecting the host to use
    intl: PropTypes.object.isRequired,
    router: PropTypes.object, // from withRouter
  };

  constructor(props) {
    super(props);

    const hostType = this.getCurrentHostType();
    const hostId = this.getDefaultHostId(hostType);

    this.state = { form: { hostId } };

    this.messages = defineMessages({
      'hostType.label': {
        id: 'host.types.label',
        defaultMessage: 'Select host type',
      },
      'hostId.label': {
        id: 'host.hostId.label',
        defaultMessage: 'Select organization',
      },
      'host.types.user.label': {
        id: 'host.types.user.label',
        defaultMessage: 'an individual (me)',
      },
      'host.types.organization.label': {
        id: 'host.types.organization.label',
        defaultMessage: 'an organization',
      },
      'organization.create': {
        id: 'tier.order.organization.create',
        defaultMessage: 'create an organization',
      },
    });
  }

  async createOrganization(org) {
    const organization = await this.props.createOrganization(org);

    this.setState(state => ({
      host: organization,
      form: {
        ...state.form,
        hostId: organization.id,
      },
    }));
  }

  handleChange(attr, value) {
    const { form } = this.state;

    if (attr === 'hostType') {
      form['hostId'] = this.getDefaultHostId(value);
      Router.pushRoute('editCollective', {
        slug: this.props.collective.slug,
        section: 'host',
        selectedOption: 'ownHost',
        hostType: value,
      });
    } else {
      form[attr] = value;
    }

    this.setState({ form });
  }

  getCurrentHostType() {
    return get(this.props.router, 'query.hostType', 'individual');
  }

  getDefaultHostId(hostType) {
    if (hostType === 'individual') {
      return this.props.userCollective.id;
    } else {
      return get(this.props, 'organizations[0].id', 0);
    }
  }

  getHostTypesOptions() {
    return [
      {
        label: this.props.intl.formatMessage(this.messages['host.types.user.label']),
        value: 'individual',
      },
      {
        label: this.props.intl.formatMessage(this.messages['host.types.organization.label']),
        value: 'organization',
      },
    ];
  }

  getOrganizationsOptions() {
    const organizationsOptions = this.props.organizations.map(({ name, id }) => ({ label: name, value: id }));

    organizationsOptions.push({
      label: this.props.intl.formatMessage({
        id: 'organization.create',
        defaultMessage: 'create an organization',
      }),
      value: 0,
    });

    return organizationsOptions;
  }

  getInputFields() {
    const fields = [
      {
        name: 'hostType',
        type: 'select',
        options: this.getHostTypesOptions(),
        value: this.getCurrentHostType(),
        focus: true,
      },
      {
        name: 'hostId',
        type: 'select',
        options: this.getOrganizationsOptions(),
        value: this.state.form.hostId,
        when: () => this.getCurrentHostType() === 'organization',
      },
    ];

    return fields.map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = this.props.intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      return field;
    });
  }

  getHost(hostType) {
    if (this.state.host) {
      return this.state.host;
    } else if (hostType === 'individual') {
      return this.props.userCollective;
    } else {
      return this.props.organizations.find(c => c.id === Number(this.state.form.hostId));
    }
  }

  render() {
    const hostType = this.getCurrentHostType();
    const host = this.getHost(hostType);

    const connectedAccounts = host && groupBy(host.connectedAccounts, 'service');
    const stripeAccount = connectedAccounts && connectedAccounts['stripe'] && connectedAccounts['stripe'][0];

    return (
      <div className="CreateHostForm">
        {this.getInputFields().map(
          field =>
            (!field.when || field.when()) && (
              <Flex key={`${field.name}.input`}>
                <Box width={1}>
                  <InputField {...field} onChange={value => this.handleChange(field.name, value)} />
                </Box>
              </Flex>
            ),
        )}

        {hostType === 'organization' && !host && (
          <Fragment>
            <CreateOrganizationForm header={false} onChange={org => this.handleChange('organization', org)} />
            <Button
              bsStyle="primary"
              type="submit"
              onClick={() => this.createOrganization(this.state.form.organization)}
              className="createOrganizationBtn"
            >
              <FormattedMessage id="organization.create" defaultMessage="Create organization" />
            </Button>
          </Fragment>
        )}

        {host && (
          <Flex justifyContent="space-between" alignItems="flex-end">
            <Box>
              <Button bsStyle="primary" type="submit" onClick={() => this.props.onSubmit(host)}>
                <FormattedMessage id="host.link" defaultMessage="Use this host" />
              </Button>
            </Box>
            {!stripeAccount && (
              <Box textAlign="right">
                <EditConnectedAccount collective={host} service="stripe" />
              </Box>
            )}
          </Flex>
        )}
      </div>
    );
  }
}

export default withRouter(injectIntl(CreateHostForm));
