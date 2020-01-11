import React from 'react';
import PropTypes from 'prop-types';
import { Row } from 'react-bootstrap';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { Link } from '../../server/pages';
import { getCurrencySymbol, capitalize } from '../../lib/utils';
import { paymentMethodLabelWithIcon } from '../../lib/payment_method_label';
import InputField from '../InputField';
import StyledButton from '../StyledButton';
import { Flex, Box } from '@rebass/grid';
import StyledLink from '../StyledLink';

class EditPaymentMethod extends React.Component {
  static propTypes = {
    paymentMethod: PropTypes.shape({
      service: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      monthlyLimitPerMember: PropTypes.number,
    }).isRequired,
    subscriptions: PropTypes.arrayOf(PropTypes.any).isRequired,
    onRemove: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    hasMonthlyLimitPerMember: PropTypes.bool,
    /** Indicates that the payment method is being updated on the backend. Shows spinner. */
    isSaving: PropTypes.bool,
    /** From injectIntl */
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const { paymentMethod } = props;

    this.state = { paymentMethod };
    this.removePaymentMethod = this.removePaymentMethod.bind(this);

    this.messages = defineMessages({
      'paymentMethod.edit': {
        id: 'paymentMethod.edit',
        defaultMessage: 'edit',
      },
      'paymentMethod.remove': {
        id: 'paymentMethod.remove',
        defaultMessage: 'remove',
      },
      'paymentMethod.editSubscriptions': {
        id: 'paymentMethod.editSubscriptions',
        defaultMessage: 'edit recurring financial contributions',
      },
      'paymentMethod.monthlyLimitPerMember.label': {
        id: 'paymentMethod.monthlyLimitPerMember.label',
        defaultMessage: 'Monthly limit per member',
      },
      'paymentMethod.monthlyLimitPerMember.description': {
        id: 'paymentMethod.monthlyLimitPerMember.description',
        defaultMessage:
          'Set a monthly limit to allow other team members of your Organization to use this credit card within that limit. If set to zero, only Organization admins will be able to use this card.',
      },
    });
  }

  removePaymentMethod() {
    this.props.onRemove(this.props.paymentMethod);
  }

  handleChange(obj) {
    this.setState(state => ({
      ...state,
      paymentMethod: {
        ...state.paymentMethod,
        ...obj,
        monthlyLimitPerMember: obj.monthlyLimitPerMember || null,
      },
    }));
  }

  save = () => {
    this.props.onSave(this.state.paymentMethod);
  };

  render() {
    const { intl, paymentMethod, currency, isSaving, subscriptions } = this.props;
    const { service, type } = paymentMethod;
    const hasSubscriptions = subscriptions && subscriptions.length > 0;
    const isStripeCreditCard = service === 'stripe' && type === 'creditcard';
    const canRemove = !hasSubscriptions && isStripeCreditCard;
    const saved = this.state.paymentMethod.monthlyLimitPerMember === paymentMethod.monthlyLimitPerMember;
    const hasActions = !saved || canRemove || hasSubscriptions;

    return (
      <div className="EditPaymentMethod">
        <style global jsx>
          {`
            .monthlyLimitPerMember input {
              width: 10rem !important;
            }
          `}
        </style>

        <Flex flexDirection={['column-reverse', null, 'row']}>
          <Flex alignItems="center" css={{ flexGrow: 1 }}>
            <Box as="label" className="control-label">
              <FormattedMessage
                id="paymentMethod.typeSelect"
                values={{ type }}
                defaultMessage="{type, select, virtualcard {Gift card} creditcard {Credit card} prepaid {Prepaid}}"
              />
            </Box>
            <Box>
              <div className="name col">{paymentMethodLabelWithIcon(intl, paymentMethod)}</div>
              {hasSubscriptions && (
                <div className="actions">
                  <FormattedMessage
                    id="paymentMethod.activeSubscriptions"
                    defaultMessage="{n} active {n, plural, one {recurring financial contribution} other {recurring financial contributions}}"
                    values={{ n: subscriptions.length }}
                  />
                </div>
              )}
            </Box>
          </Flex>
          {hasActions && (
            <Flex
              mb={[3, 2, 0]}
              justifyContent={['center', null, 'flex-end']}
              alignItems={['center', null, 'flex-start']}
              css={{ minWidth: 230 }}
            >
              {!saved && (
                <StyledButton
                  loading={isSaving}
                  disabled={isSaving}
                  buttonStyle="primary"
                  buttonSize="medium"
                  onClick={this.save}
                  mx={1}
                >
                  <FormattedMessage id="save" defaultMessage="Save" />
                </StyledButton>
              )}
              {hasSubscriptions && (
                <Link route="subscriptions" params={{ collectiveSlug: this.props.collectiveSlug }} passHref>
                  <StyledLink buttonStyle="standard" buttonSize="medium" mx={1} disabled={isSaving}>
                    {intl.formatMessage(this.messages['paymentMethod.editSubscriptions'])}
                  </StyledLink>
                </Link>
              )}
              {canRemove && (
                <div className="actions">
                  <StyledButton
                    disabled={isSaving}
                    buttonStyle="standard"
                    buttonSize="medium"
                    onClick={() => this.removePaymentMethod()}
                    mx={1}
                  >
                    {intl.formatMessage(this.messages['paymentMethod.remove'])}
                  </StyledButton>
                </div>
              )}
            </Flex>
          )}
        </Flex>

        {this.props.hasMonthlyLimitPerMember && (
          <Row>
            <InputField
              className="horizontal"
              label={capitalize(intl.formatMessage(this.messages['paymentMethod.monthlyLimitPerMember.label']))}
              type="currency"
              name="monthlyLimitPerMember"
              pre={getCurrencySymbol(currency)}
              value={paymentMethod.monthlyLimitPerMember}
              description={intl.formatMessage(this.messages['paymentMethod.monthlyLimitPerMember.description'])}
              onChange={value => this.handleChange({ monthlyLimitPerMember: value })}
              disabled={isSaving}
              options={{ step: 1 }}
            />
          </Row>
        )}
      </div>
    );
  }
}

export default injectIntl(EditPaymentMethod);
