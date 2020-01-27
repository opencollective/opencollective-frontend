import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import EditConnectedAccount from './EditConnectedAccount';
import { groupBy } from 'lodash';
import InputField from './InputField';
import colors from '../lib/constants/colors';
import { Flex, Box } from '@rebass/grid';
import CreateOrganizationForm from './CreateOrganizationForm';
import { Button } from 'react-bootstrap';
import styled from 'styled-components';

const ConnectStripeBox = styled(Box)`
  text-align: right;
`;

class CreateHostForm extends React.Component {
  static propTypes = {
    organizations: PropTypes.arrayOf(PropTypes.object).isRequired,
    collective: PropTypes.object.isRequired,
    userCollective: PropTypes.object.isRequired,
    createOrganization: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired, // when selecting the host to use
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const { intl, userCollective } = props;
    this.handleChange = this.handleChange.bind(this);
    this.createOrganization = this.createOrganization.bind(this);
    this.generateInputFields = this.generateInputFields.bind(this);

    this.state = {
      form: { hostType: 'user', HostCollectiveId: userCollective.id },
      services: ['stripe'],
      organizationsOptions: [],
    };

    this.messages = defineMessages({
      'collective.connectedAccounts.stripe.button': {
        id: 'collective.connectedAccounts.stripe.button',
        defaultMessage: 'Connect Stripe',
      },
      'collective.connectedAccounts.stripe.description': {
        id: 'collective.connectedAccounts.stripe.description',
        defaultMessage: 'Connect a Stripe account to start accepting donations',
      },
      'hostType.label': {
        id: 'host.types.label',
        defaultMessage: 'Type of host entity',
      },
      'HostCollectiveId.label': {
        id: 'host.HostCollectiveId.label',
        defaultMessage: 'Select an organization',
      },
      'host.types.user.label': {
        id: 'host.types.user.label',
        defaultMessage: 'an individual',
      },
      'host.types.user.description': {
        id: 'host.types.user.description',
        defaultMessage:
          "You will receive the funds on behalf of the collective under your own name. Please check with your local fiscal authorities the allowance below which you don't have to report the donations as taxable income.",
      },
      'host.types.organization.label': {
        id: 'host.types.organization.label',
        defaultMessage: 'an organization',
      },
      'host.types.organization.description': {
        id: 'host.types.organization.description',
        defaultMessage:
          'Legal entity (ideally a non profit organization) that will receive the funds and issue invoices on behalf of the collective. Recommended if you plan to host more than one collective or if your collective expects to collect more than $10,000/year.',
      },
      'organization.create': {
        id: 'tier.order.organization.create',
        defaultMessage: 'create an organization',
      },
    });

    this.hostTypesOptions = [
      {
        label: intl.formatMessage(this.messages['host.types.user.label']),
        value: 'user',
        description: intl.formatMessage(this.messages['host.types.user.description']),
      },
      {
        label: intl.formatMessage(this.messages['host.types.organization.label']),
        value: 'organization',
        description: intl.formatMessage(this.messages['host.types.organization.description']),
      },
    ];
  }

  static getDerivedStateFromProps(newProps) {
    const { intl } = newProps;
    const organizationsOptions = [];
    newProps.organizations.map(collective => {
      organizationsOptions.push({
        label: collective.name,
        value: collective.id,
      });
    });
    organizationsOptions.push({
      label: intl.formatMessage({
        id: 'organization.create',
        defaultMessage: 'create an organization',
      }),
      value: 0,
    });
    return { organizationsOptions };
  }

  async createOrganization(org) {
    const collective = await this.props.createOrganization(org);
    this.setState({
      hostCollective: collective,
      form: {
        ...this.state.form,
        HostCollectiveId: collective.id,
      },
      status: 'idle',
      result: { success: 'Organization created successfully' },
    });
  }

  handleChange(attr, value) {
    const { form } = this.state;
    form[attr] = value;
    if (attr === 'hostType') {
      const defaultHostCollectiveId = {
        user: this.props.userCollective.id,
        organization: this.state.organizationsOptions[0].value,
      };
      form['HostCollectiveId'] = defaultHostCollectiveId[value];
    }
    this.setState({ form });
  }

  generateInputFields() {
    const { intl } = this.props;

    this.fields = [
      {
        name: 'hostType',
        type: 'select',
        options: this.hostTypesOptions,
        focus: true,
      },
      {
        name: 'HostCollectiveId',
        type: 'select',
        options: this.state.organizationsOptions,
        value: this.state.form.HostCollectiveId,
        defaultValue: this.state.organizationsOptions[0] && this.state.organizationsOptions[0].value,
        when: form => form.hostType === 'organization',
      },
    ];
    this.fields = this.fields.map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      if (field.defaultValue && !this.state.form[field.name]) {
        this.setState({
          form: { ...this.state.form, [field.name]: field.defaultValue },
        });
      }
      return field;
    });
  }

  render() {
    const { userCollective, organizations } = this.props;

    this.generateInputFields();
    const hostCollective =
      this.state.hostCollective ||
      (this.state.form.hostType === 'user'
        ? userCollective
        : organizations.find(c => c.id === Number(this.state.form.HostCollectiveId)));

    const connectedAccounts = hostCollective && groupBy(hostCollective.connectedAccounts, 'service');
    const stripeAccount = connectedAccounts && connectedAccounts['stripe'] && connectedAccounts['stripe'][0];

    return (
      <div className="CreateHostForm">
        <style jsx>
          {`
            .hostTypeSelection {
              display: flex;
              justify-content: space-around;
            }
            .hostType {
              width: 400px;
              margin: 2rem;
              padding: 2rem;
              color: white;
              border-radius: 1rem;
              background: ${colors.blue};
            }
            .hostType h2 {
              font-weight: bold;
            }
          `}
        </style>

        {this.fields.map(
          field =>
            (!field.when || field.when(this.state.form)) && (
              <Flex key={`${field.name}.input`}>
                <Box width={1}>
                  <InputField
                    {...field}
                    className={field.className}
                    defaultValue={this.state.form[field.name]}
                    onChange={value => this.handleChange(field.name, value)}
                  />
                </Box>
              </Flex>
            ),
        )}

        {this.state.form.hostType === 'organization' && !hostCollective && (
          <div>
            <CreateOrganizationForm header={false} onChange={org => this.handleChange('organization', org)} />
            <Button
              bsStyle="primary"
              type="submit"
              onClick={() => this.createOrganization(this.state.form.organization)}
              className="createOrganizationBtn"
            >
              <FormattedMessage id="organization.create" defaultMessage="Create organization" />
            </Button>
          </div>
        )}

        {hostCollective && (
          <Flex justifyContent="space-between" alignItems="flex-end">
            <Box>
              <Button bsStyle="primary" type="submit" onClick={() => this.props.onSubmit(hostCollective)}>
                <FormattedMessage id="host.link" defaultMessage="Use this host" />
              </Button>
            </Box>
            {!stripeAccount && (
              <ConnectStripeBox key={`connect-${'stripe'}`}>
                <EditConnectedAccount collective={hostCollective} service="stripe" />
              </ConnectStripeBox>
            )}
          </Flex>
        )}
      </div>
    );
  }
}

export default injectIntl(CreateHostForm);
