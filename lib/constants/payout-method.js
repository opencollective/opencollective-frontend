export const PayoutMethodType = {
  ACCOUNT_BALANCE: 'ACCOUNT_BALANCE',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  PAYPAL: 'PAYPAL',
  OTHER: 'OTHER',
};

// Submit on Behalf placeholder. Not an actual Payout Method Type and only exists in the frontend.
export const INVITE = 'INVITE';

// This is not internationalized on purpose
export const BANK_TRANSFER_DEFAULT_INSTRUCTIONS = `Thank you for your contributions! Here are the payment instructions. Be sure to include the reference details, so we can validate the transaction. This is a manual process, so it can take a few days.

Amount: {amount}
Reference: {reference}
Detail: {collective}
{account}
`;
