import React from 'react';
import type { FieldMetaProps } from 'formik';
import { Field, useFormikContext } from 'formik';
import { isEmpty, isNil, pick } from 'lodash-es';
import { AlertCircle, Lock } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { i18nGraphqlException } from '../../../lib/errors';
import { AccountType, ExpenseStatus, ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import { getPayeeChoice, getPayeeKind, PayeeKind } from '../lib/payee-choice';
import { getLastUsedPayoutProfile } from '../lib/reconcile';
import {
  PAYEE_SLUG_CREATE_LEGAL_ENTITY,
  PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER,
  PAYEE_SLUG_INVITE,
  PAYEE_SLUG_INVITE_EXISTING_USER,
  PAYEE_SLUG_INVITE_SOMEONE,
  PAYEE_SLUG_VENDOR,
} from '@/components/expenses/lib/constants';
import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { FormField } from '@/components/FormField';
import LoginBtn from '@/components/LoginBtn';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { quickCreateVendorCollectivePickerOptions } from '@/components/vendors/QuickCreateVendorCollectiveOption';
import { useQuickCreateVendor } from '@/components/vendors/useQuickCreateVendor';

import CollectivePicker from '../../CollectivePicker';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import MessageBox from '../../MessageBox';
import { Button } from '../../ui/Button';
import { ButtonSet } from '../../ui/ButtonSet';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupCard } from '../../ui/RadioGroup';
import { Separator } from '../../ui/Separator';
import { useToast } from '../../ui/useToast';
import { getExpenseStepHeading, Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { CreateLegalEntityPayeeForm } from './CreateLegalEntityPayeeForm';
import { ExpenseAccountItem } from './ExpenseAccountItem';
import { FormSectionContainer } from './FormSectionContainer';
import { memoWithGetFormProps } from './helper';
import { InviteUserOption } from './InviteUserOption';

type WhoIsGettingPaidSectionProps = {
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
} & ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    ...pick(form, 'initialLoading', 'setFieldValue', 'setFieldTouched', 'actions', 'isSubmitting'),
    ...pick(form.options, [
      'payoutProfiles',
      'recentlySubmittedExpenses',
      'payee',
      'allowInvite',
      'lockedFields',
      'expense',
      'loggedInAccount',
      'host',
    ]),
    ...pick(form.values, ['payeeSlug', 'inviteeAccountType', 'expenseTypeOption']),
  };
}

// eslint-disable-next-line prefer-arrow-callback
export const WhoIsGettingPaidSection = memoWithGetFormProps(function WhoIsGettingPaidSection(
  props: WhoIsGettingPaidSectionProps,
) {
  const { inViewChange, ...rest } = props;
  return (
    <FormSectionContainer
      id={Step.WHO_IS_GETTING_PAID}
      {...getExpenseStepHeading(Step.WHO_IS_GETTING_PAID)}
      inViewChange={inViewChange}
    >
      <WhoIsGettingPaidForm {...rest} />
    </FormSectionContainer>
  );
}, getFormProps);

