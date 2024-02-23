import React from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { Times as RemoveIcon } from '@styled-icons/fa-solid/Times';
import { get, groupBy, isEmpty, truncate } from 'lodash';
import memoizeOne from 'memoize-one';
import type { IntlShape } from 'react-intl';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { AccountTypesWithHost } from '../../lib/constants/collectives';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { EMPTY_ARRAY } from '../../lib/constants/utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import i18nPayoutMethodType from '../../lib/i18n/payout-method-type';

import ConfirmationModal from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledRoundButton from '../StyledRoundButton';
import StyledSelect from '../StyledSelect';
import { Span } from '../Text';

import PayoutMethodData from './PayoutMethodData';
import PayoutMethodTypeWithIcon from './PayoutMethodTypeWithIcon';

const newPayoutMethodMsg = defineMessages({
  [PayoutMethodType.PAYPAL]: {
    id: 'PayoutMethod.New.PayPal',
    defaultMessage: 'New PayPal account',
  },
  [PayoutMethodType.BANK_ACCOUNT]: {
    id: 'PayoutMethod.New.BankAccount',
    defaultMessage: 'New bank account',
  },
  [PayoutMethodType.OTHER]: {
    id: 'PayoutMethod.New.Other',
    defaultMessage: 'New custom payout method',
  },
  _default: {
    id: 'PayoutMethod.New.default',
    defaultMessage: 'New {pmType}',
  },
});

const MAX_PAYOUT_OPTION_DATA_LENGTH = 20;

const payoutMethodLabels = defineMessages({
  accountBalance: {
    id: 'PayoutMethod.AccountBalance',
    defaultMessage: 'Open Collective (Account Balance)',
  },
  none: {
    id: 'PayoutMethod.None',
    defaultMessage: 'None',
  },
});

type PayoutMethodSelectProps = {
  /** @ignore from injectIntl */
  intl: IntlShape;
  /** @ignore from mutation */
  removePayoutMethod?: (object) => Promise<any>;
  /** Use this prop to control the component */
  payoutMethod?: {
    id: string | number;
    type: string;
  };
  /** The payout methods */
  payoutMethods?: {
    id: string | number;
    type?: string;
  }[];
  /** Default value */
  defaultPayoutMethod?: {
    id: string | number;
    type: string;
  };
  /** The Collective paying the expense */
  collective?: {
    host?: {
      id: string;
      connectedAccounts: any[];
      supportedPayoutMethods: any[];
      isTrustedHost: boolean;
    };
  };
  /** The Acccount being paid with the expense */
  payee?: {
    id: string;
    type: string;
    host?: {
      id: string;
    };
  };
  allowNull?: boolean;
  onChange: (object) => void;
  onRemove?: (object) => void;
};

/**
 * An overset of `StyledSelect` specialized for payout methods. Accepts all the props
 * from `StyledSelect`.
 */
class PayoutMethodSelect extends React.Component<PayoutMethodSelectProps> {
  state = { removingPayoutMethod: null };

  getPayoutMethodLabel = payoutMethod => {
    if (!payoutMethod) {
      return this.props.intl.formatMessage(payoutMethodLabels.none);
    } else if (payoutMethod.id) {
      if (payoutMethod.name) {
        return payoutMethod.name;
      } else if (payoutMethod.type === PayoutMethodType.ACCOUNT_BALANCE) {
        return this.props.intl.formatMessage(payoutMethodLabels.accountBalance);
      } else if (payoutMethod.type === PayoutMethodType.PAYPAL) {
        return `PayPal - ${get(payoutMethod.data, 'email')}`;
      } else if (payoutMethod.type === PayoutMethodType.BANK_ACCOUNT) {
        if (payoutMethod.data.details?.IBAN) {
          return `IBAN ${payoutMethod.data.details.IBAN}`;
        } else if (payoutMethod.data.details?.accountNumber) {
          return `A/N ${payoutMethod.data.details.accountNumber}`;
        } else if (payoutMethod.data.details?.clabe) {
          return `Clabe ${payoutMethod.data.details.clabe}`;
        } else if (payoutMethod.data.details?.bankgiroNumber) {
          return `BankGiro ${payoutMethod.data.details.bankgiroNumber}`;
        } else {
          return `${payoutMethod.data.accountHolderName} (${payoutMethod.data.currency})`;
        }
      } else if (payoutMethod.type === PayoutMethodType.OTHER) {
        const content = payoutMethod.data?.content?.replace(/\n|\t/g, ' ');
        const i18nType = i18nPayoutMethodType(this.props.intl, payoutMethod.type);
        return content ? `${i18nType} - ${truncate(content, { length: MAX_PAYOUT_OPTION_DATA_LENGTH })}` : i18nType;
      } else {
        return i18nPayoutMethodType(this.props.intl, payoutMethod.type);
      }
    } else {
      return (
        <React.Fragment>
          <Span fontWeight="bold" color="green.600" mr={1}>
            +
          </Span>
          &nbsp;
          {newPayoutMethodMsg[payoutMethod.type]
            ? this.props.intl.formatMessage(newPayoutMethodMsg[payoutMethod.type])
            : this.props.intl.formatMessage(newPayoutMethodMsg._default, { type: payoutMethod.type })}
        </React.Fragment>
      );
    }
  };

