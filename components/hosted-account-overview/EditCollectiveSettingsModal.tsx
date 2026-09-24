import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Form, FormikProvider } from 'formik';
import { clamp, isEmpty, isEqual, round } from 'lodash-es';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { CollectiveType } from '@/lib/constants/collectives';
import EXPENSE_TYPE from '@/lib/constants/expenseTypes';
import { HOST_FEE_STRUCTURE } from '@/lib/constants/host-fee-structure';
import { i18nGraphqlException } from '@/lib/errors';
import { i18nExpenseType } from '@/lib/i18n/expense';

import HeroSocialLinks from '@/components/crowdfunding-redesign/SocialLinks';
import { useFormikZod } from '@/components/FormikZod';
import I18nCollectiveTags from '@/components/I18nCollectiveTags';
import LocationAddress from '@/components/LocationAddress';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataList, DataListItem } from '@/components/ui/DataList';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { InputGroup } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/useToast';

import type { HostedAccountProfileData } from './types';

const editFeeStructureMutation = gql`
  mutation EditCollectiveSettingsFee(
    $account: AccountReferenceInput!
    $hostFeePercent: Float!
    $isCustomFee: Boolean!
  ) {
    editAccountFeeStructure(account: $account, hostFeePercent: $hostFeePercent, isCustomFee: $isCustomFee) {
      id
      ... on AccountWithHost {
        hostFeesStructure
        hostFeePercent
      }
    }
  }
`;

const editExpenseTypesMutation = gql`
  mutation EditCollectiveSettingsExpenseTypes(
    $account: AccountReferenceInput!
    $key: AccountSettingsKey!
    $value: JSON!
  ) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const setPayoutPolicyMutation = gql`
  mutation EditCollectiveSettingsPayoutPolicy($account: AccountReferenceInput!, $value: Boolean!) {
    setPolicies(account: $account, policies: { COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS: $value }) {
      id
      policies {
        id
        COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS
      }
    }
  }
