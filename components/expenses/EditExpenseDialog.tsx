import React from 'react';
import { FetchResult, gql, useMutation } from '@apollo/client';
import { DialogClose } from '@radix-ui/react-dialog';
import { Form, FormikProps, FormikProvider, useFormikContext } from 'formik';
import { Pen } from 'lucide-react';
import { Currency, TaxType } from '../../lib/graphql/types/v2/graphql';
import type {
  CurrencyExchangeRateInput,
  EditExpenseFromDashboardMutationVariables,
} from '../../lib/graphql/types/v2/graphql';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import InputField from '../InputField';
import { Button } from '../ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

import { editExpenseMutation } from './graphql/mutations';
import { toast } from '../ui/useToast';
import {
  CreateExpenseFromDashboardMutation,
  CreateExpenseFromDashboardMutationVariables,
  EditExpenseFromDashboardMutation,
  Expense,
  ExpenseStatus,
  ExpenseType,
} from '../../lib/graphql/types/v2/graphql';
import { ExpenseItemsForm } from '../submit-expense/form/ExpenseItemsSection';
import {
  InviteeAccountType,
  RecurrenceFrequencyOption,
  YesNoOption,
  buildFormSchema,
  useExpenseForm,
} from '../submit-expense/useExpenseForm';
import { pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { SURVEY_KEY, Survey } from '../Survey';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { i18nGraphqlException } from '../../lib/errors';
import { PayoutMethodFormContent } from '../submit-expense/form/PayoutMethodSection';
import { WhoIsGettingPaidForm } from '../submit-expense/form/WhoIsGettingPaidSection';
import { TypeOfExpenseForm } from '../submit-expense/form/TypeOfExpenseSection';
import MessageBox from '../MessageBox';
import { checkVATNumberFormat } from '@opencollective/taxes';

const RenderFormFields = ({ field, onSubmit, expense }) => {
  switch (field) {
    case 'title':
      return <EditExpenseTitle onSubmit={onSubmit} expense={expense} />;
    case 'expenseItems':
      return <EditExpenseItems onSubmit={onSubmit} expense={expense} />;
    case 'payoutMethod':
      return <PayoutMethodFormContent onSubmit={onSubmit} expense={expense} />;
    case 'payee':
      return <WhoIsGettingPaidForm onSubmit={onSubmit} expense={expense} />;
  }
};

const EditExpenseItems = ({ expense, onSubmit }) => {
  const intl = useIntl();
  // const options = {
  //   isAdminOfPayee: undefined,
  //   taxType: undefined, // set tax Type
  // };
  // const schema = z.object({
  //   expenseItems: z.array(
  //     z
  //       .object({
  //         description: z
  //           .string()
  //           .nullish()
  //           .refine(
  //             v => {
  //               // if (!options.isAdminOfPayee) {
  //               //   return true;
  //               // }

  //               return v.length > 0;
  //             },
  //             {
  //               message: 'Required',
  //             },
  //           ),
  //         attachment: z
  //           .union([
  //             z.string().nullish(),
  //             z.object({
  //               url: z.string().nullish(),
  //             }),
  //           ])
  //           .nullish()
  //           .refine(
  //             attachment => {
  //               if (expense.type === ExpenseType.INVOICE) {
  //                 return true;
  //               }

  //               return typeof attachment === 'string' ? !!attachment : !!attachment?.url;
  //             },
  //             {
  //               message: 'Required',
  //             },
  //           ),
  //         incurredAt: z.string(),
  //         amount: z.object({
  //           valueInCents: z.number().min(1),
  //           currency: z.string().refine(v => Object.values(Currency).includes(v as Currency), {
  //             message: `Currency must be one of: ${Object.values(Currency).join(',')}`,
  //           }),
  //           exchangeRate: z
  //             .object({
  //               value: z.number(),
  //               source: z.string(),
  //               fromCurrency: z.string(),
  //               toCurrency: z.string(),
  //               date: z.string().nullable(),
  //             })
  //             .nullable(),
  //         }),
  //       })
  //       .refine(
  //         item => {
  //           if (item.amount.currency && item.amount.currency !== expense.currency) {
  //             return (
  //               item.amount.exchangeRate?.value &&
  //               item.amount.exchangeRate?.source &&
  //               item.amount.exchangeRate?.toCurrency === expense.currency
  //             );
  //           }
  //           return true;
  //         },
  //         {
  //           message: intl.formatMessage({ defaultMessage: 'Missing exchange rate', id: 'UXE8lX' }),
  //           path: ['amount', 'exchangeRate', 'value'],
  //         },
  //       ),
  //   ),
  //   // hasTax: z.boolean().nullable(),
  //   tax: z
  //     .object({
  //       rate: z
  //         .number()
  //         .refine(
  //           v => {
  //             if (options.taxType !== TaxType.GST) {
  //               return true;
  //             }
  //             return [0, 0.15].includes(v);
  //           },
  //           {
  //             message: 'GST tax must be 0% or 15%',
  //           },
  //         )
  //         .refine(
  //           v => {
  //             if (options.taxType !== TaxType.VAT) {
  //               return true;
  //             }

  //             return v > 0 && v < 1;
  //           },
  //           {
  //             message: 'VAT tax must be between 0% and 100%',
  //           },
  //         ),
  //       idNumber: z
  //         .string()
  //         .nullable()
  //         .refine(
  //           v => {
  //             if (options.taxType !== TaxType.VAT) {
  //               return true;
  //             }

  //             return checkVATNumberFormat(v).isValid;
  //           },
  //           {
  //             message: 'Invalid VAT Number',
  //           },
  //         ),
  //     })
  //     .nullable()
  //     .refine(v => {
  //       if (!values.hasTax) {
  //         return true;
  //       }

  //       return !!v;
  //     }),
  // });
  // const transformedOnSubmit = values => {
  //   const input = {
  //     items: values.expenseItems,
  //   };
  //   onSubmit(input);
  // };
  // const initialValues = {
  //   expenseItems: expense.items,
  // };

  const formRef = React.useRef<HTMLFormElement>();

  const startOptions = React.useRef({
    // draftKey: props.draftKey,
    // duplicateExpense: props.duplicateExpense,
    expenseId: expense.legacyId,
  });
  const transformedOnSubmit = values => {
    const editValues = {
      items: values.expenseItems.map(ei => ({
        description: ei.description,
        amountV2: {
          valueInCents: ei.amount.valueInCents,
          currency: ei.amount.currency as Currency,
          exchangeRate: ei.amount.exchangeRate
            ? ({
                ...pick(ei.amount.exchangeRate, ['source', 'rate', 'value', 'fromCurrency', 'toCurrency']),
                date: ei.amount.exchangeRate.date || ei.incurredAt,
              } as CurrencyExchangeRateInput)
            : null,
        },
        incurredAt: new Date(ei.incurredAt),
        url: typeof ei.attachment === 'string' ? ei.attachment : ei.attachment?.url,
      })),
    };
    return onSubmit(editValues);
  };

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      expenseTypeOption: ExpenseType.INVOICE,
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      expenseItems: [
        {
          amount: {
            valueInCents: 0,
            currency: 'USD',
          },
          description: '',
        },
      ],
      additionalAttachments: [],
      hasInvoiceOption: YesNoOption.YES,
      inviteeNewIndividual: {},
      inviteeNewOrganization: {
        organization: {},
      },
      newPayoutMethod: {
        data: {},
      },
    },
    startOptions: startOptions.current,
    onSubmit: transformedOnSubmit,
    pick: { expenseItems: true, hasTax: true, tax: true },
  });

  return (
    <FormikProvider value={expenseForm}>
      <form className="space-y-4" ref={formRef} onSubmit={e => e.preventDefault()}>
        <ExpenseItemsForm form={expenseForm} />
        <EditExpenseActionButtons handleSubmit={expenseForm.handleSubmit} />
      </form>
    </FormikProvider>
  );
};

