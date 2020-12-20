import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { withApollo } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { Col, Row } from 'react-bootstrap';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { OC_FEE_PERCENT } from '../lib/constants/transactions';
import { formatCurrency, getCurrencySymbol } from '../lib/currency-utils';

import { AddFundsSourcePickerForUserWithData } from './AddFundsSourcePicker';
import InputField from './InputField';
import StyledButton from './StyledButton';

const addFundsHostQuery = gql`
  query AddFundsHost($CollectiveId: Int) {
    Collective(id: $CollectiveId) {
      id
      hostFeePercent
    }
  }
`;

class AddFundsForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    host: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    client: PropTypes.object,
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = {
      form: {
        totalAmount: 0,
        hostFeePercent: get(props, 'collective.hostFeePercent'),
      },
      result: {},
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.messages = defineMessages({
      'api.error.unreachable': {
        id: 'api.error.unreachable',
        defaultMessage: "Can't reach the API. Please try again in a few.",
      },
      'totalAmount.label': {
        id: 'Fields.amount',
        defaultMessage: 'Amount',
      },
      'description.label': {
        id: 'Fields.description',
        defaultMessage: 'Description',
      },
      'FromCollectiveId.label': {
        id: 'addfunds.FromCollectiveId.label',
        defaultMessage: 'source',
      },
      'FromCollectiveId.addfundstoorg.label': {
        id: 'Member.Role.HOST',
        defaultMessage: 'Host',
      },
      'hostFeePercent.label': {
        id: 'HostFee',
        defaultMessage: 'Host fee',
      },
      'platformFeePercent.label': {
        id: 'PlatformFee',
        defaultMessage: 'Platform fee',
      },
      'name.label': { id: 'Fields.name', defaultMessage: 'Name' },
      'email.label': { id: 'Email', defaultMessage: 'Email' },
      'organization.label': {
        id: 'addfunds.organization.label',
        defaultMessage: 'organization',
      },
      'website.label': { id: 'Fields.website', defaultMessage: 'Website' },
    });

    this.totalAmountField = {
      name: 'totalAmount',
      type: 'currency',
      focus: true,
      pre: getCurrencySymbol(props.collective.currency),
    };

    this.fields = [
      this.totalAmountField,
      {
        name: 'description',
      },
      {
        name: 'FromCollectiveId',
        type: 'component',
        component: AddFundsSourcePickerForUserWithData,
        labelName: 'FromCollectiveId.addfundstoorg.label',
        options: {
          LoggedInUser: this.props.LoggedInUser,
        },
      },
    ];

    this.fields = this.fields.map(field => {
      const label = this.messages[field.labelName || `${field.name}.label`];
      if (label) {
        field.label = intl.formatMessage(label);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      return field;
    });
  }

  retrieveHostFeePercent = async CollectiveId => {
    try {
      const result = await this.props.client.query({
        query: addFundsHostQuery,
        variables: { CollectiveId },
      });
      const { hostFeePercent } = result.data.Collective;
      return hostFeePercent;
    } catch (error) {
      // TODO: this should be reported to the user
      console.error(error);
    }
  };

  handleChange = async (obj, attr, value) => {
    const { host } = this.props;

    const newState = { ...this.state };

    if (value !== undefined) {
      newState[obj][attr] = value;
    } else {
      newState[obj] = Object.assign({}, this.state[obj], attr);
    }

    if (attr === 'FromCollectiveId') {
      value = Number(value);
      if (host && value !== host.id) {
        newState[obj].hostFeePercent = this.props.collective.hostFeePercent;
      } else {
        /* We don't have the host object if we're adding funds to
           orgs. The attr props.collective contains the organization
           receiving funds and the right host must be pulled from
           GraphQL when the user chooses an option in the combo. */
        newState[obj].hostFeePercent = await this.retrieveHostFeePercent(value);
      }
    }

    this.setState(newState);
  };

  handleSubmit() {
    this.props.onSubmit(this.state.form);
    return false;
  }

  getPlatformFee() {
    if (this.state.form.platformFeePercent !== undefined) {
      return this.state.form.platformFeePercent;
    } else if (this.props.collective.type === CollectiveType.ORGANIZATION) {
      return OC_FEE_PERCENT;
    } else {
      return 0;
    }
  }

  render() {
    const { loading } = this.props;
    const hostFeePercent = this.state.form.hostFeePercent || 0;
    const platformFeePercent = this.getPlatformFee();

    const hostFeeAmount = formatCurrency(
      Math.round((hostFeePercent / 100) * this.state.form.totalAmount),
      this.props.collective.currency,
      { precision: 2 },
    );
    const platformFeeAmount = formatCurrency(
      Math.round((platformFeePercent / 100) * this.state.form.totalAmount),
      this.props.collective.currency,
      { precision: 2 },
    );
    const netAmount = formatCurrency(
      Math.round(this.state.form.totalAmount * (1 - (hostFeePercent + platformFeePercent) / 100)),
      this.props.collective.currency,
      { precision: 2 },
    );

    /* We don't need to show these details if there are no amounts
       present yet */
    const showAddFundsToOrgDetails = this.state.form.totalAmount > 0 && (hostFeePercent > 0 || platformFeePercent > 0);

    // recompute this value based on new props
    this.totalAmountField.pre = getCurrencySymbol(this.props.collective.currency);

    return (
      <div className="AddFundsForm">
        <style jsx>
          {`
            h2 {
              margin: 3rem 0 3rem 0;
              font-size: 2rem;
            }
            .AddFundsForm {
              max-width: 700px;
              margin: 0 auto;
            }
            .paymentDetails {
              overflow: hidden;
            }
            .AddFundsForm :global(.tier) {
              margin: 0 0 1rem 0;
            }
            label {
              max-width: 100%;
              padding-right: 1rem;
            }
            .result {
              margin-top: 3rem;
            }
            .result div {
              width: 100%;
            }
            .error {
              color: red;
              font-weight: bold;
            }
            .value {
              padding-top: 7px;
              display: inline-block;
            }
            .details {
              margin: 0.5rem 0 1rem 0;
              width: 100%;
            }
            hr {
              margin: 0.5rem 0;
              color: black;
            }
            td.amount {
              text-align: right;
            }
            .disclaimer {
              font-size: 1.2rem;
            }
            .note {
              padding: 8px 0;
            }
          `}
        </style>
        <style jsx global>
          {`
            .AddFundsForm .actions .btn {
              margin-right: 0.5rem;
            }
          `}
        </style>
        <form onSubmit={e => e.preventDefault()}>
          <h2>
            <FormattedMessage
              id="addPrepaidBudget.title"
              defaultMessage="Add Prepaid Budget to {collective}"
              values={{ collective: this.props.collective.name }}
            />
          </h2>
          {this.fields.map(
            field =>
              (!field.when || field.when(this.state.form)) && (
                <Row key={`${field.name}.input`}>
                  <Col sm={12}>
                    <InputField
                      {...field}
                      className={`horizontal ${field.className}`}
                      defaultValue={this.state.form[field.name]}
                      onChange={value => this.handleChange('form', field.name, value)}
                    />
                  </Col>
                </Row>
              ),
          )}
          <Row>
            <Col sm={12}>
              <div className="form-group">
                <label className="col-sm-2 control-label inputField">
                  <FormattedMessage id="Details" defaultMessage="Details" />
                </label>
                <Col sm={10}>
                  <table className="details">
                    <tbody>
                      <tr>
                        <td>
                          <FormattedMessage id="addfunds.totalAmount" defaultMessage="Funding amount" />
                        </td>
                        <td className="amount">
                          {formatCurrency(this.state.form.totalAmount, this.props.collective.currency, {
                            precision: 2,
                          })}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FormattedMessage
                            id="addfunds.hostFees"
                            defaultMessage="Host fees ({hostFees})"
                            values={{ hostFees: `${hostFeePercent}%` }}
                          />
                        </td>
                        <td className="amount">{hostFeeAmount}</td>
                      </tr>
                      <tr>
                        <td>
                          <FormattedMessage
                            id="addfunds.platformFees"
                            defaultMessage="Platform fees ({platformFees})"
                            values={{
                              platformFees: `${platformFeePercent}%`,
                            }}
                          />
                        </td>
                        <td className="amount">{platformFeeAmount}</td>
                      </tr>

                      <tr>
                        <td colSpan={2}>
                          <hr size={1} />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FormattedMessage id="addfunds.netAmount" defaultMessage="Net amount" />
                        </td>
                        <td className="amount">{netAmount}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div>
                    {showAddFundsToOrgDetails && (
                      <div className="note">
                        <FormattedMessage
                          id="AddFundsForm.PutAside"
                          defaultMessage="Please put aside {hostFeePercent}% ({hostFeeAmount}) for your host fees and {platformFeePercent}% ({platformFeeAmount}) for platform fees."
                          values={{ hostFeePercent, hostFeeAmount, platformFeePercent, platformFeeAmount }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="disclaimer">
                    {this.props.host && (
                      <FormattedMessage
                        id="addfunds.disclaimer"
                        defaultMessage="By clicking below, you agree to set aside {amount} in your bank account on behalf of the collective"
                        values={{
                          amount: formatCurrency(this.state.form.totalAmount, this.props.collective.currency),
                        }}
                      />
                    )}

                    {!this.props.host && (
                      <FormattedMessage
                        id="addfunds.disclaimerOrganization"
                        defaultMessage="By clicking below, you agree to create a pre-paid credit card with the amount of {amount} for this organization"
                        values={{
                          amount: formatCurrency(this.state.form.totalAmount, this.props.collective.currency),
                        }}
                      />
                    )}
                  </div>
                </Col>
              </div>
            </Col>
          </Row>
          <Row>
            <Col xsHidden md={2} />
            <Col xs={12} md={10} className="actions">
              <StyledButton buttonStyle="primary" onClick={this.handleSubmit} loading={loading}>
                {loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
                {!loading && <FormattedMessage id="menu.addPrepaidBudget" defaultMessage="Add Prepaid Budget" />}
              </StyledButton>
              <StyledButton m={2} onClick={this.props.onCancel}>
                <FormattedMessage id="form.cancel" defaultMessage="cancel" />
              </StyledButton>
            </Col>
          </Row>
        </form>
        <div className="result">
          {this.state.result.success && <div className="success">{this.state.result.success}</div>}
          {this.state.result.error && <div className="error">{this.state.result.error}</div>}
        </div>
      </div>
    );
  }
}

export default injectIntl(withApollo(AddFundsForm));
