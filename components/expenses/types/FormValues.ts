interface ExpenseItemFormValues {
  id?: string;
  incurredAt: Date;
  description: string;
  amount: number;
}

/**
 * The values of the expense form, as stored by formik in `values`.
 * /!\ This object is not complete, we'll progressively add fields as we migrate the expense flow to TypeScript.
 */
export interface ExpenseFormValues {
  description: string;
  longDescription: string;
  items: ExpenseItemFormValues[];
  attachedFiles: File[];
  payee: { id: string; name: string; type: string };
  privateMessage: string;
  invoiceInfo: string;
  currency: string;
  payeeLocation: { address: string; country: string };
  draft: Omit<ExpenseFormValues, 'draft'>;
}
