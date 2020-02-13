import axios, { AxiosError } from 'axios';
import config from 'config';
import { omitBy, isNull } from 'lodash';

import logger from './logger';
import { Quote, RecipientAccount } from '../types/transferwise';

const compactRecipientDetails = <T>(object: T): Partial<T> => omitBy(object, isNull);
const getData = <T extends { data?: object }>(obj: T | undefined): T['data'] | undefined => obj && obj.data;

const getAxiosError = (error: AxiosError): string => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return `${error.response.status}: ${JSON.stringify(error.response.data)}`;
  } else {
    return error.toString();
  }
};

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
): Promise<Quote> => {
  const data = {
    profile,
    source: sourceCurrency,
    target: targetCurrency,
    rateType: 'FIXED',
    type: 'BALANCE_PAYOUT',
    targetAmount,
    sourceAmount,
  };
  try {
    const response = await axios.post(`${config.transferwise.api}/v1/quotes`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return getData(response);
  } catch (e) {
    const message = `Unable to create quote: ${getAxiosError(e)}`;
    logger.error(message, data);
    throw new Error(message);
  }
};

interface CreateRecipientAccount extends RecipientAccount {
  profileId: number;
}
export const createRecipientAccount = async (
  token: string,
  { profileId: profile, currency, type, accountHolderName, legalType, details }: CreateRecipientAccount,
): Promise<RecipientAccount> => {
  const data = { profile, currency, type, accountHolderName, legalType, details };
  try {
    const response = await axios.post(`${config.transferwise.api}/v1/accounts`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      ...response.data,
      details: compactRecipientDetails(response.data.details),
    };
  } catch (e) {
    const message = `Unable to create recipient account: ${getAxiosError(e)}`;
    logger.error(message);
    throw new Error(message);
  }
};

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
): Promise<any> => {
  const data = { targetAccount, quote, customerTransactionId, details };
  try {
    const response = await axios.post(`${config.transferwise.api}/v1/transfers`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return getData(response);
  } catch (e) {
    const message = `Unable to create transfer: ${getAxiosError(e)}`;
    logger.error(message);
    throw new Error(message);
  }
};

interface FundTransfer {
  profileId: number;
  transferId: number;
}
export const fundTransfer = async (
  token,
  { profileId, transferId }: FundTransfer,
): Promise<{ status: 'COMPLETED' | 'REJECTED'; errorCode: string }> => {
  try {
    const response = await axios.post(
      `${config.transferwise.api}/v3/profiles/${profileId}/transfers/${transferId}/payments`,
      { type: 'BALANCE' },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return getData(response);
  } catch (e) {
    const message = `Unable to fund transfer: ${getAxiosError(e)}`;
    logger.error(message, { transferId });
    throw new Error(message);
  }
};

export const getProfiles = async (token: string): Promise<any> => {
  try {
    const response = await axios.get(`${config.transferwise.api}/v1/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return getData(response);
  } catch (e) {
    const message = `Unable to get profiles: ${getAxiosError(e)}`;
    logger.error(message);
    throw new Error(message);
  }
};

interface GetTemporaryQuote {
  sourceCurrency: string;
  targetCurrency: string;
  targetAmount?: number;
  sourceAmount?: number;
}
export const getTemporaryQuote = async (
  token: string,
  { sourceCurrency, targetCurrency, ...amount }: GetTemporaryQuote,
): Promise<Quote> => {
  const params = {
    source: sourceCurrency,
    target: targetCurrency,
    rateType: 'FIXED',
    ...amount,
  };
  try {
    const response = await axios.get(`${config.transferwise.api}/v1/quotes`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return getData(response);
  } catch (e) {
    const message = `Unable to get temporary quote: ${getAxiosError(e)}`;
    logger.error(message, params);
    throw new Error(message);
  }
};

export const getTransfer = async (token: string, transferId: number): Promise<any> => {
  try {
    const response = await axios.get(`${config.transferwise.api}/v1/transfers/${transferId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return getData(response);
  } catch (e) {
    const message = `Unable to get transfer data: ${getAxiosError(e)}`;
    logger.error(message, { transferId });
    throw new Error(message);
  }
};
