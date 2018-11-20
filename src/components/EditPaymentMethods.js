import React from 'react';
import PropTypes from 'prop-types';

import { Button } from 'react-bootstrap';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import EditPaymentMethod from './EditPaymentMethod';

class EditPaymentMethods extends React.Component {
  static propTypes = {
    paymentMethods: PropTypes.arrayOf(PropTypes.object).isRequired,
    collective: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.renderPaymentMethod = this.renderPaymentMethod.bind(this);
    this.addPaymentMethod = this.addPaymentMethod.bind(this);
    this.removePaymentMethod = this.removePaymentMethod.bind(this);
    this.editPaymentMethod = this.editPaymentMethod.bind(this);
    this.onChange = props.onChange.bind(this);

    this.defaultType = this.props.defaultType || 'TICKET';

    this.messages = defineMessages({
      'paymentMethods.add': {
        id: 'paymentMethods.add',
        defaultMessage: 'add another payment method',
      },
      'paymentMethods.remove': {
        id: 'paymentMethods.remove',
        defaultMessage: 'remove payment method',
      },
    });
  }

  /** Returns payment methods from props or a list with an empty entry if empty */
  loadPaymentMethodsFromProps(props) {
    return props.paymentMethods.length === 0 ? [{}] : props.paymentMethods;
  }

  editPaymentMethod(paymentMethodId, paymentMethod) {
    const paymentMethods = [...this.props.paymentMethods];

    const index = !paymentMethodId
      ? paymentMethods.findIndex(pm => !pm.id)
      : paymentMethods.findIndex(pm => pm.id === paymentMethodId);

    if (paymentMethod === null) {
      return this.removePaymentMethod(index);
    }

    paymentMethods[index] = { ...paymentMethods[index], ...paymentMethod };
    this.onChange({ paymentMethods });
  }

  addPaymentMethod(paymentMethod) {
    const newPm = paymentMethod || {};
    this.onChange({ paymentMethods: [...this.props.paymentMethods, newPm] });
  }

  removePaymentMethod(index) {
    let paymentMethods = this.props.paymentMethods;
    if (index < 0 || index > paymentMethods.length) return;
    paymentMethods = [
      ...paymentMethods.slice(0, index),
      ...paymentMethods.slice(index + 1),
    ];
    this.onChange({ paymentMethods });
  }

  renderPaymentMethod(paymentMethod) {
    const { collective } = this.props;
    const keyId = paymentMethod.id || 'new';
    return (
      <div className="paymentMethod" key={`paymentMethod-${keyId}`}>
        <EditPaymentMethod
          paymentMethod={paymentMethod}
          onChange={pm => this.editPaymentMethod(paymentMethod.id, pm)}
          editMode={paymentMethod.id ? false : true}
          monthlyLimitPerMember={collective.type === 'ORGANIZATION'}
          currency={collective.currency}
          slug={collective.slug}
        />
      </div>
    );
  }

  render() {
    const { intl, paymentMethods = [] } = this.props;
    const hasNewPaymentMethod = Boolean(
      this.props.paymentMethods.find(pm => !pm.id),
    );

    return (
      <div className="EditPaymentMethods">
        <style jsx>
          {`
            :global(.paymentMethodActions) {
              text-align: right;
              font-size: 1.3rem;
            }
            :global(.field) {
              margin: 1rem;
            }
            .editPaymentMethodsActions {
              text-align: right;
            }
            :global(.paymentMethod) {
              margin: 3rem 0;
            }
          `}
        </style>

        <div className="paymentMethods">
          {paymentMethods.map(this.renderPaymentMethod)}
        </div>
        {!hasNewPaymentMethod && (
          <div className="editPaymentMethodsActions">
            <Button bsStyle="primary" onClick={() => this.addPaymentMethod()}>
              {intl.formatMessage(this.messages['paymentMethods.add'])}
            </Button>
          </div>
        )}
      </div>
    );
  }
}

export default withIntl(EditPaymentMethods);