const EditExpenseTitle = ({ expense, onSubmit }) => {
  const schema = z.object({
    description: z.string().min(1),
  });

  return (
    <EditExpenseFormikContainer schema={schema} initialValues={expense} onSubmit={onSubmit}>
      <FormField name="description" label="Title" />
    </EditExpenseFormikContainer>
  );
};

function EditExpenseActionButtons({ handleSubmit }: { handleSubmit?: () => void }) {
  const formik = useFormikContext();

  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>

      <Button type="submit" loading={formik.isSubmitting} onClick={handleSubmit}>
        Save
      </Button>
    </DialogFooter>
  );
}

function EditExpenseFormikContainer({ schema, initialValues, onSubmit, children }) {
  return (
    <FormikZod schema={schema} initialValues={initialValues} onSubmit={values => onSubmit(schema.parse(values))}>
      {(formik: FormikProps<z.infer<typeof schema>>) => (
        <Form className="space-y-4">
          {children}
          <EditExpenseActionButtons />
        </Form>
      )}
    </FormikZod>
  );
}

// const buildEditExpenseSchema = (field, intl) => {
//   const schema = buildFormSchema({}, {}, intl);
//   let pick;
//   switch (field) {
//     case 'description':
//       pick = { description: true };
//       break;
//     case 'expenseItems':
//       pick = { currency: true };
//       break;
//     case 'payee':
//       pick = { name: true };
//       break;
//     default:
//       break;
//   }
//   return schema.pick(pick);
// };
export default function EditExpenseDialog({
  expense,
  field,
  title,
  description,
  dialogContentClassName,
  triggerClassName,
  onEdit,
}: {
  expense: Expense;
  field: 'title' | 'expenseItems' | 'payoutMethod' | 'payee';
}) {
  const [open, setOpen] = React.useState(false);

  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const [editExpense, { error, loading, data }] = useMutation(
    gql`
      mutation EditExpense($expenseEditInput: ExpenseUpdateInput!) {
        expense: editExpense(expense: $expenseEditInput) {
          id
          description
          status
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  const onSubmit = React.useCallback(
    async values => {
      try {
        const editInput = {
          ...values,
          id: expense.id,
        };
        await editExpense({
          variables: {
            expenseEditInput: editInput,
          },
        });
        setOpen(false);
        toast({
          variant: 'success',
          title: <FormattedMessage defaultMessage="Expense edited" id="yTblGN" />,
          duration: 20000,
        });
      } catch (err) {
        // track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_ERROR);
        toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
      }
    },
    [LoggedInUser, editExpense, intl, toast],
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button size="icon-xs" variant="outline" className={triggerClassName}>
              <Pen size={16} />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>

      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {field === 'type' ? (
          <Button
            variant="outline"
            onClick={() => {
              onEdit?.();
              setOpen(false);
            }}
          >
            Go to edit
          </Button>
        ) : (
          <RenderFormFields expense={expense} field={field} onSubmit={onSubmit} />
        )}
      </DialogContent>
    </Dialog>
  );
}
