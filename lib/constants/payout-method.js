export const PayoutMethodType = {
  PAYPAL: 'PAYPAL',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  OTHER: 'OTHER',
};

// This is not internationalized on purpose
export const BANK_TRANSFER_DEFAULT_INSTRUCTIONS = `Please make a bank transfer as follows:

Amount: {amount}
Reference/Communication: {reference}
{account}

Please note that it will take a few days to process your payment`;
