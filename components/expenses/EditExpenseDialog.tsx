import React from 'react';
import { FetchResult, gql, useMutation } from '@apollo/client';
import { DialogClose } from '@radix-ui/react-dialog';
import { Form, FormikProvider } from 'formik';
import { Pen } from 'lucide-react';
import { Currency } from '../../lib/graphql/types/v2/graphql';
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

const expenseFields = {
  description: z.string().min(1),
  expenseItems: z.string().min(1),
};

const RenderFormFields = ({ field, form }) => {
  console.log({ form });

  switch (field) {
    case 'title':
      return <EditExpenseTitle form={form} />;
    case 'expenseItems':
      return <EditExpenseItems form={form} />;
    case 'payoutMethod':
      return <PayoutMethodFormContent form={form} />;
    case 'payee':
      return <WhoIsGettingPaidForm form={form} />;
    case 'type':
      return <EditType form={form} />;
  }
};
const EditType = ({ form }) => {
  return (
    <div>
      <TypeOfExpenseForm form={form} />
      {form.errors.expenseItems && <ExpenseItemsForm form={form} />}
    </div>
  );
};
const EditExpenseItems = ({ form }) => {
  // include currency selection..
  return <ExpenseItemsForm form={form} />;
};

const EditExpenseTitle = ({ form }) => {
  return <FormField name="title" label="Title" />;
};

