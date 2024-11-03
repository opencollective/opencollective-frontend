import React from 'react';
import { omit, round } from 'lodash';
import { AtSign, Building, Contact, Globe, Lock, Mail } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import { RecurringExpenseIntervals } from '../../../lib/i18n/expense';
import { i18nTaxType } from '../../../lib/i18n/taxes';
import { getExpenseExchangeRateWarningOrError, getTaxAmount, isTaxRateValid } from '../../expenses/lib/utils';

import { AccountHoverCard } from '../../AccountHoverCard';
import AmountWithExchangeRateInfo from '../../AmountWithExchangeRateInfo';
import Avatar from '../../Avatar';
import { AvatarWithLink } from '../../AvatarWithLink';
import DateTime from '../../DateTime';
import ExpenseTypeTag from '../../expenses/ExpenseTypeTag';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import LinkCollective from '../../LinkCollective';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import { PayoutMethodLabel } from '../../PayoutMethodLabel';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import UploadedFilePreview from '../../UploadedFilePreview';
import { PayoutMethodDetails } from '../PayoutMethodDetails';
import { expenseFormStepHasError, Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm, RecurrenceFrequencyOption, YesNoOption } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';

type SummarySectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};
export function SummarySection(props: SummarySectionProps) {
  const intl = useIntl();

  const hasErrors =
    Object.values(Step).some(step => expenseFormStepHasError(props.form, step)) && props.form.submitCount > 0;

  return (
    <FormSectionContainer
      step={Step.SUMMARY}
      form={props.form}
      inViewChange={props.inViewChange}
      title={<FormattedMessage defaultMessage="Review Expense" id="9brjE4" />}
      error={hasErrors ? 'Required' : null}
    >
      <div className="rounded-md border border-gray-300 p-4 text-sm">
        <div className="mb-4 flex justify-between">
          <div className="text-base font-bold">
            {props.form.values.title || <span className="text-muted-foreground">Expense title</span>}
          </div>
          {props.form.values.recurrenceFrequency && props.form.values.recurrenceFrequency !== 'none' && (
            <span className="rounded-xl bg-slate-100 px-3 py-1 font-mono text-xs uppercase text-muted-foreground">
              <FormattedMessage defaultMessage="Recurring" id="v84fNv" />
            </span>
          )}
        </div>
        <div>
          {props.form.values.expenseTypeOption ? (
            <ExpenseTypeTag type={props.form.values.expenseTypeOption} mb={0} mr={0} />
          ) : (
            <span className="text-muted-foreground">
              <FormattedMessage defaultMessage="Expense Type" id="wbd643" />
            </span>
          )}
          {props.form.values.tags?.length > 0 &&
            props.form.values.tags.map(tag => (
              <span
                key={tag}
                className="rounded-xl rounded-es-none rounded-ss-none bg-slate-100 px-3 py-1 text-xs text-slate-800"
              >
                {tag}
              </span>
            ))}
        </div>
        <div className="mt-2 flex gap-2 text-xs">
          <div>
            <FormattedMessage
              id="Expense.SubmittedBy"
              defaultMessage="Submitted by {name}"
              values={{
                name: (
                  <AccountHoverCard
                    account={props.form.options.submitter}
                    trigger={
                      <span>
                        <LinkCollective collective={props.form.options.submitter} noTitle>
                          <span className="font-medium text-foreground underline hover:text-primary">
                            {props.form.options.submitter ? (
                              props.form.options.submitter.name
                            ) : (
                              <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />
                            )}
                          </span>
                        </LinkCollective>
                      </span>
                    }
                  />
                ),
              }}
            />
          </div>
          <div className="text-slate-700">•</div>
          <div>
            <DateTime value={new Date()} dateStyle="medium" />
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-gray-300 p-4 text-sm">
        <Label className="mb-4 font-bold">Items</Label>
        {props.form.values.expenseItems.map(ei => (
          <div
            key={`${ei.description}-${ei.incurredAt}-${ei.amount?.valueInCents}`}
            className="mb-2 border-b border-dotted border-gray-300 pb-2 text-sm last:mb-0 last:border-b-0"
          >
            <div className="flex items-center justify-between gap-4">
              {ei.attachment && (
                <div>
                  <UploadedFilePreview
                    size={40}
                    url={typeof ei.attachment === 'string' ? ei.attachment : ei.attachment.url}
                    border="none"
                  />
                </div>
              )}
              <div className="flex-grow">
                <div>{ei.description || <span className="text-muted-foreground">Item description</span>}</div>
                <div className="text-xs">{ei.incurredAt && <DateTime value={ei.incurredAt} dateStyle="medium" />}</div>
              </div>
              <div className="text-right">
                <FormattedMoneyAmount
                  amount={
                    props.form.options.expenseCurrency !== ei.amount.currency
                      ? ei.amount.exchangeRate?.value
                        ? Math.round(ei.amount.valueInCents * ei.amount.exchangeRate.value)
                        : null
                      : ei.amount.valueInCents
                  }
                  currency={props.form.options.expenseCurrency}
                  showCurrencyCode
                  amountClassName="font-bold"
                />
                {props.form.options.expenseCurrency !== ei.amount.currency && (
                  <div className="mt-1 text-xs">
                    <AmountWithExchangeRateInfo
                      amount={ei.amount as React.ComponentProps<typeof AmountWithExchangeRateInfo>['amount']}
                      invertIconPosition
                      {...getExpenseExchangeRateWarningOrError(
                        intl,
                        ei.amount.exchangeRate,
                        ei.amount.referenceExchangeRate,
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-right">
            {props.form.values.hasTax && props.form.values.tax && (
              <React.Fragment>
                <div>
                  <FormattedMessage defaultMessage="Subtotal:" id="WWhVAU" />
                </div>
                <div>
                  <FormattedMoneyAmount
                    amount={props.form.options.totalInvoicedInExpenseCurrency}
                    precision={2}
                    currency={props.form.options.expenseCurrency}
                    showCurrencyCode
                  />
                </div>
              </React.Fragment>
            )}
            {props.form.values.hasTax && props.form.values.tax && (
              <React.Fragment>
                <span className="captilize">
                  {i18nTaxType(intl, props.form.options.taxType, 'short')}
                  {isTaxRateValid(props.form.values.tax.rate) && ` (${round(props.form.values.tax.rate * 100, 2)}%)`}:
                </span>
                <div>
                  <FormattedMoneyAmount
                    amount={
                      !isTaxRateValid(props.form.values.tax.rate)
                        ? null
                        : getTaxAmount(props.form.options.totalInvoicedInExpenseCurrency, props.form.values.tax)
                    }
                    precision={2}
                    currency={props.form.options.expenseCurrency}
                    showCurrencyCode
                  />
                </div>
              </React.Fragment>
            )}

            <div className="col-span-2 text-right">
              <FormattedMoneyAmount
                amount={
                  props.form.values.hasTax && props.form.values.tax && isTaxRateValid(props.form.values.tax.rate)
                    ? getTaxAmount(props.form.options.totalInvoicedInExpenseCurrency, props.form.values.tax) +
                      props.form.options.totalInvoicedInExpenseCurrency
                    : props.form.options.totalInvoicedInExpenseCurrency
                }
                precision={2}
                currency={props.form.options.expenseCurrency}
                showCurrencyCode
                amountClassName="font-bold"
              />
            </div>
          </div>
        </div>
      </div>
      {props.form.values.additionalAttachments?.length > 0 && (
        <div className="mt-4 rounded-md border border-gray-300 p-4 text-sm">
          <Label className="mb-4 font-bold">Attachments</Label>
          <div className="flex flex-wrap gap-4">
            {props.form.values.additionalAttachments.map(at => (
              <div key={typeof at === 'string' ? at : at.id}>
                <UploadedFilePreview
                  size={60}
                  url={typeof at === 'string' ? at : at.url}
                  border="none"
                  showFileName={typeof at === 'string' ? false : at?.name}
                  fileName={typeof at === 'string' ? null : at?.name}
                  fileSize={typeof at === 'string' ? null : at?.size}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {props.form.values.expenseTypeOption === ExpenseType.INVOICE && (
        <div className="mt-4 rounded-md border border-gray-300 p-4 text-sm">
          <Label className="mb-4 font-bold">Invoice</Label>
          {props.form.values.hasInvoiceOption === YesNoOption.NO ? (
            <div>
              <MessageBox type="info">
                <FormattedMessage defaultMessage="Invoice will be generated once you submit the expense." id="aWQ0X7" />
              </MessageBox>
            </div>
          ) : (
            <div>
              <div className="mb-2">
                {props.form.values.invoiceNumber || (
                  <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Invoice reference number" id="o6znkL" />
                  </span>
                )}
              </div>
              <UploadedFilePreview
                size={60}
                url={
                  typeof props.form.values.invoiceFile === 'string'
                    ? props.form.values.invoiceFile
                    : props.form.values.invoiceFile?.url
                }
              />
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="mt-4 h-fit min-h-32 flex-grow basis-0 rounded-md border border-gray-300 p-4 text-sm">
          <div className="font-bold">
            <FormattedMessage defaultMessage="Who is paying?" id="IdR7BG" />
          </div>
          {props.form.options.account && (
            <React.Fragment>
              <div className="mt-2">
                <AccountHoverCard
                  account={omit(props.form.options.account, 'stats')}
                  trigger={
                    <div className="flex items-center gap-2 truncate font-bold">
                      <AvatarWithLink size={20} account={props.form.options.account} />
                      {props.form.options.account?.name}
                    </div>
                  }
                />
              </div>
              <div className="mt-4">
                <div className="font-bold">
                  <FormattedMessage defaultMessage="Collective balance:" id="cJFNHQ" />
                </div>
                <div className="mt-2">
                  <FormattedMoneyAmount
                    amount={props.form.options.account.stats.balance.valueInCents}
                    currency={props.form.options.account.stats.balance.currency}
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center -space-x-1">
                  {props.form.options.account?.admins?.nodes &&
                    props.form.options.account.admins.nodes.slice(0, 3).map(admin => (
                      <AccountHoverCard
                        key={admin.id}
                        account={admin.account}
                        trigger={
                          <span>
                            <Avatar collective={admin.account} radius={24} />
                          </span>
                        }
                      />
                    ))}
                  {props.form.options.account?.admins?.totalCount > 3 && (
                    <div className="pl-2 text-slate-600">+{props.form.options.account?.admins.totalCount - 3}</div>
                  )}
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
        <div className="mt-4 h-fit min-h-32 flex-grow basis-0 rounded-md border border-gray-300 p-4 text-sm">
          <div className="font-bold">
            <FormattedMessage defaultMessage="Who is getting paid?" id="W5Z+Fm" />
          </div>
          {props.form.options.payee ? (
            <React.Fragment>
              <div className="mt-2">
                <AccountHoverCard
                  account={props.form.options.payee}
                  trigger={
                    <div className="flex items-center gap-2 truncate font-bold">
                      <AvatarWithLink size={20} account={props.form.options.payee} />
                      {props.form.options.payee.name}
                    </div>
                  }
                />
              </div>
              {props.form.options.payee.location && (
                <React.Fragment>
                  <div className="mt-4 flex items-center gap-2 font-bold">
                    <FormattedMessage defaultMessage="Private address" id="RmME7+" /> <Lock size={14} />
                  </div>
                  <div className="mt-2">{props.form.options.payee.location.address}</div>
                  <div>{props.form.options.payee.location.country}</div>
                </React.Fragment>
              )}
            </React.Fragment>
          ) : (
            props.form.options.invitee && (
              <React.Fragment>
                <div className="mt-2 flex items-center gap-2 font-bold">
                  <Contact size={14} />{' '}
                  {props.form.options.invitee.name || <LoadingPlaceholder height={14} width={1} />}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Mail size={14} /> {props.form.options.invitee.email || <LoadingPlaceholder height={14} width={1} />}
                </div>
                {'name' in props.form.options.invitee && props.form.options.invitee.name && (
                  <div className="mt-2 flex items-center gap-2">
                    <Building size={14} /> {props.form.options.invitee.name}
                  </div>
                )}
                {'organization' in props.form.options.invitee && props.form.options.invitee.organization.slug && (
                  <div className="mt-2 flex items-center gap-2">
                    <AtSign size={14} /> {props.form.options.invitee.organization.slug}
                  </div>
                )}
                {'organization' in props.form.options.invitee && props.form.options.invitee.organization.website && (
                  <div className="mt-2 flex items-center gap-2">
                    <Globe size={14} /> {props.form.options.invitee.organization.website}
                  </div>
                )}
              </React.Fragment>
            )
          )}
        </div>
        <div className="col-span-2 h-fit flex-grow basis-0 rounded-md border border-gray-300 p-4 text-sm">
          <div className="font-bold">Payout Method</div>
          {expenseFormStepHasError(props.form, Step.PAYOUT_METHOD) ? null : !props.form.options.isAdminOfPayee ? (
            <React.Fragment>
              <div className="mt-2 text-sm text-muted-foreground">
                <FormattedMessage
                  defaultMessage="The person you are inviting to submit this expense will be asked to provide payout method details."
                  id="LHdznY"
                />
              </div>
            </React.Fragment>
          ) : (
            props.form.options.payee &&
            props.form.options.payoutMethod?.type && (
              <div className="mt-2">
                <PayoutMethodLabel showIcon payoutMethod={props.form.options.payoutMethod} />
                <div className="mt-4 grid grid-cols-3 gap-2 *:p-2 *:last:mb-0">
                  <PayoutMethodDetails payoutMethod={props.form.options.payoutMethod} />
                </div>
              </div>
            )
          )}
        </div>
      </div>
      <RecurrenceOptionBox form={props.form} />
    </FormSectionContainer>
  );
}

function RecurrenceOptionBox(props: { form: ExpenseForm }) {
  const intl = useIntl();
  const [isEditingRecurrence, setIsEdittingRecurrence] = React.useState(false);
  const [recurrenceFrequencyEdit, setRecurrenceFrequencyEdit] = React.useState(props.form.values.recurrenceFrequency);
  const [recurrenceEndAtEdit, setRecurrenceEndAtEdit] = React.useState(props.form.values.recurrenceEndAt);

  const recurrenceFrequency = isEditingRecurrence ? recurrenceFrequencyEdit : props.form.values.recurrenceFrequency;
  const recurrenceEndAt = isEditingRecurrence ? recurrenceEndAtEdit : props.form.values.recurrenceEndAt;

  const { setFieldValue } = props.form;
  React.useEffect(() => {
    if (props.form.values.expenseItems.length === 1 && !props.form.touched.title) {
      setFieldValue('title', props.form.values.expenseItems[0].description);
    }
  }, [props.form.values.expenseItems, props.form.touched.title, setFieldValue]);

  return (
    <div className="mt-4">
      <MessageBox type="info">
        <div className="mb-4 font-bold">
          <FormattedMessage defaultMessage="Expense Recurrence" id="JnFWfB" />
        </div>
        {!recurrenceFrequency ||
          (recurrenceFrequency === 'none' && (
            <div>
              <FormattedMessage
                defaultMessage="This expense will be submitted as a one-time expense. To make this a recurring expense, please specify the frequency."
                id="4j+TF1"
              />
            </div>
          ))}

        {recurrenceFrequency && recurrenceFrequency !== 'none' && (
          <div>
            <span>
              <FormattedMessage
                defaultMessage="Once submitted, you will also be prompted to review and submit a copy of this expense every {recurrenceFrequency, select, week {week} month {month} quarter {quarter} year {year} other {}}."
                id="I3xpNh"
                values={{
                  recurrenceFrequency: recurrenceFrequency,
                }}
              />
            </span>
            {recurrenceEndAt && (
              <span>
                &nbsp;
                <FormattedMessage
                  defaultMessage="The prompts will stop on {date}."
                  id="LiFjWf"
                  values={{
                    date: <FormattedDate dateStyle="medium" value={recurrenceEndAt} />,
                  }}
                />
              </span>
            )}
          </div>
        )}
        {!isEditingRecurrence && (
          <Button
            disabled={props.form.initialLoading}
            onClick={() => setIsEdittingRecurrence(true)}
            className="mt-2 p-0 text-sm"
            size="xs"
            variant="link"
          >
            <FormattedMessage defaultMessage="Edit recurrence frequency" id="E997St" />
          </Button>
        )}

        {isEditingRecurrence && (
          <div>
            <div className="my-4 border-t border-dotted border-gray-400" />
            <Label className="mb-2">
              <FormattedMessage defaultMessage="Frequency" id="Frequency" />
            </Label>
            <Select
              value={recurrenceFrequency}
              onValueChange={newValue => setRecurrenceFrequencyEdit(newValue as RecurrenceFrequencyOption)}
            >
              <SelectTrigger data-cy="language-switcher">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="truncate">
                    <SelectValue placeholder={intl.formatMessage({ defaultMessage: 'Select one', id: 'aJxdzZ' })} />
                  </span>
                </div>
              </SelectTrigger>

              <SelectContent className="relative max-h-80 max-w-full">
                <SelectItem value={RecurrenceFrequencyOption.NONE}>
                  <FormattedMessage defaultMessage="None" id="450Fty" />
                </SelectItem>
                <SelectItem value={RecurrenceFrequencyOption.WEEK}>{RecurringExpenseIntervals.week}</SelectItem>
                <SelectItem value={RecurrenceFrequencyOption.MONTH}>{RecurringExpenseIntervals.month}</SelectItem>
                <SelectItem value={RecurrenceFrequencyOption.QUARTER}>{RecurringExpenseIntervals.quarter}</SelectItem>
                <SelectItem value={RecurrenceFrequencyOption.YEAR}>{RecurringExpenseIntervals.year}</SelectItem>
              </SelectContent>
            </Select>

            {recurrenceFrequency && recurrenceFrequency !== 'none' && (
              <React.Fragment>
                <Label className="mb-2 mt-4">
                  <FormattedMessage defaultMessage="End Date" id="EndDate" />
                </Label>
                <Input type="date" value={recurrenceEndAt} onChange={e => setRecurrenceEndAtEdit(e.target.value)} />
              </React.Fragment>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  props.form.setFieldValue('recurrenceEndAt', recurrenceEndAtEdit);
                  props.form.setFieldValue('recurrenceFrequency', recurrenceFrequencyEdit);
                  setIsEdittingRecurrence(false);
                }}
                variant="outline"
              >
                <FormattedMessage defaultMessage="Save changes" id="X0ha1a" />
              </Button>
              <Button
                onClick={() => {
                  setRecurrenceEndAtEdit(props.form.values.recurrenceEndAt);
                  setRecurrenceFrequencyEdit(props.form.values.recurrenceFrequency);
                  setIsEdittingRecurrence(false);
                }}
                variant="outline"
              >
                <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
              </Button>
            </div>
          </div>
        )}
      </MessageBox>
    </div>
  );
}