// eslint-disable-next-line prefer-arrow-callback
export const WhoIsGettingPaidForm = memoWithGetFormProps(function WhoIsGettingPaidForm(
  props: ReturnType<typeof getFormProps>,
) {
  const intl = useIntl();
  const isLoading = props.initialLoading;
  const lastUsedProfile = React.useMemo(
    () => getLastUsedPayoutProfile(pick(props, ['payoutProfiles', 'recentlySubmittedExpenses'])),
    [props.payoutProfiles, props.recentlySubmittedExpenses],
  );

  const myProfiles = React.useMemo(() => props.payoutProfiles || [], [props.payoutProfiles]);
  const personalProfile = React.useMemo(() => myProfiles.find(p => p.type === AccountType.INDIVIDUAL), [myProfiles]);
  const administeredProfiles = React.useMemo(
    () => myProfiles.filter(p => p.slug !== personalProfile?.slug),
    [myProfiles, personalProfile?.slug],
  );

  const otherProfiles = React.useMemo(
    () => myProfiles.filter(p => p.slug !== personalProfile?.slug && p.slug !== lastUsedProfile?.slug),
    [lastUsedProfile?.slug, myProfiles, personalProfile?.slug],
  );
  const singleOtherProfile = administeredProfiles.length === 1 ? otherProfiles[0] : null;
  const hasMultipleOtherProfiles = administeredProfiles.length > 1 && otherProfiles.length > 0;
  const hasAdministeredProfiles = administeredProfiles.length > 0;
  const payeeKind = getPayeeKind(props.payeeSlug);
  const isInvite = getPayeeChoice({ payeeSlug: props.payeeSlug }).isInvite;

  const isUSHostWithTaxFormsEnabled =
    props.host?.location?.country === 'US' && isFeatureEnabled(props.host, FEATURES.TAX_FORMS);
  const isUSEntityRequired = React.useCallback(
    (account: ExpenseForm['options']['payoutProfiles'][number] | ExpenseForm['options']['payee']) => {
      if (!isUSHostWithTaxFormsEnabled || !account) {
        return false;
      }
      const isEligibleType = account.type === AccountType.INDIVIDUAL || account.type === AccountType.ORGANIZATION;
      return isEligibleType && isNil(account.isUSEntity);
    },
    [isUSHostWithTaxFormsEnabled],
  );

  // The payee defaults to the last used profile, or the personal profile (see the form reconcile rules)
  const { setFieldValue, setFieldTouched } = props;
  const isMyOtherProfilesSelected =
    hasMultipleOtherProfiles &&
    (!props.payeeSlug ||
      payeeKind === PayeeKind.FIND_ACCOUNT_I_ADMINISTER ||
      otherProfiles.some(p => p.slug === props.payeeSlug));

  return (
    <React.Fragment>
      <RadioGroup
        id="payeeSlug"
        name="payeeSlug"
        data-cy="payee-selector"
        disabled={props.isSubmitting}
        value={props.payeeSlug}
        onValueChange={payeeSlug => {
          setFieldValue('payeeSlug', payeeSlug);
          setFieldTouched('payeeSlug', true);
        }}
      >
        {!isLoading && lastUsedProfile && lastUsedProfile?.slug !== personalProfile?.slug && (
          <RadioGroupCard
            disabled={props.isSubmitting}
            value={lastUsedProfile.slug}
            showSubcontent={
              props.payeeSlug === lastUsedProfile?.slug &&
              (isEmpty(lastUsedProfile?.legalName) || isUSEntityRequired(lastUsedProfile))
            }
            subContent={
              <div className="flex flex-col gap-2">
                {isEmpty(lastUsedProfile?.legalName) && (
                  <LegalNameWarning account={lastUsedProfile} updateLegalName={props.actions.updateLegalName} />
                )}
                {isUSEntityRequired(lastUsedProfile) && (
                  <USPersonWarning
                    account={lastUsedProfile}
                    updateUSEntityStatus={props.actions.updateUSEntityStatus}
                  />
                )}
              </div>
            }
            className="min-w-0"
          >
            <ExpenseAccountItem account={lastUsedProfile} />
          </RadioGroupCard>
        )}

        {(personalProfile || isLoading) && (
          <RadioGroupCard
            data-cy="payee-myself-option"
            value={!isLoading ? personalProfile.slug : ''}
            disabled={isLoading || props.isSubmitting}
            checked={isLoading ? false : props.payeeSlug === personalProfile.slug}
            showSubcontent={
              !isLoading &&
              props.payeeSlug === personalProfile.slug &&
              (isEmpty(personalProfile?.legalName) || isUSEntityRequired(personalProfile))
            }
            subContent={
              <div className="flex flex-col gap-2">
                {isEmpty(personalProfile?.legalName) && (
                  <LegalNameWarning account={personalProfile} updateLegalName={props.actions.updateLegalName} />
                )}
                {isUSEntityRequired(personalProfile) && (
                  <USPersonWarning
                    account={personalProfile}
                    updateUSEntityStatus={props.actions.updateUSEntityStatus}
                  />
                )}
              </div>
            }
            className="min-w-0"
          >
            {isLoading ? <Skeleton className="h-6 w-full" /> : <ExpenseAccountItem account={personalProfile} />}
          </RadioGroupCard>
        )}

        {!isLoading && singleOtherProfile && (
          <RadioGroupCard
            disabled={props.isSubmitting}
            value={singleOtherProfile.slug}
            showSubcontent={
              props.payeeSlug === singleOtherProfile.slug &&
              (isEmpty(singleOtherProfile.legalName) || isUSEntityRequired(singleOtherProfile))
            }
            subContent={
              <div className="flex flex-col gap-2">
                {isEmpty(singleOtherProfile.legalName) && (
                  <LegalNameWarning account={singleOtherProfile} updateLegalName={props.actions.updateLegalName} />
                )}
                {isUSEntityRequired(singleOtherProfile) && (
                  <USPersonWarning
                    account={singleOtherProfile}
                    updateUSEntityStatus={props.actions.updateUSEntityStatus}
                  />
                )}
              </div>
            }
            className="min-w-0"
          >
            <ExpenseAccountItem account={singleOtherProfile} />
          </RadioGroupCard>
        )}

        {!isLoading && hasMultipleOtherProfiles && (
          <RadioGroupCard
            value={PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER}
            checked={isMyOtherProfilesSelected}
            showSubcontent={isMyOtherProfilesSelected}
            disabled={props.isSubmitting}
            className="min-w-0"
            subContent={
              <div className="flex flex-col gap-2">
                <div>
                  <CollectivePicker
                    disabled={props.isSubmitting}
                    collectives={otherProfiles}
                    collective={payeeKind === PayeeKind.FIND_ACCOUNT_I_ADMINISTER ? null : props.payee}
                    onChange={e => {
                      const slug = e.value.slug;
                      setFieldValue('payeeSlug', !slug ? PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER : slug);
                    }}
                  />
                </div>
                {props.payee && props.payeeSlug === props.payee.slug && (
                  <React.Fragment>
                    {isEmpty(props.payee.legalName) && (
                      <LegalNameWarning account={props.payee} updateLegalName={props.actions.updateLegalName} />
                    )}
                    {isUSEntityRequired(props.payee) && (
                      <USPersonWarning
                        account={props.payee}
                        updateUSEntityStatus={props.actions.updateUSEntityStatus}
                      />
                    )}
                  </React.Fragment>
                )}
              </div>
            }
          >
            <FormattedMessage defaultMessage="An account I administer" id="ZRMBXB" />
          </RadioGroupCard>
        )}

        {!isLoading && !hasAdministeredProfiles && props.loggedInAccount && (
          <RadioGroupCard
            value={PAYEE_SLUG_CREATE_LEGAL_ENTITY}
            checked={payeeKind === PayeeKind.NEW_LEGAL_ENTITY}
            showSubcontent={payeeKind === PayeeKind.NEW_LEGAL_ENTITY}
            disabled={props.isSubmitting}
            className="min-w-0"
            subContent={
              <CreateLegalEntityPayeeForm
                isSubmitting={props.isSubmitting}
                createPayeeOrganization={props.actions.createPayeeOrganization}
              />
            }
          >
            <FormattedMessage
              defaultMessage="I would like to get paid through a legal entity"
              id="SubmitExpense.payee.createLegalEntity"
            />
          </RadioGroupCard>
        )}

        {!isLoading && props.allowInvite && (
          <RadioGroupCard
            value="__inviteSomeone"
            checked={isInvite}
            showSubcontent={isInvite}
            disabled={props.initialLoading || props.isSubmitting}
            className="min-w-0"
            subContent={
              <div>
                <CollectivePickerAsync
                  inputId="payee-invite-picker"
                  disabled={props.isSubmitting}
                  onFocus={() => props.setFieldValue('payeeSlug', PAYEE_SLUG_INVITE_SOMEONE)}
                  invitable
                  expenseType={props.expenseTypeOption}
                  collective={payeeKind === PayeeKind.INVITE_EXISTING_USER ? props.payee : null}
                  types={[
                    CollectiveType.COLLECTIVE,
                    CollectiveType.EVENT,
                    CollectiveType.FUND,
                    CollectiveType.ORGANIZATION,
                    CollectiveType.PROJECT,
                    CollectiveType.USER,
                  ]}
                  onChange={option => {
                    if (option?.value?.id) {
                      props.setFieldValue('inviteeExistingAccount', option.value.slug);
                      props.setFieldValue('payeeSlug', PAYEE_SLUG_INVITE_EXISTING_USER);
                    }
                  }}
                  onInvite={() => {
                    props.setFieldValue('payeeSlug', PAYEE_SLUG_INVITE);
                  }}
                />

                {payeeKind === PayeeKind.INVITE_EXISTING_USER && props.payee && (
                  <React.Fragment>
                    <Separator className="mt-3" />
                    <div className="mt-3">
                      <FormField
                        disabled={props.isSubmitting}
                        isFastField
                        label={intl.formatMessage({ defaultMessage: 'Notes for the recipient', id: '1Wu0qx' })}
                        required={false}
                        name="inviteNote"
                      >
                        {({ field }) => <Textarea className="w-full" {...field} />}
                      </FormField>
                    </div>
                  </React.Fragment>
                )}

                {payeeKind === PayeeKind.INVITE_NEW && (
                  <React.Fragment>
                    <Separator className="mt-3" />
                    <div className="mt-3">
                      <InviteUserOption
                        isSubmitting={props.isSubmitting}
                        inviteeAccountType={props.inviteeAccountType}
                        setFieldValue={props.setFieldValue}
                        lockedFields={props.lockedFields}
                      />
                    </div>
                  </React.Fragment>
                )}
              </div>
            }
          >
            <FormattedMessage defaultMessage="Invite someone" id="SMZ/xh" />
          </RadioGroupCard>
        )}

        {!isLoading && props.expense?.status === ExpenseStatus.DRAFT && !props.loggedInAccount && (
          <RadioGroupCard
            value=""
            checked
            showSubcontent
            disabled={props.initialLoading || props.isSubmitting}
            className="min-w-0"
            subContent={
              <div>
                <InviteUserOption
                  hideNotesField
                  isSubmitting={props.isSubmitting}
                  setFieldValue={setFieldValue}
                  inviteeAccountType={props.inviteeAccountType}
                  lockedFields={props.lockedFields}
                />
                <div className="mt-4">
                  <FormattedMessage
                    id="ExpenseForm.SignUp.SignIn"
                    defaultMessage="We will use this email to create your account. If you already have an account, {loginLink}."
                    values={{ loginLink: <LoginBtn className="p-0" asLink /> }}
                  />
                </div>
              </div>
            }
          >
            <FormattedMessage defaultMessage="New Profile" id="xBIExU" />
          </RadioGroupCard>
        )}

        <VendorOptionWrapper />
      </RadioGroup>
      <Field name="payeeSlug">
        {({ meta }: { meta: FieldMetaProps<string> }) => {
          if (!meta.error || getPayeeKind(meta.value) !== PayeeKind.ACCOUNT) {
            return null;
          }
          return (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                <AlertCircle className="inline-block align-text-bottom" size={16} /> {meta.error}
              </AlertDescription>
            </Alert>
          );
        }}
      </Field>
    </React.Fragment>
  );
}, getFormProps);

