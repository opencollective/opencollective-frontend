import React from 'react';
import { ChevronDown, Lock } from 'lucide-react';

import { ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import { attachmentDropzoneParams } from '../../expenses/lib/attachments';

import HTMLContent from '../../HTMLContent';
import MessageBox from '../../MessageBox';
import StyledDropzone from '../../StyledDropzone';
import { Checkbox } from '../../ui/Checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/Collapsible';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupItem } from '../../ui/RadioGroup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';
import { YesNoOption } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';

type TypeOfExpenseSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function TypeOfExpenseSection(props: TypeOfExpenseSectionProps) {
  const expenseTypeOption = props.form.values.expenseTypeOption;

  return (
    <FormSectionContainer
      id={Step.TYPE_OF_EXPENSE}
      inViewChange={props.inViewChange}
      title={'Select the type of expense'}
    >
      <RadioGroup
        className="mb-4 flex"
        value={expenseTypeOption}
        onValueChange={newValue => props.form.setFieldValue('expenseTypeOption', newValue as ExpenseType)}
      >
        <div className="flex flex-grow basis-0 space-x-2 rounded-md border border-gray-200 p-4">
          <RadioGroupItem value={ExpenseType.INVOICE} />
          <Label className="flex-grow" htmlFor={ExpenseType.INVOICE}>
            <div className="mb-1 text-lg font-bold">Invoice</div>
            <div>I am submitting an invoice to get paid</div>
          </Label>
        </div>
        <div className="flex flex-grow basis-0 space-x-2 rounded-md border border-gray-200 p-4">
          <RadioGroupItem value={ExpenseType.RECEIPT} />
          <Label className="flex-grow" htmlFor={ExpenseType.RECEIPT}>
            <div className="mb-1 text-lg font-bold">Reimbursement</div>
            <div>I want a reimbursement for something I&apos;ve paid for</div>
          </Label>
        </div>
      </RadioGroup>

      {props.form.options.hostExpensePolicy && (
        <Collapsible asChild defaultOpen={!props.form.values.acknowledgedHostExpensePolicy}>
          <div className="group mb-4 rounded-md border border-[#DCDDE0] p-4">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center text-start text-sm font-bold">
                <div className="flex-grow">Host Instructions to submit an invoice</div>
                <div className="group-data-[state=open]:rotate-180">
                  <ChevronDown size={16} />
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4">
                <HTMLContent content={props.form.options.hostExpensePolicy} />
                <div className="mt-4">
                  <MessageBox type="warning">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-normal leading-normal">
                      <Checkbox
                        checked={props.form.values.acknowledgedHostExpensePolicy}
                        onCheckedChange={v => props.form.setFieldValue('acknowledgedHostExpensePolicy', v as boolean)}
                      />
                      I have read and understood the instructions and conditions
                    </label>
                  </MessageBox>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {props.form.options.collectiveExpensePolicy && (
        <Collapsible asChild defaultOpen={!props.form.values.acknowledgedCollectiveExpensePolicy}>
          <div className="group mb-4 rounded-md border border-[#DCDDE0] p-4">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center text-start text-sm font-bold">
                <div className="flex-grow">Collective Instructions to submit an invoice</div>
                <div className="group-data-[state=open]:rotate-180">
                  <ChevronDown size={16} />
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4">
                <HTMLContent content={props.form.options.collectiveExpensePolicy} />
                <div className="mt-4">
                  <MessageBox type="warning">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-normal leading-normal">
                      <Checkbox
                        checked={props.form.values.acknowledgedCollectiveExpensePolicy}
                        onCheckedChange={v =>
                          props.form.setFieldValue('acknowledgedCollectiveExpensePolicy', v as boolean)
                        }
                      />
                      I have read and understood the instructions and conditions
                    </label>
                  </MessageBox>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {expenseTypeOption === ExpenseType.INVOICE && (
        <div className="rounded-md border border-gray-300 p-4">
          <Label>An invoice is required. Do you have one?</Label>
          <Tabs
            value={props.form.values.hasInvoiceOption}
            onValueChange={newValue => props.form.setFieldValue('hasInvoiceOption', newValue as YesNoOption)}
          >
            <TabsList>
              <TabsTrigger value={YesNoOption.YES}>Yes, I have an invoice</TabsTrigger>
              <TabsTrigger value={YesNoOption.NO}>No, generate an invoice for me</TabsTrigger>
            </TabsList>
            <TabsContent value={YesNoOption.YES}>
              <div className="flex items-start gap-4">
                <div className="flex-grow basis-0">
                  <Label className="mb-2 flex gap-2">
                    Attach your invoice file <Lock size={14} />
                  </Label>
                  <div>
                    <StyledDropzone
                      {...attachmentDropzoneParams}
                      name="invoice"
                      // size={112}
                      width={1}
                      collectFilesOnly
                      showActions
                      isMulti={false}
                      value={props.form.values.invoiceFile}
                      onSuccess={files => {
                        props.form.setFieldValue('invoiceFile', files ? files[0] : null);
                      }}
                    />
                  </div>
                </div>
                <div className="flex-grow basis-0">
                  <Label className="mb-2 flex gap-2">
                    Invoice number <Lock size={14} />
                  </Label>
                  <Input type="text" placeholder="e.g. INV 001" {...props.form.getFieldProps('invoiceNumber')} />
                  <span className="mt-2 text-xs text-muted-foreground">
                    The unique identifier mentioned on your invoice
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </FormSectionContainer>
  );
}