`;

const settingsSchema = z.object({
  isCustomFee: z.boolean(),
  feePercent: z.number().min(0).max(100),
  canSeePayout: z.boolean(),
  expenseCustom: z.boolean(),
  expenseTypes: z.record(z.boolean()),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-4 text-base font-bold text-slate-800">{children}</h3>
);

const DISPLAYED_EXPENSE_TYPES = [EXPENSE_TYPE.INVOICE, EXPENSE_TYPE.RECEIPT, EXPENSE_TYPE.GRANT];

type EditCollectiveSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: HostedAccountProfileData;
  host?: { id?: string; hostFeePercent?: number | null } | null;
};

export function EditCollectiveSettingsModal({ open, onOpenChange, account, host }: EditCollectiveSettingsModalProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const isFund = account?.type === CollectiveType.FUND;
  const globalFeePercent = host?.hostFeePercent ?? 0;

  const initialValues: SettingsValues = React.useMemo(() => {
    const expenseTypes = (account?.settings?.expenseTypes ?? {}) as Record<string, boolean>;
    return {
      isCustomFee: account?.hostFeesStructure === HOST_FEE_STRUCTURE.CUSTOM_FEE,
      feePercent: account?.hostFeePercent ?? globalFeePercent,
      canSeePayout: Boolean(account?.policies?.COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS),
      expenseCustom: !isEmpty(expenseTypes),
      expenseTypes,
    };
  }, [account, globalFeePercent]);

  const [editFee] = useMutation(editFeeStructureMutation);
  const [editExpenseTypes] = useMutation(editExpenseTypesMutation);
  const [setPayoutPolicy] = useMutation(setPayoutPolicyMutation);

  const handleSubmit = async (values: SettingsValues) => {
    if (!account?.id) {
      return;
    }
    const ref = { slug: account.slug };
    const nextExpenseTypes = values.expenseCustom ? values.expenseTypes : {};
    const ops: Promise<unknown>[] = [];

    if (
      values.isCustomFee !== initialValues.isCustomFee ||
      (values.isCustomFee && values.feePercent !== initialValues.feePercent)
    ) {
      ops.push(
        editFee({
          variables: {
            account: ref,
            hostFeePercent: values.isCustomFee ? values.feePercent : globalFeePercent,
            isCustomFee: values.isCustomFee,
          },
        }),
      );
    }
    if (values.canSeePayout !== initialValues.canSeePayout) {
      ops.push(setPayoutPolicy({ variables: { account: { id: account.id }, value: values.canSeePayout } }));
    }
    if (!isEqual(nextExpenseTypes, initialValues.expenseTypes)) {
      ops.push(editExpenseTypes({ variables: { account: ref, key: 'expenseTypes', value: nextExpenseTypes } }));
    }

    try {
      await Promise.all(ops);
      toast({ variant: 'success', message: <FormattedMessage defaultMessage="Settings updated" id="878mRN" /> });
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const formik = useFormikZod<SettingsValues>({ schema: settingsSchema, initialValues, onSubmit: handleSubmit });
  const { values, setFieldValue, resetForm } = formik;

  React.useEffect(() => {
    if (open) {
      resetForm({ values: initialValues });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account?.id]);

  const disabled = formik.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {isFund ? (
              <FormattedMessage defaultMessage="Edit Fund Settings" id="uVOq4X" />
            ) : (
              <FormattedMessage defaultMessage="Edit Collective Settings" id="Qm/pwI" />
            )}
          </DialogTitle>
        </DialogHeader>

        <FormikProvider value={formik}>
          <Form className="flex flex-col gap-4">
            <div className="rounded-lg border p-4">
              <SectionHeader>
                {isFund ? (
                  <FormattedMessage defaultMessage="Fund Detail" id="VnBweD" />
                ) : (
                  <FormattedMessage defaultMessage="Collective Detail" id="nP4H2j" />
                )}
              </SectionHeader>
              <DataList className="text-sm">
                <DataListItem
                  label={
                    isFund ? (
                      <FormattedMessage defaultMessage="Fund name" id="nPLfxb" />
                    ) : (
                      <FormattedMessage defaultMessage="Collective name" id="createCollective.form.nameLabel" />
                    )
                  }
                  value={account?.name || account?.slug}
                />
                {account?.tags?.length > 0 && (
                  <DataListItem
                    label={<FormattedMessage defaultMessage="Tags" id="Tags" />}
                    value={
                      <div className="flex flex-wrap gap-1">
                        {account.tags.map(tag => (
                          <Badge key={tag} size="xs" type="outline">
                            <I18nCollectiveTags tags={tag} />
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                )}
                {account?.socialLinks?.length > 0 && (
                  <DataListItem
                    label={<FormattedMessage defaultMessage="Social Links" id="3bLmoU" />}
                    value={<HeroSocialLinks className="size-6" socialLinks={account.socialLinks} />}
                  />
                )}
                {(account?.location?.address || account?.location?.country) && (
                  <DataListItem
                    label={<FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />}
                    value={<LocationAddress location={account.location} />}
                  />
                )}
              </DataList>
            </div>

            <div className="rounded-lg border p-4">
              <SectionHeader>
                {isFund ? (
                  <FormattedMessage defaultMessage="Fund Settings" id="rFeY/Q" />
                ) : (
                  <FormattedMessage defaultMessage="Collective Settings" id="ClqBb1" />
                )}
              </SectionHeader>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-slate-800">
                    <FormattedMessage defaultMessage="Fee structure" id="FeeStructure" />
                  </span>
                  <Tabs
                    value={values.isCustomFee ? 'custom' : 'global'}
                    onValueChange={value => setFieldValue('isCustomFee', value === 'custom')}
                  >
                    <TabsList>
                      <TabsTrigger value="global" disabled={disabled}>
                        <FormattedMessage
                          defaultMessage="Global ({percent}%)"
                          id="Bb2ain"
                          values={{ percent: globalFeePercent }}
                        />
                      </TabsTrigger>
                      <TabsTrigger value="custom" disabled={disabled}>
                        <FormattedMessage defaultMessage="Custom" id="Sjo1P4" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {values.isCustomFee && (
                    <div className="w-32">
                      <InputGroup
                        append="%"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        disabled={disabled}
                        value={Number.isNaN(values.feePercent) ? '' : values.feePercent}
                        onChange={e => setFieldValue('feePercent', parseFloat(e.target.value))}
                        onBlur={e => setFieldValue('feePercent', clamp(round(parseFloat(e.target.value), 2), 0, 100))}
                        error={Boolean(formik.errors.feePercent)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-slate-800">
                    {isFund ? (
                      <FormattedMessage defaultMessage="Payment Methods visible to fund admins" id="LxUMad" />
                    ) : (
                      <FormattedMessage defaultMessage="Payment Methods visible to collective admins" id="f0PXGj" />
                    )}
                  </span>
                  <Tabs
                    value={values.canSeePayout ? 'show' : 'hide'}
                    onValueChange={value => setFieldValue('canSeePayout', value === 'show')}
                  >
                    <TabsList>
                      <TabsTrigger value="hide" disabled={disabled}>
                        <FormattedMessage defaultMessage="No, Hide Details" id="b8W0w5" />
                      </TabsTrigger>
                      <TabsTrigger value="show" disabled={disabled}>
                        <FormattedMessage defaultMessage="Yes, Show Details" id="5VW8OC" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-slate-800">
                    <FormattedMessage defaultMessage="Expense Types" id="D+aS5Z" />
                  </span>
                  <Tabs
                    value={values.expenseCustom ? 'custom' : 'global'}
                    onValueChange={value => {
                      const next = value === 'custom';
                      setFieldValue('expenseCustom', next);
                      if (next && isEmpty(values.expenseTypes)) {
                        setFieldValue('expenseTypes', { [EXPENSE_TYPE.INVOICE]: true, [EXPENSE_TYPE.RECEIPT]: true });
                      }
                    }}
                  >
                    <TabsList>
                      <TabsTrigger value="global" disabled={disabled}>
                        <FormattedMessage defaultMessage="Global (All types)" id="ecQzjf" />
                      </TabsTrigger>
                      <TabsTrigger value="custom" disabled={disabled}>
                        <FormattedMessage defaultMessage="Custom" id="Sjo1P4" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {values.expenseCustom && (
                    <div className="mt-1 flex flex-col gap-2">
                      {DISPLAYED_EXPENSE_TYPES.map(expenseType => (
                        <label key={expenseType} className="flex items-center gap-2 text-sm font-normal text-slate-700">
                          <input
                            type="checkbox"
                            disabled={disabled}
                            checked={Boolean(values.expenseTypes?.[expenseType])}
                            onChange={() =>
                              setFieldValue('expenseTypes', {
                                ...values.expenseTypes,
                                [expenseType]: !values.expenseTypes?.[expenseType],
                              })
                            }
                          />
                          {i18nExpenseType(intl, expenseType)}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={disabled}>
                <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
              </Button>
              <Button type="submit" loading={formik.isSubmitting} disabled={!formik.dirty || formik.isSubmitting}>
                <FormattedMessage defaultMessage="Save Changes" id="SaveChanges" />
              </Button>
            </DialogFooter>
          </Form>
        </FormikProvider>
      </DialogContent>
    </Dialog>
  );
}
