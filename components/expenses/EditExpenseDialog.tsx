import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { DialogClose } from '@radix-ui/react-dialog';
import type { FormikProps } from 'formik';
import { Form, FormikProvider, useFormikContext } from 'formik';
import { pick } from 'lodash';
import { Pen } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { Currency, CurrencyExchangeRateInput, Expense, ExpenseType } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import { AdditionalAttachments, ExpenseItemsForm } from '../submit-expense/form/ExpenseItemsSection';
import { PayoutMethodFormContent } from '../submit-expense/form/PayoutMethodSection';
import { WhoIsGettingPaidForm } from '../submit-expense/form/WhoIsGettingPaidSection';
import { InviteeAccountType, useExpenseForm, YesNoOption } from '../submit-expense/useExpenseForm';
import { Button } from '../ui/Button';
import { Collapsible, CollapsibleContent } from '../ui/Collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/Dialog';
import { Label } from '../ui/Label';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { toast } from '../ui/useToast';

import { expensePageExpenseFieldsFragment } from './graphql/fragments';

const RenderFormFields = ({ field, onSubmit, expense }) => {
  switch (field) {
    case 'title':
      return <EditExpenseTitle onSubmit={onSubmit} expense={expense} />;
    case 'expenseItems':
      return <EditExpenseItems onSubmit={onSubmit} expense={expense} />;
    case 'payoutMethod':
      return <EditPayoutMethod onSubmit={onSubmit} expense={expense} />;
    case 'payee':
      return <EditPayee onSubmit={onSubmit} expense={expense} />;
    case 'attachments':
      return <EditAttachments onSubmit={onSubmit} expense={expense} />;
  }
};
const EditPayee = ({ expense, onSubmit }) => {
  const { LoggedInUser } = useLoggedInUser();
  const formRef = React.useRef<HTMLFormElement>();
  const startOptions = React.useRef({
    expenseId: expense.legacyId,
    allowInvite: false,
  });
  const transformedOnSubmit = React.useCallback(
    async (values, h, formOptions, startOptions) => {
      const editValues = {
        payee: {
          slug: formOptions.payee?.slug,
        },
        ...(formOptions.payee?.slug !== expense.payee.slug && {
          payeeLocation: values.payeeLocation,
          currency: formOptions.expenseCurrency,
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
          payoutMethod:
            !values.payoutMethodId || values.payoutMethodId === '__newPayoutMethod'
              ? { ...values.newPayoutMethod, isSaved: false }
              : {
                  id: values.payoutMethodId,
                },
        }),
      };
      return onSubmit(editValues);
    },
    [LoggedInUser],
  );

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
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
    pick: { expenseItems: true, hasTax: true, tax: true, payoutMethodId: true, payeeSlug: true },
  });

  const hasChangedPayee =
    expenseForm.values.payeeSlug &&
    expenseForm.values.payeeSlug !== expense.payee.slug &&
    !expenseForm.values.payeeSlug.startsWith('__');
  return (
    <FormikProvider value={expenseForm}>
      <form className="space-y-6" ref={formRef} onSubmit={e => e.preventDefault()}>
        <WhoIsGettingPaidForm form={expenseForm} />
        <Collapsible open={hasChangedPayee}>
          <CollapsibleContent>
            <div className="space-y-3">
              <Label>Pick new payout method</Label>
              <PayoutMethodFormContent form={expenseForm} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <EditExpenseActionButtons disabled={!hasChangedPayee} handleSubmit={expenseForm.handleSubmit} />
      </form>
    </FormikProvider>
  );
};
const EditPayoutMethod = ({ expense, onSubmit }) => {
  const { LoggedInUser } = useLoggedInUser();
  const formRef = React.useRef<HTMLFormElement>();
  const startOptions = React.useRef({
    expenseId: expense.legacyId,
  });
  const transformedOnSubmit = React.useCallback(
    async (values, h, formOptions, startOptions) => {
      const editValues = {
        payoutMethod:
          !values.payoutMethodId || values.payoutMethodId === '__newPayoutMethod'
            ? { ...values.newPayoutMethod, isSaved: false }
            : {
                id: values.payoutMethodId,
              },
        payee: {
          slug: formOptions.payee?.slug,
        },
        payeeLocation: values.payeeLocation,
        currency: formOptions.expenseCurrency,
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
    },
    [LoggedInUser],
  );

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
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
    pick: { expenseItems: true, hasTax: true, tax: true, payoutMethodId: true, payee: true, payeeLocation: true },
  });

  return (
    <FormikProvider value={expenseForm}>
      <form className="space-y-4" ref={formRef} onSubmit={e => e.preventDefault()}>
        <PayoutMethodFormContent form={expenseForm} />
        <EditExpenseActionButtons handleSubmit={expenseForm.handleSubmit} />
      </form>
    </FormikProvider>
  );
};
const EditAttachments = ({ expense, onSubmit }) => {
  const formRef = React.useRef<HTMLFormElement>();
  const startOptions = React.useRef({
    expenseId: expense.legacyId,
  });
  const transformedOnSubmit = values => {
    const editValues = {
      attachedFiles: values.additionalAttachments.map(a => ({
        url: typeof a === 'string' ? a : a?.url,
      })),
    };
    return onSubmit(editValues);
  };

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
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
    pick: { expenseAttachedFiles: true },
  });

  return (
    <FormikProvider value={expenseForm}>
      <form className="space-y-4" ref={formRef} onSubmit={e => e.preventDefault()}>
        <AdditionalAttachments form={expenseForm} />
        <EditExpenseActionButtons loading={expenseForm.initialLoading} handleSubmit={expenseForm.handleSubmit} />
      </form>
    </FormikProvider>
  );
};
const EditExpenseItems = ({ expense, onSubmit }) => {
  const formRef = React.useRef<HTMLFormElement>();
  const startOptions = React.useRef({
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

function EditExpenseActionButtons({
  handleSubmit,
  disabled,
  loading,
}: {
  handleSubmit?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const formik = useFormikContext();

  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>

      <Button disabled={disabled || loading} type="submit" loading={formik.isSubmitting} onClick={handleSubmit}>
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
  goToLegacyEdit,
}: {
  expense: Expense;
  field: 'title' | 'expenseItems' | 'payoutMethod' | 'payee' | 'type' | 'attachments';
}) {
  const [open, setOpen] = React.useState(false);

  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const [editExpense] = useMutation(
    gql`
      mutation EditExpense($expenseEditInput: ExpenseUpdateInput!) {
        expense: editExpense(expense: $expenseEditInput) {
          id
          ...ExpensePageExpenseFields
        }
      }
      ${expensePageExpenseFieldsFragment}
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
          message: <FormattedMessage defaultMessage="Expense edited" id="yTblGN" />,
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
              goToLegacyEdit?.();
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
