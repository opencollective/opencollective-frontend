export const PayoutMethodType = {
  ACCOUNT_BALANCE: 'ACCOUNT_BALANCE',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  PAYPAL: 'PAYPAL',
  OTHER: 'OTHER',
  /** Virtual property, doesn't exist in our backend */
  INVITE: 'INVITE',
};

// This is not internationalized on purpose
export const BANK_TRANSFER_DEFAULT_INSTRUCTIONS = `Please make a bank transfer following these instructions:
- Make sure you add the reference number to the transfer. We won’t be able to track it otherwise.
- Please be patient, the validation is manual and it takes a few days to process this kind of transaction.

Amount: {amount}
Reference/Communication: {collective}/{reference}
{account}
`;
