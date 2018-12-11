import { get, groupBy } from 'lodash';
import axios from 'axios';
import config from 'config';
import queryString from 'query-string';

const ledgerTransactionCategories = Object.freeze({
  PLATFORM: 'Platform Fee',
  PAYMENT_PROVIDER: 'Payment Provider Fee',
  WALLET_PROVIDER: 'Wallet Provider Fee',
  ACCOUNT: 'Account to Account',
  CURRENCY_CONVERSION: 'Currency Conversion',
});

/**
 * Fetches transactions from the ledger service and return an array
 * @param {Object} args - The graphql arguments(graphql/queries)
 * @return {Map} returns a map where the key is the legacy id(api id)
 *               and value is the array with the ledger transactions
 */
export async function fetchLedgerTransactions(args) {
  const ledgerQuery = {
    where: {
      ToAccountId: args.CollectiveId,
    },
    limit: args.limit,
    offset: args.offset,
  };
  ledgerQuery.where = JSON.stringify(ledgerQuery.where);
  return axios.get(`${config.ledger.transactionUrl}?${queryString.stringify(ledgerQuery)}`);
}
/**
 * Fetches transactions from the ledger service and return them
 * grouped by the LegacyCreditTransactionId(meaning api id)
 * @param {Object} args - The graphql arguments(graphql/queries)
 * @return {Map} returns a map where the key is the legacy id(api id)
 *               and value is the array with the ledger transactions
 */
export async function fetchLedgerTransactionsGroupedByLegacyIds(args) {
  const transactionsEndpointResult = await fetchLedgerTransactions(args);
  return groupBy(transactionsEndpointResult.data || [], 'LegacyCreditTransactionId');
}

/**
 * Fetches transactions from the ledger service and return them
 * grouped by the LegacyCreditTransactionId(meaning api id)
 * @param {Number} CollectiveId - the CollectiveId that we're returning information
 * @param {Map} ledgerTransactions - The map found for the ledger transactions(see method fetchLedgerTransactionsGroupedByLegacyIds)
 * @param {Array} apiTransactions - The "api" transactions found for the givem CollectiveId
 * @return {Map} returns a map where the key is the legacy id(api id)
 *               and value is the array with the ledger transactions
 */
export function parseLedgerTransactions(CollectiveId, ledgerTransactions, apiTransactions) {
  // sort keys of result by legacy id DESC as lodash groupBy changes the order
  const ledgerFormattedTransactions = [];
  for (const key of Object.keys(ledgerTransactions).sort((a, b) => b - a)) {
    // mapping legacy info to parse inside ledger mapping
    const legacyMatchingTransaction = apiTransactions.filter(t => {
      return (
        t.id === ledgerTransactions[key][0].LegacyDebitTransactionId ||
        t.id === ledgerTransactions[key][0].LegacyCreditTransactionId
      );
    })[0];
    let uuid, VirtualCardCollectiveId, HostCollectiveId, RefundTransactionId;
    if (legacyMatchingTransaction) {
      uuid = legacyMatchingTransaction.uuid;
      VirtualCardCollectiveId = legacyMatchingTransaction.UsingVirtualCardFromCollectiveId;
      HostCollectiveId = legacyMatchingTransaction.HostCollectiveId;
      RefundTransactionId = legacyMatchingTransaction.RefundTransactionId;
    }
    ledgerFormattedTransactions.push(
      parseLedgerTransactionToApiFormat(key, ledgerTransactions[key], {
        AccountId: CollectiveId,
        legacyUuid: uuid,
        VirtualCardCollectiveId,
        HostCollectiveId,
        RefundTransactionId,
      }),
    );
  }
  return ledgerFormattedTransactions;
}

/**
 * Parses "ledger" transactions into the "api" transactions format them
 * to the api transactions
 * @param {Number} legacyId - corresponding id from the opencollective-api Transactions table
 * @param {Array} transactions - array of transactions representing one "legacy" transaction
 * @param {Object} legacyInformation - extra information from corresponding legacy transaction
 * @return {Object} returns a transaction with a similar format of the model Transaction
 */
