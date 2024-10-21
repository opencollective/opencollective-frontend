import React from 'react';
import { FormikProvider } from 'formik';
import { isEmpty } from 'lodash';
import { ChevronsUpDown, Eye, Lock, Pencil, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { PayoutMethodType } from '../../../lib/graphql/types/v2/graphql';
import { cn } from '../../../lib/utils';

import PayoutMethodForm from '../../expenses/PayoutMethodForm';
import MessageBox from '../../MessageBox';
import { I18nPayoutMethodLabels, PayoutMethodLabel } from '../../PayoutMethodLabel';
import StyledSelect from '../../StyledSelect';
import { Button } from '../../ui/Button';
import { Command, CommandInput, CommandItem, CommandList } from '../../ui/Command';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm, YesNoOption } from '../useExpenseForm';

import { PayoutMethodOption, WhoIsGettingPaidOption } from './experiment';
import { FormSectionContainer } from './FormSectionContainer';

type PayoutMethodSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function PayoutMethodSection(props: PayoutMethodSectionProps) {
  const [lastUsedPayoutMethod, setLastUsedPayoutMethod] = React.useState(null);
  const [isPayoutMethodPickerOpen, setIsPayoutMethodPickerOpen] = React.useState(false);
  const whoIsGettingPaidOption = props.form.values.whoIsGettingPaidOption;
  const payeeAccount = props.form.values.myProfilesExpensePayeePick;

  const payoutMethod = props.form.values.payoutMethodId;
  const payoutMethodOption = props.form.values.payoutMethodOption;

  const loggedInUserIsAdminOfPayee = whoIsGettingPaidOption === WhoIsGettingPaidOption.MY_PROFILES && payeeAccount;

  const payoutMethods = React.useMemo(() => {
    if (loggedInUserIsAdminOfPayee) {
      return props.form.options.payoutProfiles?.find(p => p.slug === payeeAccount)?.payoutMethods || [];
    }

    return [];
  }, [props.form.options.payoutProfiles, loggedInUserIsAdminOfPayee, payeeAccount]);

  const { setFieldValue } = props.form;
  React.useEffect(() => {
    const lastSubmittedExpenseByPayee = props.form.options.recentlySubmittedExpenses?.nodes
      ?.filter(e => e.payee.slug === payeeAccount && e.payoutMethod?.id)
      ?.at(0);
    const lastUsedPayoutMethod = lastSubmittedExpenseByPayee?.payoutMethod?.id;

    if (!props.form.values.payoutMethodId && lastUsedPayoutMethod) {
      setFieldValue('payoutMethodId', lastUsedPayoutMethod);
    } else if (!props.form.values.payoutMethodId) {
      setFieldValue('payoutMethodId', payoutMethods.at(0)?.id);
    }

    if (lastUsedPayoutMethod) {
      setLastUsedPayoutMethod(lastUsedPayoutMethod);
    }
  }, [
    payeeAccount,
    props.form.options.recentlySubmittedExpenses,
    setFieldValue,
    props.form.values.payoutMethodId,
    payoutMethods,
  ]);

  React.useEffect(() => {
    if (props.form.options.payoutProfiles && payeeAccount) {
      const profile = props.form.options.payoutProfiles.find(p => p.slug === payeeAccount);
      if (isEmpty(profile?.payoutMethods)) {
        setFieldValue('payoutMethodOption', PayoutMethodOption.NEW_PAYOUT_METHOD);
      }
    }
  }, [props.form.options.payoutProfiles, payeeAccount, setFieldValue]);

  const selectedPayoutMethod = payoutMethods.find(pm => pm.id === payoutMethod);

  return (
    <FormSectionContainer
      id={Step.PAYOUT_METHOD}
      inViewChange={props.inViewChange}
      title={'Select a payout method'}
      subtitle={'(Where do you want to receive the money)'}
    >
      {!loggedInUserIsAdminOfPayee ? (
        <MessageBox type="info">
          The person you are inviting to submit this expense will be asked to provide payout method details.
        </MessageBox>
      ) : (
        <Tabs
          value={payoutMethodOption}
          onValueChange={newValue => setFieldValue('payoutMethodOption', newValue as PayoutMethodOption)}
        >
          <TabsList>
            {payoutMethods.length > 0 && (
              <TabsTrigger value={PayoutMethodOption.EXISTING_PAYOUT_METHOD}>My Payout Methods</TabsTrigger>
            )}
            <TabsTrigger value={PayoutMethodOption.NEW_PAYOUT_METHOD}>Add new</TabsTrigger>
          </TabsList>
          <TabsContent value={PayoutMethodOption.EXISTING_PAYOUT_METHOD}>
            <div className="flex items-start gap-2">
              <div className="flex-grow">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('mb-4 w-full justify-between', {
                    'mb-0 rounded-b-none border-b-0': isPayoutMethodPickerOpen,
                  })}
                  disabled={!selectedPayoutMethod}
                  onClick={() => setIsPayoutMethodPickerOpen(!isPayoutMethodPickerOpen)}
                >
                  {selectedPayoutMethod ? <PayoutMethodLabel showIcon payoutMethod={selectedPayoutMethod} /> : ''}
                  <ChevronsUpDown className="ml-2 opacity-50" size={16} />
                </Button>
                {!isPayoutMethodPickerOpen &&
                  selectedPayoutMethod &&
                  lastUsedPayoutMethod &&
                  selectedPayoutMethod.id === lastUsedPayoutMethod && (
                    <span className="text-sm text-muted-foreground">
                      Last used payout method for the selected profile
                    </span>
                  )}
                {isPayoutMethodPickerOpen && (
                  <div className="mb-4 rounded-md rounded-t-none border border-gray-200">
                    <Command>
                      <CommandInput autoFocus />
                      <CommandList>
                        {payoutMethods.map(pm => (
                          <CommandItem
                            key={pm.id}
                            value={`${pm.id}`}
                            onSelect={() => {
                              setFieldValue('payoutMethodId', pm.id);
                              setIsPayoutMethodPickerOpen(false);
                            }}
                          >
                            <PayoutMethodLabel showIcon payoutMethod={pm} />
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button disabled size="icon" variant="outline">
                  <Eye size={16} />
                </Button>
                <Button disabled size="icon" variant="outline">
                  <Pencil size={16} />
                </Button>
                <Button disabled size="icon" variant="outline">
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            {!isPayoutMethodPickerOpen && selectedPayoutMethod && isEmpty(selectedPayoutMethod?.data?.currency) && (
              <div className="mt-2">
                <MessageBox type="warning">
                  <div className="mb-2 font-bold">Missing currency</div>
                  <div>Your payout method is missing a currency. Please edit your payout method to update it.</div>
                </MessageBox>
              </div>
            )}
            {!isPayoutMethodPickerOpen &&
              selectedPayoutMethod &&
              selectedPayoutMethod.data?.accountHolderName &&
              props.form.options.payee &&
              selectedPayoutMethod.data.accountHolderName !== props.form.options.payee.legalName && (
                <div className="mt-2">
                  <MessageBox type="warning">
                    <div className="mb-2 font-bold">The names you provided do not match.</div>
                    <div>
                      <FormattedMessage
                        defaultMessage="The legal name in the payee profile is: {legalName}."
                        id="NSammt"
                        values={{
                          legalName: props.form.options.payee.legalName,
                        }}
                      />
                    </div>
                    <div>
                      <FormattedMessage
                        defaultMessage="The contact name in the payout method is: {accountHolderName}."
                        id="XC+vMa"
                        values={{
                          accountHolderName: selectedPayoutMethod.data.accountHolderName,
                        }}
                      />
                    </div>
                    <div>This may delay payment.</div>
                    <Label className="mb-2 mt-4">
                      Would you like to update the payment method contact name to match your legal name?
                    </Label>
                    <Tabs
                      value={props.form.values.updatePayoutMethodNameToMatchProfile}
                      onValueChange={newValue =>
                        setFieldValue('updatePayoutMethodNameToMatchProfile', newValue as YesNoOption)
                      }
                    >
                      <TabsList>
                        <TabsTrigger value={YesNoOption.YES}>Yes, update and match</TabsTrigger>
                        <TabsTrigger value={YesNoOption.NO}>No, keep them different</TabsTrigger>
                      </TabsList>
                      <TabsContent value={YesNoOption.NO}>
                        <Label className="my-2 flex gap-2">
                          Please explain why they are different <Lock size={14} />{' '}
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. divorce, legal name change, etc"
                          {...props.form.getFieldProps('payoutMethodNameDiscrepancyReason')}
                        />
                      </TabsContent>
                    </Tabs>
                  </MessageBox>
                </div>
              )}
          </TabsContent>
          <TabsContent value={PayoutMethodOption.NEW_PAYOUT_METHOD}>
            <NewPayoutMethodOption form={props.form} />
          </TabsContent>
        </Tabs>
      )}
    </FormSectionContainer>
  );
}

type NewPayoutMethodOptionProps = {
  form: ExpenseForm;
};

function NewPayoutMethodOption(props: NewPayoutMethodOptionProps) {
  const intl = useIntl();
  return (
    <FormikProvider value={props.form}>
      <div>
        <Label className="mb-2 flex gap-2" htmlFor="payoutMethodType">
          Choose a payout method <Lock size={14} />
        </Label>
        <StyledSelect
          inputId="payoutMethodType"
          value={
            props.form.values.newPayoutMethod?.type
              ? {
                  value: props.form.values.newPayoutMethod.type,
                  label: intl.formatMessage(I18nPayoutMethodLabels[props.form.values.newPayoutMethod.type]),
                }
              : null
          }
          options={props.form.options.supportedPayoutMethods.map(m => ({
            value: m,
            label: intl.formatMessage(I18nPayoutMethodLabels[m]),
          }))}
          onChange={(option: { value: string }) =>
            props.form.setFieldValue('newPayoutMethod.type', option.value as PayoutMethodType)
          }
        />
        {props.form.values.newPayoutMethod?.type && (
          <PayoutMethodForm
            fieldsPrefix="newPayoutMethod"
            payoutMethod={props.form.values.newPayoutMethod}
            host={props.form.options.host}
          />
        )}
      </div>
    </FormikProvider>
  );
}
