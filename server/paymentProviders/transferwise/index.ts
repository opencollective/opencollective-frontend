import uuidv4 from 'uuid/v4';

import * as transferwise from '../../lib/transferwise';
import { Quote } from '../../types/transferwise';

async function populateProfileId(connectedAccount): Promise<void> {
  if (!connectedAccount.data.profile) {
    const profiles = await transferwise.getProfiles(connectedAccount.token);
    const profile =
      profiles.find(p => p.type === connectedAccount.type) || profiles.find(p => p.type === 'business') || profiles[0];
    if (profile) {
      connectedAccount.set({ data: { ...connectedAccount.data, ...profile } });
      await connectedAccount.save();
    }
  }
}

async function getTemporaryQuote(connectedAccount, payoutMethod, expense): Promise<Quote> {
  return await transferwise.getTemporaryQuote(connectedAccount.token, {
    sourceCurrency: expense.currency,
    targetCurrency: payoutMethod.data.currency,
    targetAmount: expense.amount / 100,
  });
}

async function quoteExpense(connectedAccount, payoutMethod, expense): Promise<Quote> {
  await populateProfileId(connectedAccount);

  // Guarantees the target amount if in the same currency of expense
  const { rate } = await getTemporaryQuote(connectedAccount, payoutMethod, expense);
  const targetAmount = (expense.amount / 100) * rate;

  const quote = await transferwise.createQuote(connectedAccount.token, {
    profileId: connectedAccount.data.id,
    sourceCurrency: expense.currency,
    targetCurrency: payoutMethod.data.currency,
    targetAmount,
  });

  return quote;
}

async function payExpense(connectedAccount, payoutMethod, expense): Promise<any> {
  const quote = await quoteExpense(connectedAccount, payoutMethod, expense);

  const recipient = await transferwise.createRecipientAccount(connectedAccount.token, {
    profileId: connectedAccount.data.id,
    ...payoutMethod.data,
  });

  const transfer = await transferwise.createTransfer(connectedAccount.token, {
    accountId: recipient.id,
    quoteId: quote.id,
    uuid: uuidv4(),
    details: {
      reference: `Expense ${expense.id}`,
    },
  });

  const fund = await transferwise.fundTransfer(connectedAccount.token, {
    profileId: connectedAccount.data.id,
    transferId: transfer.id,
  });
  if (fund.status === 'REJECTED') {
    throw new Error(`Transferwise could not fund transfer: ${fund.errorCode}`);
  }

  return { quote, recipient, transfer, fund };
}

export default {
  getTemporaryQuote,
  quoteExpense,
  payExpense,
};
