import React from 'react';
import PropTypes from 'prop-types';

import { Button, Form } from 'react-bootstrap';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import { get } from 'lodash';
import EditPaymentMethod from '../components/EditPaymentMethod';

class EditPaymentMethods extends React.Component {

  static propTypes = {
    paymentMethods: PropTypes.arrayOf(PropTypes.object).isRequired,
    collective: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = {};
    this.state.paymentMethods = (props.paymentMethods.length === 0) ? [{}] : props.paymentMethods;
    this.renderPaymentMethod = this.renderPaymentMethod.bind(this);
    this.addPaymentMethod = this.addPaymentMethod.bind(this);
    this.removePaymentMethod = this.removePaymentMethod.bind(this);
    this.editPaymentMethod = this.editPaymentMethod.bind(this);
    this.onChange = props.onChange.bind(this);

    this.defaultType = this.props.defaultType || 'TICKET';

    this.messages = defineMessages({
      'paymentMethods.add': { id: 'paymentMethods.add', defaultMessage: 'add another payment method' },
      'paymentMethods.remove': { id: 'paymentMethods.remove', defaultMessage: 'remove payment method' },
    });

  }

  editPaymentMethod(index, obj) {
    if (obj === null) return this.removePaymentMethod(index);
    const paymentMethods = [...this.state.paymentMethods];
    paymentMethods[index] = { ... paymentMethods[index], ...obj };
    this.setState({paymentMethods});
    this.onChange({paymentMethods});
  }

  addPaymentMethod(paymentMethod) {
    const paymentMethods = [...this.state.paymentMethods];
    paymentMethods.push(paymentMethod || {});
    this.setState({paymentMethods});
  }

  removePaymentMethod(index) {
    let paymentMethods = this.state.paymentMethods;
    if (index < 0 || index > paymentMethods.length) return;
    paymentMethods = [...paymentMethods.slice(0, index), ...paymentMethods.slice(index+1)];
    this.setState({paymentMethods});
    this.onChange({paymentMethods});
  }

  renderPaymentMethod(paymentMethod, index) {
    const { intl, collective } = this.props;
    return (
      <div className="paymentMethod" key={`paymentMethod-${index}`}>
        <EditPaymentMethod
          paymentMethod={paymentMethod}
          onChange={(pm) => this.editPaymentMethod(index, pm)}
          editMode={paymentMethod.id ? false : true}
          monthlyLimitPerMember={collective.type === 'ORGANIZATION'}
          currency={collective.currency}
          slug={collective.slug}
          />
      </div>
    );
  }

  render() {
    const { intl } = this.props;
    const hasNewPaymentMethod = Boolean(this.state.paymentMethods.find(pm => !pm.id));

    return (
      <div className="EditPaymentMethods">
        <style jsx>{`
          :global(.paymentMethodActions) {
            text-align: right;
            font-size: 1.3rem;
          }
          :global(.field) {
            margin: 1rem;
          }
          .editPaymentMethodsActions {
            text-align: right;
            margin-top: -1rem;
          }
          :global(.paymentMethod) {
            margin: 3rem 0;
          }
        `}</style>

        <div className="paymentMethods">
          <h2>{this.props.title}</h2>
          {this.state.paymentMethods.map(this.renderPaymentMethod)}
        </div>
        { !hasNewPaymentMethod &&
          <div className="editPaymentMethodsActions">
            <Button bsStyle="primary" onClick={() => this.addPaymentMethod({})}>{intl.formatMessage(this.messages[`paymentMethods.add`])}</Button>
          </div>
        }

      </div>
    );
  }

}

export default withIntl(EditPaymentMethods);