export function parseLedgerTransactionToApiFormat(legacyId, transactions, legacyInformation) {
  const { AccountId, legacyUuid, VirtualCardCollectiveId, HostCollectiveId, RefundTransactionId } = legacyInformation;
  const creditTransaction = transactions.filter(t => {
    return (
      (t.category === ledgerTransactionCategories.ACCOUNT ||
        t.category === `REFUND: ${ledgerTransactionCategories.ACCOUNT}`) &&
      t.type === 'CREDIT'
    );
  });
  // setting up type, From and to accounts
  const FromAccountId = parseInt(creditTransaction[0].FromAccountId);
  const ToAccountId = parseInt(creditTransaction[0].ToAccountId);
  const type = AccountId === FromAccountId ? 'DEBIT' : 'CREDIT';
  // finding fees, accounts and currency conversion transactions
  // separately
  const platformFeeTransaction = transactions.filter(t => {
    return (
      (t.category === ledgerTransactionCategories.PLATFORM ||
        t.category === `REFUND: ${ledgerTransactionCategories.PLATFORM}`) &&
      t.type === 'DEBIT'
    );
  });
  const paymentFeeTransaction = transactions.filter(t => {
    return (
      (t.category === ledgerTransactionCategories.PAYMENT_PROVIDER ||
        t.category === `REFUND: ${ledgerTransactionCategories.PAYMENT_PROVIDER}`) &&
      t.type === 'DEBIT'
    );
  });
  const hostFeeTransaction = transactions.filter(t => {
    return (
      (t.category === ledgerTransactionCategories.WALLET_PROVIDER ||
        t.category === `REFUND: ${ledgerTransactionCategories.WALLET_PROVIDER}`) &&
      t.type === 'DEBIT'
    );
  });
  const accountTransaction =
    type === 'CREDIT'
      ? creditTransaction
      : transactions.filter(t => {
          return (
            (t.category === ledgerTransactionCategories.ACCOUNT ||
              t.category === `REFUND: ${ledgerTransactionCategories.ACCOUNT}`) &&
            t.type === type
          );
        });
  // setting up currency and amount information
  const hostFeeInHostCurrency = hostFeeTransaction.length > 0 ? hostFeeTransaction[0].amount : 0;
  const platformFeeInHostCurrency = platformFeeTransaction.length > 0 ? platformFeeTransaction[0].amount : 0;
  const paymentProcessorFeeInHostCurrency = paymentFeeTransaction.length > 0 ? paymentFeeTransaction[0].amount : 0;
  let amount = accountTransaction[0].amount;
  let netAmountInCollectiveCurrency =
    amount + hostFeeInHostCurrency + platformFeeInHostCurrency + paymentProcessorFeeInHostCurrency;
  // if type is DEBIT, amount and netAmount are calculated differently
  if (type === 'DEBIT') {
    amount = amount - hostFeeInHostCurrency - platformFeeInHostCurrency - paymentProcessorFeeInHostCurrency;
    netAmountInCollectiveCurrency = accountTransaction[0].amount;
  }
  const currency = accountTransaction[0].forexRateSourceCoin;
  const hostCurrency = accountTransaction[0].forexRateDestinationCoin;
  const forexRate = accountTransaction[0].forexRate;

  const parsedTransaction = {
    id: legacyId,
    type,
    amount,
    currency,
    HostCollectiveId,
    hostCurrency,
    hostFeeInHostCurrency,
    platformFeeInHostCurrency,
    paymentProcessorFeeInHostCurrency,
    hostCurrencyFxRate: forexRate,
    netAmountInCollectiveCurrency: parseInt(netAmountInCollectiveCurrency),
    fromCollective: { id: type === 'DEBIT' ? ToAccountId : FromAccountId },
    collective: { id: type === 'DEBIT' ? FromAccountId : ToAccountId },
    description: accountTransaction[0].description,
    createdAt: accountTransaction[0].createdAt,
    updatedAt: accountTransaction[0].updatedAt,
    uuid: legacyUuid,
    UsingVirtualCardFromCollectiveId: VirtualCardCollectiveId,
    // createdByUser: { type: UserType },
    // privateMessage: { type: GraphQLString },
  };
  // setting refund transaction
  if (RefundTransactionId) {
    parsedTransaction.refundTransaction = {
      id: RefundTransactionId,
    };
  }
  // setting paymentMethod
  if (get(creditTransaction[0], 'fromWallet.PaymentMethodId')) {
    parsedTransaction.paymentMethod = {
      id: parseInt(get(creditTransaction[0], 'fromWallet.PaymentMethodId')),
    };
  }
  return parsedTransaction;
}