  getPayoutMethodTitle = pm => {
    if (pm.type === PayoutMethodType.OTHER && pm.data?.content?.length > MAX_PAYOUT_OPTION_DATA_LENGTH) {
      return pm.data.content;
    }
  };

  getDefaultData(payoutMethodType) {
    switch (payoutMethodType) {
      case PayoutMethodType.PAYPAL:
        return { email: '' };
      case PayoutMethodType.OTHER:
        return { content: '' };
      default:
        return {};
    }
  }

  async removePayoutMethod(payoutMethod) {
    await this.props.removePayoutMethod({ variables: { id: payoutMethod.id } });
    this.setState({ removingPayoutMethod: null });
    this.props.onRemove(payoutMethod);
    if (this.props.payoutMethod?.id === payoutMethod.id) {
      this.props.onChange({ value: null });
    }
  }

  formatOptionLabel = ({ value }, { context }) => {
    const isMenu = context === 'menu';

    const isDeletable =
      value?.isDeletable === undefined ? value?.type !== PayoutMethodType.ACCOUNT_BALANCE : value?.isDeletable;

    return (
      <Flex justifyContent="space-between" alignItems="center">
        <Span fontSize={isMenu ? '13px' : '14px'}>{this.getPayoutMethodLabel(value)}</Span>
        {isMenu && value?.id && isDeletable && this.props.onRemove && (
          <StyledRoundButton
            size={20}
            ml={2}
            type="button"
            flex="0 0 20px"
            buttonStyle="dangerSecondary"
            isBorderless
            onClick={e => {
              e.stopPropagation();
              this.setState({ removingPayoutMethod: value });
            }}
          >
            <RemoveIcon size={10} />
          </StyledRoundButton>
        )}
      </Flex>
    );
  };

  getOptionFromPayoutMethod = pm => ({
    value: pm,
    title: this.getPayoutMethodTitle(pm),
  });

  getOptions = memoizeOne((host, payoutMethods, payee) => {
    let payerHostSupportedPayoutMethods;
    if (host) {
      payerHostSupportedPayoutMethods = host.supportedPayoutMethods || EMPTY_ARRAY;
    } else {
      // For collectives without a host, we allow expenses to be submitted with the "Other"/"Custom" payout method
      // This is mostly for people trying out the platform
      payerHostSupportedPayoutMethods = [PayoutMethodType.OTHER, PayoutMethodType.BANK_ACCOUNT];
    }

    const payeeIsSelfHosted = payee && payee.id === payee.host?.id;
    const payeeIsCollectiveFamilyType = payee && AccountTypesWithHost.includes(payee.type);
    const payeeIsSameHost = payee && host && payee.host?.id === host.id;

    let pmTypes;

    if (payeeIsSameHost) {
      pmTypes = [PayoutMethodType.ACCOUNT_BALANCE];
    } else {
      pmTypes = payerHostSupportedPayoutMethods
        // Credit Card (Virtual Card) is generally not a Payout Method acceptable on the Frontend
        .filter(type => type !== PayoutMethodType.CREDIT_CARD)
        // Account Balance is not possible on different Hosts
        .filter(type => type !== PayoutMethodType.ACCOUNT_BALANCE);
      // Other not available for regular Collectives, Funds, Projects, Events
      if (payeeIsCollectiveFamilyType && !payeeIsSelfHosted) {
        pmTypes = pmTypes.filter(type => type !== PayoutMethodType.OTHER);
      }
    }

    // No "New" Payout Methods for Collectives unless Self Hosted
    // TODO: maybe we should not filter when the loggedInAccount is an admin of the payee's host
    const creatablePmTypes =
      payeeIsCollectiveFamilyType && !payeeIsSelfHosted
        ? []
        : pmTypes.filter(pmType => pmType !== PayoutMethodType.ACCOUNT_BALANCE);

    const groupedPms = groupBy(payoutMethods, 'type');

    const categorized = pmTypes.map(pmType => ({
      label: i18nPayoutMethodType(this.props.intl, pmType),
      options: [
        // Add existing payout methods for this type
        ...get(groupedPms, pmType, []).map(this.getOptionFromPayoutMethod),
        // Add "+ Create new ..." for this payment type
        creatablePmTypes.includes(pmType)
          ? this.getOptionFromPayoutMethod({
              type: pmType,
              isSaved: true,
              data: this.getDefaultData(pmType),
            })
          : null,
      ].filter(option => option !== null),
    }));

    if (this.props.allowNull) {
      categorized.unshift({
        value: null,
      });
    }

    return categorized;
  });

