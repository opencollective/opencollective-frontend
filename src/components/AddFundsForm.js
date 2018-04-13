import React from 'react';
import PropTypes from 'prop-types';
import InputField from '../components/InputField';
import AddFundsSourcePicker from '../components/AddFundsSourcePicker';
import { Button, Row, Col, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import { isValidEmail } from '../lib/utils';
import withIntl from '../lib/withIntl';
import * as api from '../lib/api';
import { getCurrencySymbol, formatCurrency } from '../lib/utils';
import { get } from 'lodash';

class AddFundsForm extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    host: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool
  }

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = {
      form: { totalAmount: 0, hostFeePercent: get(props, 'collective.hostFeePercent') },
      result: {}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.messages = defineMessages({
      'api.error.unreachable': { id: 'api.error.unreachable', defaultMessage: "Can't reach the API. Please try again in a few." },
      'totalAmount.label': { id: 'addfunds.amount.label', defaultMessage: 'amount' },
      'description.label': { id: 'addfunds.description.label', defaultMessage: 'description' },
      'FromCollectiveId.label': { id: 'addfunds.FromCollectiveId.label', defaultMessage: 'source' },
      'hostFeePercent.label': { id: 'addfunds.hostFeePercent.label', defaultMessage: 'Host fee' },
      'platformFeePercent.label': { id: 'addfunds.platformFeePercent.label', defaultMessage: 'Platform fee' },
      'name.label': { id: 'user.name.label', defaultMessage: 'name' },
      'email.label': { id: 'user.email.label', defaultMessage: 'email' },
      'organization.label': { id: 'addfunds.organization.label', defaultMessage: 'organization' },
      'website.label': { id: 'user.website.label', defaultMessage: 'website' }
    });

    const getOptions = (arr, vars) => {
      return arr.map(key => {
        const obj = {};
        obj[key] = intl.formatMessage(this.messages[key], vars);
        return obj;
      })
    }

    this.fields = [
      {
        name: 'totalAmount',
        type: 'currency',
        pre: getCurrencySymbol(props.collective.currency),
        focus: true
      },
      {
        name: 'description'
      },
      {
        name: "FromCollectiveId",
        type: "component",
        component: AddFundsSourcePicker,
        options: {
          collective: this.props.collective,
          host: this.props.host
        }
      },
      {
        name: 'name',
        when: (form) => form.FromCollectiveId === 'other'
      },
      {
        name: 'email',
        when: (form) => form.FromCollectiveId === 'other'
      },
      {
        name: 'organization',
        when: (form) => form.FromCollectiveId === 'other'
      },
      {
        name: 'website',
        when: (form) => form.FromCollectiveId === 'other'
      },
      {
        name: "hostFeePercent",
        type: 'number',
        className: 'right',
        post: '%'
      },
      {
        name: "platformFeePercent",
        type: 'number',
        post: '%',
        when: () => this.props.LoggedInUser && this.props.LoggedInUser.isRoot()
      }
    ]

    this.fields = this.fields.map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      return field;
    })
  }

  handleChange(obj, attr, value) {
    const { intl, host } = this.props;

    const newState = { ... this.state };
    if (value !== undefined) {
      newState[obj][attr] = value;
    } else {
      newState[obj] = Object.assign({}, this.state[obj], attr);
    }

    if (attr === 'FromCollectiveId') {
      if (value !== host.id) {
        newState[obj].hostFeePercent = this.props.collective.hostFeePercent;
      } else {
        newState[obj].hostFeePercent = 0;
      }
    }

    this.setState(newState);
    if (typeof window !== "undefined") {
      window.state = newState;
    }
  }

  handleSubmit(e) {
    e && e.preventDefault();
    this.props.onSubmit(this.state.form);
    return false;
  }

  render() {
    const { intl, loading } = this.props;
    const hostFeePercent = this.state.form.hostFeePercent || 0;
    const platformFeePercent = this.state.form.platformFeePercent || 0;
    return (
      <div className="AddFundsForm">
        <style jsx>{`
        h2 {
          margin: 3rem 0 3rem 0;
          font-size: 2rem;
        }
        .AddFundsForm {
          max-width: 700px;
          margin: 0 auto;
        }
        .userDetailsForm {
          overflow: hidden;
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
        :global(.col-sm-12) {
          width: 100%;
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
        `}</style>
        <style jsx global>{`
        .AddFundsForm .actions .btn {
          margin-right: 0.5rem;
        }
        `}</style>
        <div>
          <Form horizontal onSubmit={this.handleSubmit}>
            <div className="userDetailsForm">
              <h2><FormattedMessage id="addfunds.title" defaultMessage="Add Funds to {collective}" values={{ collective: this.props.collective.name }} /></h2>
                { this.fields.map(field => (!field.when || field.when(this.state.form)) && (
                  <Row key={`${field.name}.input`}>
                    <Col sm={12}>
                      <InputField
                        {...field}
                        className={`horizontal ${field.className}`}
                        defaultValue={this.state.form[field.name]}
                        onChange={(value) => this.handleChange("form", field.name, value)}
                        />
                    </Col>
                  </Row>
                ))}
                <Row>
                  <Col sm={12}>
                    <div className="form-group">
                      <label className="col-sm-3 control-label"><FormattedMessage id="addfunds.details" defaultMessage="Details" /></label>
                      <Col sm={9}>
                        <table className="details">
                          <tbody>
                            <tr>
                              <td><FormattedMessage id="addfunds.totalAmount" defaultMessage="Funding amount" /></td>
                              <td className="amount">{formatCurrency(this.state.form.totalAmount, this.props.collective.currency, { precision: 2 })}</td>
                            </tr>
                            <tr>
                              <td><FormattedMessage id="addfunds.hostFees" defaultMessage="Host fees ({hostFees})" values={{ hostFees: `${hostFeePercent}%` }} /></td>
                              <td className="amount">{formatCurrency(hostFeePercent/100 * this.state.form.totalAmount, this.props.collective.currency, { precision: 2 })}</td>
                            </tr>
                            { platformFeePercent > 0 &&
                              <tr>
                                <td><FormattedMessage id="addfunds.platformFees" defaultMessage="Platform fees ({platformFees})" values={{ platformFees: `${platformFeePercent}%` }} /></td>
                                <td className="amount">{formatCurrency(platformFeePercent/100 * this.state.form.totalAmount, this.props.collective.currency, { precision: 2 })}</td>
                              </tr>
                            }
                            <tr>
                              <td colSpan={2}><hr size={1} /></td>
                            </tr>
                            <tr>
                              <td><FormattedMessage id="addfunds.netAmount" defaultMessage="Net amount" /></td>
                              <td className="amount">{formatCurrency(this.state.form.totalAmount * (1 - (hostFeePercent + platformFeePercent)/100), this.props.collective.currency, { precision: 2 })}</td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="disclaimer">
                          <FormattedMessage id="addfunds.disclaimer" defaultMessage="By clicking below, you agree to set aside {amount} in your bank account on behalf of the collective" values={{amount: formatCurrency(this.state.form.totalAmount, this.props.collective.currency)}} />
                        </div>
                      </Col>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col sm={3}></Col>
                  <Col sm={9} className="actions">
                    <Button bsStyle="primary" onClick={() => this.handleSubmit()} disabled={loading}>
                      { loading && <FormattedMessage id="form.processing" defaultMessage="processing" /> }
                      { !loading && <FormattedMessage id="addfunds.submit" defaultMessage="Add Funds" /> }
                    </Button>
                    <Button bsStyle="default" onClick={() => this.props.onCancel()}>
                      <FormattedMessage id="form.cancel" defaultMessage="cancel" />
                    </Button>
                  </Col>
                </Row>
          </div>
          <div className="result">
            {this.state.result.success &&
              <div className="success">
                {this.state.result.success}
              </div>
            }
            { this.state.result.error &&
              <div className="error">
                {this.state.result.error}
              </div>
            }
          </div>
        </Form>
        </div>
      </div>
    )
  }
}

export default withIntl(AddFundsForm);
