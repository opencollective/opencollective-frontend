import React from 'react';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';

import { fetchFromPDFService } from '../../lib/api';
import expenseTypes from '../../lib/constants/expenseTypes';
import { getErrorFromPdfService } from '../../lib/errors';
import { expenseInvoiceUrl } from '../../lib/url-helpers';

import { useToast } from '../ui/useToast';

const getPrettyDate = expense => {
  if (!expense?.createdAt) {
    return '';
  }

  const utc = new Date(expense.createdAt).toISOString();
  return `-${utc.split('T')[0]}`;
};

const getExpenseInvoiceFilename = (collective, expense) => {
  const prettyDate = getPrettyDate(expense);
  return `Expense-${expense.legacyId}-${collective?.slug}-invoice${prettyDate}.pdf`;
};

const generateInvoiceBlob = async expense => {
  const invoiceUrl = expenseInvoiceUrl(expense.id);
  return fetchFromPDFService(invoiceUrl);
};

const downloadExpenseInvoice = async (collective, expense, { setLoading, isLoading, onError }) => {
  if (isLoading) {
    return false;
  }

  const filename = getExpenseInvoiceFilename(collective, expense);
  setLoading(true);
  try {
    const file = await generateInvoiceBlob(expense);
    return saveAs(file, filename);
  } catch (e) {
    const error = getErrorFromPdfService(e);
    onError(error);
  } finally {
    setLoading(false);
  }
};

const useExpenseInvoiceDownloadHelper = ({ expense, collective, onError, disablePreview }) => {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const { toast } = useToast();

  if (![expenseTypes.INVOICE, expenseTypes.SETTLEMENT].includes(expense.type)) {
    return { error: null, isLoading: false, filename: '', downloadInvoice: null };
  }

  return {
    error,
    isLoading,
    filename: getExpenseInvoiceFilename(collective, expense),
    downloadInvoice: () => {
      return downloadExpenseInvoice(collective, expense, {
        setLoading,
        isLoading,
        disablePreview,
        onError: error => {
          setError(error);
          if (onError) {
            onError(error);
          } else {
            toast({ variant: 'error', message: 'Request failed, please try again later' });
          }
        },
      });
    },
  };
};

/**
 * An helper to build components that download expense's invoice. Does not check the permissions.
 */
const ExpenseInvoiceDownloadHelper = ({ children, expense, collective, onError, disablePreview }) => {
  const state = useExpenseInvoiceDownloadHelper({ expense, collective, onError, disablePreview });
  return children(state);
};

ExpenseInvoiceDownloadHelper.propTypes = {
  /** Link content */
  children: PropTypes.func.isRequired,
  /** Expense */
  expense: PropTypes.shape({
    id: PropTypes.string.isRequired,
    legacyId: PropTypes.number.isRequired,
  }).isRequired,
  /** Collective where the expense was posted */
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
  /** Called with an error if anything wrong happens */
  onError: PropTypes.func,
};

export default ExpenseInvoiceDownloadHelper;