function VendorOptionWrapper() {
  const form = useFormikContext() as ExpenseForm;
  const showVendorsOption = form.options.showVendorsOption;
  if (showVendorsOption) {
    return (
      <VendorOption
        isSubmitting={form.isSubmitting}
        setFieldValue={form.setFieldValue}
        payeeSlug={form.values.payeeSlug}
        payee={form.options.payee}
        vendorsForAccount={form.options.vendorsForAccount || []}
        account={form.options.account}
        host={form.options.host}
        expenseTypeOption={form.values.expenseTypeOption}
      />
    );
  }
}

// eslint-disable-next-line prefer-arrow-callback
const VendorOption = React.memo(function VendorOption(props: {
  setFieldValue: ExpenseForm['setFieldValue'];
  isSubmitting: ExpenseForm['isSubmitting'];
  payeeSlug: ExpenseForm['values']['payeeSlug'];
  payee: ExpenseForm['options']['payee'];
  vendorsForAccount: ExpenseForm['options']['vendorsForAccount'];
  account: ExpenseForm['options']['account'];
  host: ExpenseForm['options']['host'];
  expenseTypeOption: ExpenseForm['values']['expenseTypeOption'];
}) {
  const { LoggedInUser } = useLoggedInUser();
  const isHostAdmin = LoggedInUser?.isAdminOfCollective(props.host);
  const isBeneficiary = props.expenseTypeOption === ExpenseType.GRANT;
  const { createVendorFromSearch, isCreatingVendor } = useQuickCreateVendor({
    host: props.host,
    canBeUsedWithAccounts: props.account?.id ? [pick(props.account, 'id')] : [],
    isBeneficiary,
  });
  // Setting a state variable to keep the Vendor option open when a vendor that is not part of the preloaded vendors is selected
  const [selectedVendor, setSelectedVendor] = React.useState(undefined);
  const payeeKind = getPayeeKind(props.payeeSlug);
  const isPickingVendor = payeeKind === PayeeKind.VENDOR_PICKER || payeeKind === PayeeKind.NEW_VENDOR;
  const isVendorSelected =
    isPickingVendor ||
    props.vendorsForAccount.some(v => v.slug === props.payeeSlug) ||
    selectedVendor?.slug === props.payeeSlug;

  return (
    <RadioGroupCard
      value={PAYEE_SLUG_VENDOR}
      checked={isVendorSelected}
      showSubcontent={isVendorSelected}
      disabled={props.isSubmitting}
      className="min-w-0"
      subContent={
        <div>
          <CollectivePickerAsync
            inputId={PAYEE_SLUG_VENDOR}
            useBeneficiaryForVendor={isBeneficiary}
            isSearchable
            loading={isCreatingVendor}
            types={['VENDOR']}
            creatable={isHostAdmin ? ['VENDOR'] : false}
            includeVendorsForHostId={props.host.legacyId}
            disabled={props.isSubmitting}
            defaultCollectives={props.vendorsForAccount}
            collective={isPickingVendor ? null : selectedVendor || props.payee}
            {...(isHostAdmin
              ? quickCreateVendorCollectivePickerOptions(createVendorFromSearch, { isBeneficiary })
              : {})}
            onChange={e => {
              const selected = e.value;
              const slug = selected?.slug;
              setSelectedVendor(selected);
              props.setFieldValue('payeeSlug', !slug ? PAYEE_SLUG_VENDOR : slug);
            }}
            vendorVisibleToAccountIds={props.account.legacyId}
          />
        </div>
      }
    >
      {isBeneficiary ? (
        <FormattedMessage defaultMessage="A beneficiary" id="9/Di6r" />
      ) : (
        <FormattedMessage defaultMessage="A vendor" id="rth3eX" />
      )}
    </RadioGroupCard>
  );
});

