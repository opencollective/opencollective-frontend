import axios from 'axios';
import config from 'config';
import { get, omitBy, isNull } from 'lodash/fp';

import { Quote, RecipientAccount } from '../types/transferwise';

const compactRecipientDetails = omitBy(isNull);

interface CreateQuote {
  profileId: number;
  sourceCurrency: string;
  targetCurrency: string;
  targetAmount?: number;
  sourceAmount?: number;
}
export const createQuote = async (
  token: string,
  { profileId: profile, sourceCurrency, targetCurrency, targetAmount, sourceAmount }: CreateQuote,
): Promise<Quote> =>
  axios
    .post(
      `${config.transferwise.api}/v1/quotes`,
      {
        profile,
        source: sourceCurrency,
        target: targetCurrency,
        rateType: 'FIXED',
        type: 'BALANCE_PAYOUT',
        targetAmount,
        sourceAmount,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .then(get('data'));

interface CreateRecipientAccount extends RecipientAccount {
  profileId: number;
}
export const createRecipientAccount = async (
  token: string,
  { profileId: profile, currency, type, accountHolderName, legalType, details }: CreateRecipientAccount,
): Promise<RecipientAccount> =>
  axios
    .post(
      `${config.transferwise.api}/v1/accounts`,
      { profile, currency, type, accountHolderName, legalType, details },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .then(({ data: { details, ...recipient } }: { data: RecipientAccount }) => ({
      ...recipient,
      details: compactRecipientDetails(details),
    }));

interface CreateTransfer {
  accountId: number;
  quoteId: number;
  uuid: string;
  details: {
    reference?: string;
    transferPurpose?: string;
    sourceOfFunds?: string;
  };
}
export const createTransfer = async (
  token: string,
  { accountId: targetAccount, quoteId: quote, uuid: customerTransactionId, details }: CreateTransfer,
): Promise<any> =>
  axios
    .post(
      `${config.transferwise.api}/v1/transfers`,
      { targetAccount, quote, customerTransactionId, details },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .then(get('data'));

interface FundTransfer {
  profileId: number;
  transferId: number;
}
export const fundTransfer = async (
  token,
  { profileId, transferId }: FundTransfer,
): Promise<{ status: 'COMPLETED' | 'REJECTED'; errorCode: string }> =>
  axios
    .post(
      `${config.transferwise.api}/v3/profiles/${profileId}/transfers/${transferId}/payments`,
      { type: 'BALANCE' },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .then(get('data'));

export const getProfiles = async (token: string): Promise<any> =>
  axios
    .get(`${config.transferwise.api}/v1/profiles`, { headers: { Authorization: `Bearer ${token}` } })
    .then(get('data'));

interface GetTemporaryQuote {
  sourceCurrency: string;
  targetCurrency: string;
  targetAmount?: number;
  sourceAmount?: number;
}
export const getTemporaryQuote = async (
  token: string,
  { sourceCurrency, targetCurrency, ...amount }: GetTemporaryQuote,
): Promise<Quote> =>
  axios
    .get(`${config.transferwise.api}/v1/quotes`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        source: sourceCurrency,
        target: targetCurrency,
        rateType: 'FIXED',
        ...amount,
      },
    })
    .then(get('data'));

export const getTransfer = async (token: string, transferId: number): Promise<any> =>
  axios
    .get(`${config.transferwise.api}/v1/transfers/${transferId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(get('data'));
