import React, { useId } from 'react';
import { groupBy, sumBy } from 'lodash';
import { Lock, Trash2 } from 'lucide-react';

import { attachmentDropzoneParams } from '../../expenses/lib/attachments';

import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import StyledDropzone from '../../StyledDropzone';
import StyledInputAmount from '../../StyledInputAmount';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';

type ExpenseItemsSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function ExpenseItemsSection(props: ExpenseItemsSectionProps) {
  const expenseItems = props.form.values.expenseItems;

  const itemsByCurrency = groupBy(expenseItems, 'amount.currency');
  const totalByCurrency = Object.entries(itemsByCurrency).reduce(
    (acc, [currency, items]) => {
      return {
        ...acc,
        [currency]: sumBy(items, 'amount.valueInCents'),
      };
    },
    {} as Record<string, number>,
  );

  const { setFieldValue } = props.form;

  return (
    <FormSectionContainer
      id={Step.EXPENSE_ITEMS}
      inViewChange={props.inViewChange}
      title={'Expense Items'}
      subtitle={
        <div className="flex items-center gap-2">
          (Add the expense items that you’d like to be paid for)
          <Lock size={14} />
        </div>
      }
    >
      {expenseItems.map((ei, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-grow">
            <ExpenseItem form={props.form} index={i} />
          </div>
          <div>
            <Button
              onClick={() => {
                setFieldValue('expenseItems', [...expenseItems.slice(0, i), ...expenseItems.slice(i + 1)]);
              }}
              disabled={expenseItems.length === 1}
              variant="outline"
              size="icon-sm"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex justify-between pr-12">
        <Button
          variant="outline"
          onClick={() =>
            setFieldValue('expenseItems', [
              ...expenseItems,
              {
                amount: { valueInCents: 0, currency: 'USD' },
                description: '',
                incurredAt: new Date().toISOString(),
                attachment: '',
              },
            ])
          }
        >
          Add invoice item
        </Button>
        <div>
          {Object.entries(totalByCurrency).map(([currency, total]) => (
            <div key={currency} className='text-right'>
              <FormattedMoneyAmount currency={currency} showCurrencyCode amount={total} amountClassName='font-bold' />
            </div>
          ))}
        </div>
      </div>
      <div className="my-4 border-t border-gray-200" />
      <AdditionalAttachments form={props.form} />
    </FormSectionContainer>
  );
}

type ExpenseItemProps = {
  index: number;
  form: ExpenseForm;
};

function ExpenseItem(props: ExpenseItemProps) {
  const attachment = props.form.values.expenseItems.at(props.index).attachment;
  const currency = props.form.values.expenseItems.at(props.index).amount.currency;
  const amount = props.form.values.expenseItems.at(props.index).amount.valueInCents;

  const hasAttachment = props.form.options.allowExpenseItemAttachment;

  const descriptionId = useId();
  const dateId = useId();
  const amountId = useId();
  const attachmentId = useId();

  const { setFieldValue } = props.form;

  return (
    <div className="mb-4 rounded-md border border-[#DCDDE0] p-4 [box-shadow:inset_2px_0_0px_0px_#8DCDFF]">
      <div className="flex gap-4">
        {hasAttachment && (
          <div className="flex flex-col">
            <Label className="mb-2" htmlFor={attachmentId}>
              Upload file <i className="font-normal">(optional)</i>
            </Label>
            <div className="flex flex-grow items-center justify-center">
              <StyledDropzone
                {...attachmentDropzoneParams}
                id={attachmentId}
                name={attachmentId}
                value={attachment}
                isMulti={false}
                showActions
                size={112}
                collectFilesOnly
                onSuccess={files => setFieldValue(`expenseItems.${props.index}.attachment`, files[0])}
              />
            </div>
          </div>
        )}
        <div className="flex-grow">
          <div className="mb-2">
            <Label className="mb-1" htmlFor={descriptionId}>
              Item Description
            </Label>
            <Input
              id={descriptionId}
              placeholder="Enter what best describes the item"
              {...props.form.getFieldProps(`expenseItems.${props.index}.description`)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-grow basis-0">
              <Label className="mb-1" htmlFor={dateId}>
                Date
              </Label>
              <Input type="date" id={dateId} {...props.form.getFieldProps(`expenseItems.${props.index}.incurredAt`)} />
            </div>

            <div className="flex-grow basis-0">
              <Label className="mb-1" htmlFor={amountId}>
                Amount
              </Label>
              <StyledInputAmount
                currencyDisplay="FULL"
                hasCurrencyPicker
                currency={currency || 'USD'}
                onCurrencyChange={v => setFieldValue(`expenseItems.${props.index}.amount.currency`, v)}
                id={amountId}
                name={amountId}
                value={amount}
                onChange={v => {
                  setFieldValue(`expenseItems.${props.index}.amount.valueInCents`, v);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type AdditionalAttachmentsProps = {
  form: ExpenseForm;
};

function AdditionalAttachments(props: AdditionalAttachmentsProps) {
  const additionalAttachments = props.form.values.additionalAttachments;

  return (
    <div>
      <Label htmlFor="additionalAttachments">Additional Attachments (Optional)</Label>
      <div className="flex flex-wrap gap-4">
        <div className="mt-2">
          <StyledDropzone
            {...attachmentDropzoneParams}
            name="additionalAttachments"
            size={112}
            collectFilesOnly
            isMulti
            onSuccess={files => {
              props.form.setFieldValue('additionalAttachments', [...additionalAttachments, ...files]);
            }}
          />
        </div>

        {additionalAttachments.map((at, index) => (
          <div key={index}>
            <StyledDropzone
              {...attachmentDropzoneParams}
              name={at.name}
              size={112}
              value={at}
              collectFilesOnly
              showActions
              isMulti
              onSuccess={() => {
                props.form.setFieldValue(
                  'additionalAttachments',
                  additionalAttachments.filter(f => f !== at),
                );
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
