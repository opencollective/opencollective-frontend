import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import EditConnectedAccount from './EditConnectedAccount';
import { groupBy, get } from 'lodash';
import { capitalize } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Loading from './Loading';
import InputField from './InputField';
import Link from './Link';
import colors from '../constants/colors';
import { Flex, Box } from 'grid-styled';

class CreateHostForm extends React.Component {

  static propTypes = {
    organizations: PropTypes.arrayOf(PropTypes.object).isRequired,
    collective: PropTypes.object.isRequired,
    userCollective: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    const { organizations, intl, userCollective } = props;
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      form: { hostType: "user", HostCollectiveId: userCollective.id },
      services: ['stripe'],
      editMode: props.editMode || false
    };

    this.messages = defineMessages({
      'collective.connectedAccounts.stripe.button': { id: 'collective.connectedAccounts.stripe.button', defaultMessage: 'Connect Stripe' },
      'collective.connectedAccounts.stripe.description': { id: 'collective.connectedAccounts.stripe.description', defaultMessage: 'Connect a Stripe account to start accepting donations' },
      'hostType.label': { id: 'host.types.label', defaultMessage: "Type of host entity"},
      'HostCollectiveId.label': { id: 'host.HostCollectiveId.label', defaultMessage: "Select an organization"},
      'host.types.user.label': { id: 'host.types.user.label', defaultMessage: "an individual" },
      'host.types.user.description': { id: 'host.types.user.description', defaultMessage: "ou will receive the funds on behalf of the collective under your own name. Please check with your local fiscal authorities the allowance below which you don't have to report the donations as taxable income." },
      'host.types.organization.label': { id: 'host.types.organization.label', defaultMessage: "an organization" },
      'host.types.organization.description': { id: 'host.types.organization.description', defaultMessage: "Legal entity (ideally a non profit organization) that will receive the funds and issue invoices on behalf of the collective. Recommended if you plan to host more than one collective or if your collective expects to collect more than $10,000/year." }
    });

    this.hostTypesOptions = [
      {
        label: intl.formatMessage(this.messages['host.types.user.label']),
        value: 'user',
        description: intl.formatMessage(this.messages['host.types.user.description'])
      },
      {
        label: intl.formatMessage(this.messages['host.types.organization.label']),
        value: 'organization',
        description: intl.formatMessage(this.messages['host.types.organization.description'])
      }
    ]

    this.organizationsOptions = [];
    organizations.map(collective => {
      this.organizationsOptions.push({ label: collective.name, value: collective.id })
    })
    this.connectedAccounts = groupBy(userCollective.connectedAccounts, 'service');

    console.log(">>> this.organizationsOptions", this.organizationsOptions);

    this.fields = [
      {
        name: 'hostType',
        type: 'select',
        options: this.hostTypesOptions,
        focus: true
      },
      {
        name: "HostCollectiveId",
        type: "select",
        options: this.organizationsOptions,
        defaultValue: this.organizationsOptions[0].value,
        when: (form) => form.hostType === 'organization'
      }
    ];

    this.fields = this.fields.map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      if (field.defaultValue) {
        this.state.form[field.name] = field.defaultValue;
      }
      return field;
    })

  }

  handleChange(attr, value) {
    const { form } = this.state;
    form[attr] = value;
    this.setState({ form });
  }

  render() {
    const { collective, userCollective, organizations, intl } = this.props;

    const hostCollective = this.state.form.hostType === 'user' ? userCollective : organizations.find(c => c.id === Number(this.state.form.HostCollectiveId));
    console.log(">>> this.state.form", this.state.form, "hostCollective", hostCollective);

    const connectedAccounts = hostCollective && groupBy(hostCollective.connectedAccounts, 'service');

    return (
      <div className="CreateHostForm">
        <style jsx>{`
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
        `}</style>

        { this.fields.map(field => (!field.when || field.when(this.state.form)) && (
          <Flex key={`${field.name}.input`}>
            <Box w={1}>
              <InputField
                {...field}
                className={field.className}
                defaultValue={this.state.form[field.name]}
                onChange={(value) => this.handleChange(field.name, value)}
                />
            </Box>
          </Flex>
        ))}

        { this.state.services.map(service =>
          ( <div key={`connect-${service}`}>
            <h2>{capitalize(service)}</h2>
            <EditConnectedAccount
              collective={hostCollective}
              service={service}
              options={ { postAction: `hostCollective:${collective.id}` }}
              connectedAccount={connectedAccounts[service] && connectedAccounts[service][0]}
              />
            </div>
          )
        ) }
      </div>
    );
  }

}

const getConnectedAccountsQuery = gql`
query Collective($slug: String!) {
  Collective(slug: $slug) {
    id
    isHost
    slug
    memberOf(role: "ADMIN", type: "ORGANIZATION") {
      id
      collective {
        id
        slug
        name
        isHost
        connectedAccounts {
          id
          service
          createdAt
          updatedAt
        }
      }
    }
    connectedAccounts {
      id
      service
      createdAt
      updatedAt
    }
  }
}
`;

export const addConnectedAccountsQuery = graphql(getConnectedAccountsQuery, {
  options(props) {
    return {
      variables: {
        slug: get(props, 'LoggedInUser.collective.slug')
      }
    }
  }
});
export default withIntl(addConnectedAccountsQuery(CreateHostForm));
