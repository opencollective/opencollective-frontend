export const PayoutMethodType = {
  ACCOUNT_BALANCE: 'ACCOUNT_BALANCE',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  PAYPAL: 'PAYPAL',
  CREDIT_CARD: 'CREDIT_CARD',
  OTHER: 'OTHER',
};

// Submit on Behalf placeholder. Not an actual Payout Method Type and only exists in the frontend.
export const INVITE = 'INVITE';

// Virtual Card charge Expense method
export const VIRTUAL_CARD = 'VIRTUAL_CARD';

// This is not internationalized on purpose
export const BANK_TRANSFER_DEFAULT_INSTRUCTIONS = `Thank you for your contribution! Here are the payment instructions. Be sure to include the reference details, so we can match your payment to the correct transaction. Sometimes it can take a few days for the funds to arrive and be confirmed. You will automatically be issued a receipt.

Amount: {amount}
Reference: {reference}
Detail: {collective}
{account}
`;
