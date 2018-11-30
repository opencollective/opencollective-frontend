export const invoiceServiceURL = process.env.INVOICES_URL;

export const collectiveInvoiceURL = (collectiveSlug, invoiceSlug, format) => {
  return `${invoiceServiceURL}/collectives/${collectiveSlug}/${invoiceSlug}.${format}`;
};

export const transactionInvoiceURL = transactionUUID => {
  return `${invoiceServiceURL}/transactions/${transactionUUID}/invoice.pdf`;
};