function LegalNameWarning(props: {
  account: ExpenseForm['options']['payoutProfiles'][number] | ExpenseForm['options']['payee'];
  updateLegalName: ExpenseForm['actions']['updateLegalName'];
}) {
  const intl = useIntl();
  const { toast } = useToast();
  const [legalName, setLegalName] = React.useState('');
  const [legalNameUpdated, setLegalNameUpdated] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const { updateLegalName } = props;
  const onSubmitLegalName = React.useCallback(async () => {
    try {
      setLoading(true);
      await updateLegalName(props.account.id, legalName);
      setLegalNameUpdated(true);
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Legal name updated', id: 'aLu6aT' }),
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    } finally {
      setLoading(false);
    }
  }, [updateLegalName, props.account.id, legalName, toast, intl]);

  if (legalNameUpdated) {
    return (
      <MessageBox type="success">
        <div>
          <FormattedMessage defaultMessage="Legal name updated" id="aLu6aT" />
        </div>
      </MessageBox>
    );
  }

  return (
    <MessageBox type="warning">
      <div className="mb-2 font-bold">
        <FormattedMessage defaultMessage="Legal name missing" id="Ftj4tT" />
      </div>
      <div className="mb-4">
        <FormattedMessage
          defaultMessage="Your profile is missing a legal name. It is required for you to get paid. It is private information that only collective and fiscal host administrators can see."
          id="F2lGTj"
        />
      </div>
      <Label className="mb-2 flex gap-2">
        <FormattedMessage defaultMessage="Enter legal name" id="6R5m9f" /> <Lock size={14} />
      </Label>
      <Input
        disabled={loading}
        placeholder="E.g. John Doe"
        className="mb-2"
        type="text"
        value={legalName}
        onChange={e => setLegalName(e.target.value)}
      />
      <Button variant="outline" onClick={onSubmitLegalName} disabled={isEmpty(legalName) || loading} loading={loading}>
        <FormattedMessage defaultMessage="Save legal name" id="WslCdZ" />
      </Button>
    </MessageBox>
  );
}

