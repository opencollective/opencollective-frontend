import React from 'react';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';

import { fetchFromPDFService } from '../../lib/api';
import { invoiceServiceURL, expenseInvoiceUrl } from '../../lib/url_helpers';
import { getErrorFromPdfService } from '../../lib/errors';

/**
 * An helper to build components that download expense's invoice. Does not check the permissions.
 */
const ExpenseInvoiceDownloadHelper = ({ children, expense, collective, onError }) => {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const filename = `Expense-${expense.legacyId}-${collective?.slug}-invoice.pdf`;

  return children({
    error,
    isLoading,
    filename,
    downloadInvoice: async () => {
      if (isLoading) {
        return false;
      }

      const invoiceUrl = expenseInvoiceUrl(expense.id);
      const fetchParams = { format: 'blob', allowExternal: invoiceServiceURL };
      setLoading(true);
      try {
        const file = await fetchFromPDFService(invoiceUrl, fetchParams);
        return saveAs(file, filename);
      } catch (e) {
        const error = getErrorFromPdfService(e);
        setError(error);
        if (onError) {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    },
  });
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
