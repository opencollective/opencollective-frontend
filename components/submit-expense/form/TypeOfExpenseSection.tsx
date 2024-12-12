import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ExpenseType } from '../../../lib/graphql/types/v2/schema';
import { attachmentDropzoneParams } from '../../expenses/lib/attachments';

import StyledDropzone from '../../StyledDropzone';
import StyledInputFormikField from '../../StyledInputFormikField';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupCard } from '../../ui/RadioGroup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { useToast } from '../../ui/useToast';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';
import { YesNoOption } from '../useExpenseForm';

import { ExpensePolicyContainer } from './ExpensePolicyContainer';
import { FormSectionContainer } from './FormSectionContainer';

type TypeOfExpenseSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function TypeOfExpenseSection(props: TypeOfExpenseSectionProps) {
  const intl = useIntl();
  const expenseTypeOption = props.form.values.expenseTypeOption;
  const { toast } = useToast();

  return (
    <FormSectionContainer
      step={Step.TYPE_OF_EXPENSE}
      form={props.form}
      inViewChange={props.inViewChange}
      title={<FormattedMessage defaultMessage="Select the type of expense" id="hT+uK/" />}
    >
      <React.Fragment>
        <RadioGroup
          value={expenseTypeOption}
          onValueChange={newValue => props.form.setFieldValue('expenseTypeOption', newValue as ExpenseType)}
          className="flex"
        >
          <RadioGroupCard
            className="flex-grow basis-0"
            value={ExpenseType.INVOICE}
            disabled={props.form.initialLoading}
          >
            <div>
              <div className="mb-1 font-bold">
                <FormattedMessage defaultMessage="Invoice" id="Expense.Type.Invoice" />
              </div>
              <div className="text-muted-foreground">
                <FormattedMessage defaultMessage="I am submitting an invoice to get paid" id="plK07+" />
              </div>
            </div>
          </RadioGroupCard>

          <RadioGroupCard
            className="flex-grow basis-0"
            value={ExpenseType.RECEIPT}
            disabled={props.form.initialLoading}
          >
            <div>
              <div className="mb-1 font-bold">
                <FormattedMessage defaultMessage="Reimbursement" id="ExpenseForm.ReceiptLabel" />
              </div>
              <div className="text-muted-foreground">
                <FormattedMessage defaultMessage="I want a reimbursement for something I've paid for" id="ZQSnky" />
              </div>
            </div>
          </RadioGroupCard>
        </RadioGroup>

        {!props.form.initialLoading && expenseTypeOption === ExpenseType.INVOICE && (
          <div>
            {props.form.options.host?.slug !== props.form.options.account?.slug &&
              props.form.options.host?.policies?.EXPENSE_POLICIES?.invoicePolicy && (
                <div className="mt-4">
                  <ExpensePolicyContainer
                    title={<FormattedMessage defaultMessage="Host instructions to submit an invoice" id="jXsDtM" />}
                    policy={props.form.options.host?.policies?.EXPENSE_POLICIES?.invoicePolicy}
                    checked={props.form.values.acknowledgedHostInvoiceExpensePolicy}
                    onAcknowledgedChanged={v => props.form.setFieldValue('acknowledgedHostInvoiceExpensePolicy', v)}
                  />
                </div>
              )}

            {props.form.options.account?.policies?.EXPENSE_POLICIES?.invoicePolicy && (
              <div className="mt-4">
                <ExpensePolicyContainer
                  title={<FormattedMessage defaultMessage="Collective instructions to submit an invoice" id="NeQw7m" />}
                  policy={props.form.options.account?.policies?.EXPENSE_POLICIES?.invoicePolicy}
                  checked={props.form.values.acknowledgedCollectiveInvoiceExpensePolicy}
                  onAcknowledgedChanged={v => props.form.setFieldValue('acknowledgedCollectiveInvoiceExpensePolicy', v)}
                />
              </div>
            )}
          </div>
        )}

        {!props.form.initialLoading && expenseTypeOption === ExpenseType.RECEIPT && (
          <div>
            {props.form.options.host?.slug !== props.form.options.account?.slug &&
              props.form.options.host?.policies?.EXPENSE_POLICIES?.receiptPolicy && (
                <div className="mt-4">
                  <ExpensePolicyContainer
                    title={<FormattedMessage defaultMessage="Host instructions to submit a receipt" id="YQgEUZ" />}
                    policy={props.form.options.host?.policies?.EXPENSE_POLICIES?.receiptPolicy}
                    checked={props.form.values.acknowledgedHostReceiptExpensePolicy}
                    onAcknowledgedChanged={v => props.form.setFieldValue('acknowledgedHostReceiptExpensePolicy', v)}
                  />
                </div>
              )}

            {props.form.options.account?.policies?.EXPENSE_POLICIES?.receiptPolicy && (
              <div className="mt-4">
                <ExpensePolicyContainer
                  title={<FormattedMessage defaultMessage="Collective instructions to submit a receipt" id="cP95i8" />}
                  policy={props.form.options.host?.policies?.EXPENSE_POLICIES?.receiptPolicy}
                  checked={props.form.values.acknowledgedCollectiveReceiptExpensePolicy}
                  onAcknowledgedChanged={v => props.form.setFieldValue('acknowledgedCollectiveReceiptExpensePolicy', v)}
                />
              </div>
            )}
          </div>
        )}

        {!props.form.initialLoading && expenseTypeOption === ExpenseType.INVOICE && (
          <div className="mt-4 rounded-md border border-gray-300 p-4">
            <Label>
              <FormattedMessage defaultMessage="An invoice is required. Do you have one?" id="O+LW+y" />
            </Label>
            <Tabs
              value={props.form.values.hasInvoiceOption}
              onValueChange={newValue => props.form.setFieldValue('hasInvoiceOption', newValue as YesNoOption)}
            >
              <TabsList>
                <TabsTrigger value={YesNoOption.YES}>
                  <FormattedMessage defaultMessage="Yes, I have an invoice" id="woKQYE" />
                </TabsTrigger>
                <TabsTrigger value={YesNoOption.NO}>
                  <FormattedMessage defaultMessage="No, generate an invoice for me" id="67idHB" />
                </TabsTrigger>
              </TabsList>
              <TabsContent value={YesNoOption.YES}>
                <div className="flex items-start gap-4">
                  <div className="h-16 flex-grow basis-0">
                    <div>
                      <StyledInputFormikField
                        isFastField
                        name="invoiceFile"
                        isPrivate
                        label={intl.formatMessage({ defaultMessage: 'Attach your invoice file', id: 'Oa/lhY' })}
                      >
                        {() => (
                          <StyledDropzone
                            {...attachmentDropzoneParams}
                            kind="EXPENSE_ATTACHED_FILE"
                            name="invoice"
                            width={1}
                            minHeight={48}
                            height={1}
                            showActions
                            useGraphQL={true}
                            parseDocument={false}
                            isMulti={false}
                            value={
                              typeof props.form.values.invoiceFile === 'string'
                                ? props.form.values.invoiceFile
                                : props.form.values.invoiceFile?.url
                            }
                            onGraphQLSuccess={uploadResults => {
                              props.form.setFieldValue('invoiceFile', uploadResults[0].file);
                            }}
                            onSuccess={files => {
                              props.form.setFieldValue('invoiceFile', files ? files[0] : null);
                            }}
                            onReject={msg => {
                              toast({ variant: 'error', message: msg });
                            }}
                          />
                        )}
                      </StyledInputFormikField>
                    </div>
                  </div>
                  <div className="flex-grow basis-0">
                    <StyledInputFormikField
                      isFastField
                      name="invoiceNumber"
                      isPrivate
                      label={intl.formatMessage({ defaultMessage: 'Invoice number', id: 'ijDMrP' })}
                      placeholder="e.g. INV 001"
                      hint={intl.formatMessage({
                        defaultMessage: 'The unique identifier mentioned on your invoice',
                        id: 'lct/39',
                      })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </React.Fragment>
    </FormSectionContainer>
  );
}