  render() {
    const { payoutMethods, defaultPayoutMethod, payoutMethod, payee, collective, ...props } = this.props;

    const { removingPayoutMethod } = this.state;
    const value = !isEmpty(payoutMethod) && this.getOptionFromPayoutMethod(payoutMethod);

    const payeeIsCollectiveFamilyType = payee && AccountTypesWithHost.includes(payee.type);
    const payeeIsSameHost = payee && payee.host?.id === collective.host?.id;

    const styledSelectOptions = this.getOptions(collective.host, payoutMethods, payee);
    const hasSuitablePayoutMethodOption = styledSelectOptions.find(({ options }) => options?.length > 0) ? true : false;

    if (payeeIsCollectiveFamilyType && !payeeIsSameHost) {
      if (!collective?.host?.isTrustedHost) {
        return (
          <MessageBox type="error" mt={2} mb={3} fontSize="12px">
            <FormattedMessage defaultMessage="This Expense is between different Hosts but the Payer Host is not allowed for this yet." />
            &nbsp;
            <FormattedMessage defaultMessage="If it's an issue, contact the Host or Open Collective support." />
          </MessageBox>
        );
      }
      if (!hasSuitablePayoutMethodOption) {
        return (
          <MessageBox type="error" mt={2} mb={3} fontSize="12px">
            <FormattedMessage
              defaultMessage="This Expense is between different Hosts but the recipient Host doesn't have a suitable Payout Method available ({payoutMethodTypes})."
              values={{
                payoutMethodTypes: Object.values(styledSelectOptions)
                  .map(option => option['label'])
                  .join(', '),
              }}
            />
            &nbsp;
            <FormattedMessage defaultMessage="If it's an issue, contact the Host or Open Collective support." />
          </MessageBox>
        );
      }
    }

    return (
      <React.Fragment>
        {payeeIsCollectiveFamilyType && !payeeIsSameHost && (
          <MessageBox type="warning" mt={2} mb={3} fontSize="12px">
            <FormattedMessage defaultMessage="This Expense is between different Hosts. Pick a Payout Method from the recipient Host." />
          </MessageBox>
        )}

        <StyledSelect
          inputId="payout-method-select"
          data-cy="payout-method-select"
          {...props}
          options={styledSelectOptions}
          defaultValue={defaultPayoutMethod ? this.getOptionFromPayoutMethod(defaultPayoutMethod) : undefined}
          value={typeof value === 'undefined' ? undefined : value}
          formatOptionLabel={this.formatOptionLabel}
          isSearchable={false}
        />
        {removingPayoutMethod && (
          <ConfirmationModal
            isDanger
            type="remove"
            onClose={() => this.setState({ removingPayoutMethod: null })}
            continueHandler={() => this.removePayoutMethod(removingPayoutMethod)}
            header={<FormattedMessage id="PayoutMethod.RemoveWarning" defaultMessage="Remove this payout method?" />}
          >
            <Box mb={2}>
              <PayoutMethodTypeWithIcon type={removingPayoutMethod.type} />
            </Box>
            <PayoutMethodData payoutMethod={removingPayoutMethod} />
          </ConfirmationModal>
        )}
      </React.Fragment>
    );
  }
}

const removePayoutMethodMutation = gql`
  mutation RemovePayoutMethod($id: String!) {
    removePayoutMethod(payoutMethodId: $id) {
      id
      isSaved
    }
  }
`;

const addRemovePayoutMethodMutation = graphql<PayoutMethodSelectProps>(removePayoutMethodMutation, {
  name: 'removePayoutMethod',
  options: { context: API_V2_CONTEXT },
});

export default React.memo(injectIntl(addRemovePayoutMethodMutation(PayoutMethodSelect)));