function USPersonWarning(props: {
  account: ExpenseForm['options']['payoutProfiles'][number] | ExpenseForm['options']['payee'];
  updateUSEntityStatus: ExpenseForm['actions']['updateUSEntityStatus'];
}) {
  const intl = useIntl();
  const { toast } = useToast();
  const [isUSEntity, setIsUSEntity] = React.useState<boolean | null>(null);
  const [usPersonUpdated, setUsPersonUpdated] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const { updateUSEntityStatus } = props;
  const onSubmitUSPerson = React.useCallback(async () => {
    try {
      setLoading(true);
      await updateUSEntityStatus(props.account.id, isUSEntity);
      setUsPersonUpdated(true);
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Tax information updated', id: 'NeqwR2' }),
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    } finally {
      setLoading(false);
    }
  }, [updateUSEntityStatus, props.account.id, isUSEntity, toast, intl]);

  if (usPersonUpdated) {
    return (
      <MessageBox type="success">
        <div>
          <FormattedMessage defaultMessage="Tax information updated" id="NeqwR2" />
        </div>
      </MessageBox>
    );
  }

  return (
    <MessageBox type="warning">
      <div className="mb-2 font-bold">
        <FormattedMessage defaultMessage="Are you a US Person or Entity?" id="USPerson.label" />
      </div>
      <div className="mb-4">
        <FormattedMessage
          defaultMessage="US citizen, resident, green card holder, or US-incorporated entity."
          id="USPerson.hint"
        />
      </div>
      <div className="mb-3">
        <ButtonSet
          selected={isUSEntity}
          onChange={value => setIsUSEntity(value)}
          options={[
            { label: <FormattedMessage defaultMessage="Yes" id="a5msuh" />, value: true },
            { label: <FormattedMessage defaultMessage="No" id="oUWADl" />, value: false },
          ]}
        />
      </div>
      <Button variant="outline" onClick={onSubmitUSPerson} disabled={isUSEntity === null || loading} loading={loading}>
        <FormattedMessage defaultMessage="Save" id="save" />
      </Button>
    </MessageBox>
  );
}
