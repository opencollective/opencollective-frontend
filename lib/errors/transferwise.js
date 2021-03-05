import { defineMessages } from 'react-intl';

export const TRANSFERWISE_ERROR = {
  'transferwise.error.insufficientFunds': 'transferwise.error.insufficientFunds',
  'transferwise.error.notConnected': 'transferwise.error.notConnected',
  'transferwise.error.currencyNotSupported': 'transferwise.error.currencyNotSupported',
  // Native TransferWise errors
  'transferwise.error.balance.payment-option-unavailable': 'transferwise.error.balance.payment-option-unavailable',
};

export const tranferwiseMsg = defineMessages({
  'transferwise.error.default': {
    id: 'transferwise.error.default',
    defaultMessage: 'An unknown error happened with Wise. Please contact support@opencollective.com.',
  },
  'transferwise.error.insufficientFunds': {
    id: 'transferwise.error.insufficientFunds',
    defaultMessage: 'Not enough funds in your {currency} balance. Please top up your account and try again.',
  },
  'transferwise.error.notConnected': {
    id: 'transferwise.error.notConnected',
    defaultMessage: 'Host is not connected to Wise',
  },
  'transferwise.error.currencyNotSupported': {
    id: 'transferwise.error.currencyNotSupported',
    defaultMessage: 'This currency is not supported',
  },
  // Native TransferWise errors
  'transferwise.error.balance.payment-option-unavailable': {
    id: 'transferwise.error.balance.payment-option-unavailable',
    defaultMessage: 'Unable to fund transfer. Please check your balance and try again.',
  },
});