const pickSchemaFields = field => {
  switch (field) {
    case 'title':
      return {
        title: true,
      };
    case 'payoutMethod':
      return {
        payoutMethodId: true,
        expenseItems: true,
      };
    case 'expenseItems':
      return {
        expenseItems: true,
        hasTax: true,
        taxes: true,
      };
  }
};

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
  field: keyof typeof expenseFields;
}) {
  const intl = useIntl();
  const [open, setOpen] = React.useState(false);
  const { LoggedInUser } = useLoggedInUser();

  const [editExpense, { error, loading, data }] = useMutation<
    EditExpenseFromDashboardMutation,
    EditExpenseFromDashboardMutationVariables
  >(
    gql`
      mutation EditExpenseFromDashboard($expenseEditInput: ExpenseUpdateInput!, $draftKey: String) {
        expense: editExpense(expense: $expenseEditInput, draftKey: $draftKey) {
          id
          legacyId
          description
          longDescription
          amountV2 {
            valueInCents
            currency
          }
          taxes {
            id
            type
            rate
            idNumber
          }
          requiredLegalDocuments
          accountingCategory {
            id
          }
          currency
          type
          status
          # account {
          #   ...ExpenseFormAccountFields
          # }
          payee {
            ...ExpenseFormPayeeFields
          }
          payoutMethod {
            id
          }
          attachedFiles {
            id
            url
            info {
              name
              type
              size
            }
          }
          items {
            id
            description
            url
            file {
              name
              type
              size
            }
            amount: amountV2 {
              currency
              valueInCents
              exchangeRate {
                value
                source
                fromCurrency
                toCurrency
                date
              }
            }
            createdAt
            incurredAt
          }
          privateMessage
          invoiceInfo
          tags
          permissions {
            id
            canEdit
            canEditAccountingCategory
            canEditTags
          }
          draft
          # submitter: createdByAccount {
          #   ...ExpenseFormSubmitterFields
          # }
        }
      }
      fragment ExpenseFormPayeeFields on Account {
        id
        legacyId
        slug
        name
        legalName
        type
        isAdmin
        payoutMethods {
          id
          type
          name
          data
          isSaved
        }

        location {
          address
          country
        }

        ... on AccountWithHost {
          host {
            ...ExpenseFormSchemaHostFields
          }
        }
        ... on Organization {
          host {
            ...ExpenseFormSchemaHostFields
          }
        }
        ... on AccountWithParent {
          parent {
            id
            slug
          }
        }
      }

      fragment ExpenseFormSchemaHostFields on Host {
        id
        legacyId
        name
        legalName
        slug
        type
        currency
        settings

        location {
          id
          address
          country
        }
        transferwise {
          id
          availableCurrencies
        }

        supportedPayoutMethods
        isTrustedHost

        expensesTags {
          id
          tag
        }

        ...ExpenseFormSchemaPolicyFields
        ...ExpenseFormSchemaFeatureFields

        accountingCategories(kind: EXPENSE) {
          nodes {
            id
            name
            kind
            expensesTypes
            friendlyName
            code
            instructions
            appliesTo
          }
        }
      }
      fragment ExpenseFormSchemaFeatureFields on Account {
        features {
          id
          MULTI_CURRENCY_EXPENSES
          PAYPAL_PAYOUTS
        }
      }

      fragment ExpenseFormSchemaPolicyFields on Account {
        policies {
          EXPENSE_CATEGORIZATION {
            requiredForExpenseSubmitters
            requiredForCollectiveAdmins
          }

          EXPENSE_POLICIES {
            invoicePolicy
            receiptPolicy
            titlePolicy
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );
  // const schema = z.object({ [field]: expenseFields[field] });
  // const schema = buildEditExpenseSchema(field, intl);
  // copy from SubmitExpenseFlow.tsx
  const onSubmit: React.ComponentProps<typeof ExpenseFormikContainer>['onSubmit'] = React.useCallback(
    async (values, h, formOptions, startOptions) => {
      let result: FetchResult<CreateExpenseFromDashboardMutation> | FetchResult<EditExpenseFromDashboardMutation>;
      try {
        // track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED);

        const expenseInput: CreateExpenseFromDashboardMutationVariables['expenseCreateInput'] = {
          description: values.title,
          reference:
            values.expenseTypeOption === ExpenseType.INVOICE && values.hasInvoiceOption === YesNoOption.YES
              ? values.invoiceNumber
              : null,
          payee: {
            slug: formOptions.payee?.slug,
          },
          payeeLocation: values.payeeLocation,
          payoutMethod: {
            id: values.payoutMethodId,
          },
          type: values.expenseTypeOption,
          accountingCategory: values.accountingCategoryId
            ? {
                id: values.accountingCategoryId,
              }
            : null,
          attachedFiles: values.additionalAttachments.map(a => ({
            url: typeof a === 'string' ? a : a?.url,
          })),
          currency: formOptions.expenseCurrency,
          customData: null,
          invoiceInfo: null,
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
          longDescription: null,
          privateMessage: null,
          tags: values.tags,
          tax: values.hasTax
            ? [
                {
                  rate: values.tax.rate,
                  type: formOptions.taxType,
                  idNumber: values.tax.idNumber,
                },
              ]
            : null,
        };

        if (formOptions.expense?.id && !startOptions.duplicateExpense) {
          // const editInput: EditExpenseFromDashboardMutationVariables['expenseEditInput'] = {
          //   ...expenseInput,
          //   id: formOptions.expense.id,
          //   payee:
          //     formOptions.expense?.status === ExpenseStatus.DRAFT && !formOptions.payee?.slug
          //       ? null
          //       : {
          //           slug: formOptions.payee?.slug,
          //         },
          // };
          const editValues = pick(
            {
              ...expenseInput,
              payee:
                formOptions.expense?.status === ExpenseStatus.DRAFT && !formOptions.payee?.slug
                  ? null
                  : {
                      slug: formOptions.payee?.slug,
                    },
            },
            field,
          );
          console.log({ editValues });
          const editInput: EditExpenseFromDashboardMutationVariables['expenseEditInput'] = {
            ...editValues,
            id: formOptions.expense.id,
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
            message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
            duration: 20000,
          });
        }

        // track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_SUCCESS);
        // setSubmittedExpenseId(result.data.expense.legacyId);
      } catch (err) {
        // track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_ERROR);
        toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
      } finally {
        h.setSubmitting(false);
      }
    },
    [LoggedInUser, editExpense, intl, toast],
  );

  const formRef = React.useRef<HTMLFormElement>();

  const startOptions = React.useRef({
    draftKey: undefined,
    duplicateExpense: false,
    expenseId: expense?.legacyId,
  });

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      accountSlug: undefined,
      title: '',
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
      recurrenceFrequency: RecurrenceFrequencyOption.NONE,
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
    onSubmit: onSubmit,
    pick: pickSchemaFields(field),
  });

  // const onSubmit = React.useCallback(
  //   async values => {
  //     const parsedValues = schema.parse(values);

  //     try {
  //       await editExpense({ variables: { expenseEditInput: { id: expense.id, ...parsedValues } } });
  //       setOpen(false);
  //       toast({
  //         variant: 'success',
  //         title: <FormattedMessage defaultMessage="Expense edited" id="yTblGN" />,
  //         message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
  //         duration: 20000,
  //       });

  //       // track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_SUCCESS);
  //       // setSubmittedExpenseId(result.data.expense.legacyId);
  //     } catch (err) {
  //       // track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_ERROR);
  //       toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
  //     }
  //   },
  //   [LoggedInUser, schema],
  // );
  // const initialValues = schema.parse(expense);

  // console.log({ initialValues });
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

          {/* <Input value={input} onChange={e => setInput(e.target.value)} /> */}
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
          // <FormikZod schema={schema} initialValues={initialValues} onSubmit={onSubmit}>
          //   {formik => (
          //     <Form className="space-y-4">
          //       <RenderFormFields field={field} formik={formik} />
          //       <DialogFooter>
          //         <DialogClose asChild>
          //           <Button variant="outline">Cancel</Button>
          //         </DialogClose>

          //         <Button type="submit" loading={formik.isSubmitting}>
          //           Save
          //         </Button>
          //       </DialogFooter>
          //     </Form>
          //   )}
          // </FormikZod>
          <ExpenseFormikContainer
            formRef={formRef}
            expenseId={expense?.legacyId}
            field={field}
            onSubmit={onSubmit}
            expenseForm={expenseForm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExpenseFormikContainer(props: {
  // submitExpenseTo?: string;
  // draftKey?: string;
  // duplicateExpense?: boolean;
  expenseId?: number;
  onSubmit: Parameters<typeof useExpenseForm>['0']['onSubmit'];
  field: string;
  expenseForm: any;
  formRef: any;
}) {
  return (
    <FormikProvider value={props.expenseForm}>
      <form ref={props.formRef} onSubmit={e => e.preventDefault()} className="space-y-4">
        <RenderFormFields field={props.field} form={props.expenseForm} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button
            type="submit"
            onClick={() => props.expenseForm.handleSubmit()}

            // loading={expenseForm.initialLoading}
          >
            Save
          </Button>
        </DialogFooter>
      </form>
    </FormikProvider>
  );
}
