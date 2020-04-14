import { defineMessages } from 'react-intl';

export const TRANSFERWISE_ERROR = {
  'transferwise.error.insufficientfunds': 'transferwise.error.insufficientfunds',
  'transferwise.error.balance.payment-option-unavailable': 'transferwise.error.balance.payment-option-unavailable',
  'transferwise.error.notconnected': 'transferwise.error.notconnected',
  'transferwise.error.currencynotsupported': 'transferwise.error.currencynotsupported',
};

export const tranferwiseMsg = defineMessages({
  'transferwise.error.default': {
    id: 'transferwise.error.default',
    defaultMessage: 'An unknown error happened with TransferWise. Please contact support@opencollective.com.',
  },
  'transferwise.error.insufficientfunds': {
    id: 'transferwise.error.insufficientfunds',
    defaultMessage: 'Not have enough funds in your {currency} balance. Please top up your account and try again.',
  },
  'transferwise.error.balance.payment-option-unavailable': {
    id: 'transferwise.error.balance.payment-option-unavailable',
    defaultMessage: 'Unable to fund transfer, please check your balance and try again.',
  },
  'transferwise.error.notconnected': {
    id: 'transferwise.error.notconnected',
    defaultMessage: 'Host is not connected to Transferwise',
  },
  'transferwise.error.currencynotsupported': {
    id: 'transferwise.error.currencynotsupported',
    defaultMessage: 'This currency is not supported',
  },
});
