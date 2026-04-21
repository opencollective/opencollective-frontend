import React from 'react';
import { useMutation } from '@apollo/client';
import type { FieldMetaProps } from 'formik';
import { Field, useFormikContext } from 'formik';
import { isEmpty, pick } from 'lodash';
import { AlertCircle, Lock } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { i18nGraphqlException } from '../../../lib/errors';
import { AccountType, ExpenseStatus, ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import {
  PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER,
  PAYEE_SLUG_INVITE,
  PAYEE_SLUG_INVITE_EXISTING_USER,
  PAYEE_SLUG_INVITE_SOMEONE,
  PAYEE_SLUG_NEW_VENDOR,
  PAYEE_SLUG_VENDOR,
} from '@/components/expenses/lib/constants';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { FormField } from '@/components/FormField';
import LoginBtn from '@/components/LoginBtn';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import VendorForm from '@/components/vendors/VendorForm';

import CollectivePicker from '../../CollectivePicker';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import MessageBox from '../../MessageBox';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupCard } from '../../ui/RadioGroup';
import { Separator } from '../../ui/Separator';
import { useToast } from '../../ui/useToast';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { ExpenseAccountItem } from './ExpenseAccountItem';
import { FormSectionContainer } from './FormSectionContainer';
import { memoWithGetFormProps } from './helper';
import { InviteUserOption } from './InviteUserOption';
import { updateAccountLegalNameMutation } from './mutations';

type WhoIsGettingPaidSectionProps = {
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
} & ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    ...pick(form, 'initialLoading', 'setFieldValue', 'setFieldTouched', 'refresh', 'isSubmitting'),
    ...pick(form.options, [
      'payoutProfiles',
      'recentlySubmittedExpenses',
      'payee',
      'allowInvite',
      'lockedFields',
      'expense',
      'loggedInAccount',
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
    <FormSectionContainer step={Step.WHO_IS_GETTING_PAID} inViewChange={inViewChange}>
      <WhoIsGettingPaidForm {...rest} />
    </FormSectionContainer>
  );
}, getFormProps);

// eslint-disable-next-line prefer-arrow-callback
export const WhoIsGettingPaidForm = memoWithGetFormProps(function WhoIsGettingPaidForm(
  props: ReturnType<typeof getFormProps>,
) {
  const [isLoading, setIsLoading] = React.useState(true);
  const intl = useIntl();
  const [lastUsedProfile, setLastUsedProfile] = React.useState<ExpenseForm['options']['payoutProfiles'][number]>(null);
  const [isMyOtherProfilesSelected, setIsMyOtherProfilesSelected] = React.useState(false);

  const myProfiles = React.useMemo(() => props.payoutProfiles || [], [props.payoutProfiles]);
  const personalProfile = React.useMemo(() => myProfiles.find(p => p.type === AccountType.INDIVIDUAL), [myProfiles]);

  const otherProfiles = React.useMemo(
    () => myProfiles.filter(p => p.slug !== personalProfile?.slug && p.slug !== lastUsedProfile?.slug),
    [lastUsedProfile?.slug, myProfiles, personalProfile?.slug],
  );
  const hasOtherProfiles = otherProfiles.length > 0;
  const isInvite = [PAYEE_SLUG_INVITE_SOMEONE, PAYEE_SLUG_INVITE, PAYEE_SLUG_INVITE_EXISTING_USER].includes(
    props.payeeSlug,
  );

  const { setFieldValue, setFieldTouched } = props;
  React.useEffect(() => {
    const myProfileSlugs = myProfiles.map(m => m.slug);
    const recentExpensesToMyProfiles = props.recentlySubmittedExpenses?.nodes?.filter(
      e => e?.payee?.slug && myProfileSlugs.includes(e.payee.slug),
    );

    const lastUsedProfileId = recentExpensesToMyProfiles?.length > 0 && recentExpensesToMyProfiles.at(0).payee?.id;

    const lastUsed = props.payoutProfiles?.find(p => p.id === lastUsedProfileId);

    if (lastUsed) {
      setLastUsedProfile(lastUsed);
    } else {
      setLastUsedProfile(null);
    }

    let newPayeeSlug = props.payeeSlug;
    if (!newPayeeSlug) {
      if (recentExpensesToMyProfiles?.length > 0) {
        newPayeeSlug = recentExpensesToMyProfiles.at(0).payee.slug;
      } else if (personalProfile) {
        newPayeeSlug = personalProfile.slug;
      }
      setFieldValue('payeeSlug', newPayeeSlug);
    }

    const otherProfileSelection = otherProfiles.find(p => p.slug === newPayeeSlug);
    const isMyOtherProfilesSelected =
      hasOtherProfiles &&
      (!newPayeeSlug || newPayeeSlug === PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER || !!otherProfileSelection);
    setIsMyOtherProfilesSelected(isMyOtherProfilesSelected);

    if (!props.initialLoading) {
      setIsLoading(false);
    }
  }, [
    props.payoutProfiles,
    props.recentlySubmittedExpenses,
    myProfiles,
    setFieldValue,
    props.payeeSlug,
    personalProfile,
    otherProfiles,
    hasOtherProfiles,
    lastUsedProfile?.slug,
    props.initialLoading,
  ]);

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
            showSubcontent={props.payeeSlug === lastUsedProfile.slug && isEmpty(lastUsedProfile.legalName)}
            subContent={<LegalNameWarning account={lastUsedProfile} onLegalNameUpdate={props.refresh} />}
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
              !isLoading && props.payeeSlug === personalProfile.slug && isEmpty(personalProfile.legalName)
            }
            subContent={<LegalNameWarning account={personalProfile} onLegalNameUpdate={props.refresh} />}
            className="min-w-0"
          >
            {isLoading ? <Skeleton className="h-6 w-full" /> : <ExpenseAccountItem account={personalProfile} />}
          </RadioGroupCard>
        )}

        {!isLoading && hasOtherProfiles && (
          <RadioGroupCard
            value={PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER}
            checked={isMyOtherProfilesSelected}
            showSubcontent={isMyOtherProfilesSelected}
            disabled={props.isSubmitting}
            className="min-w-0"
            subContent={
              <div>
                <CollectivePicker
                  disabled={props.isSubmitting}
                  collectives={otherProfiles}
                  collective={props.payeeSlug === PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER ? null : props.payee}
                  onChange={e => {
                    const slug = e.value.slug;
                    setFieldValue('payeeSlug', !slug ? PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER : slug);
                  }}
                />
              </div>
            }
          >
            <FormattedMessage defaultMessage="An account I administer" id="ZRMBXB" />
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
                  collective={props.payeeSlug === PAYEE_SLUG_INVITE_EXISTING_USER ? props.payee : null}
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

                {props.payeeSlug === PAYEE_SLUG_INVITE_EXISTING_USER && props.payee && (
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

                {props.payeeSlug === PAYEE_SLUG_INVITE && (
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
          if (!meta.error || !meta.value || meta.value.startsWith('__')) {
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
        refresh={form.refresh}
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
  refresh: ExpenseForm['refresh'];
  expenseTypeOption: ExpenseForm['values']['expenseTypeOption'];
}) {
  const { LoggedInUser } = useLoggedInUser();
  const isHostAdmin = LoggedInUser?.isAdminOfCollective(props.host);
  // Setting a state variable to keep the Vendor option open when a vendor that is not part of the preloaded vendors is selected
  const [selectedVendor, setSelectedVendor] = React.useState(undefined);
  const isVendorSelected =
    props.payeeSlug === PAYEE_SLUG_VENDOR ||
    props.payeeSlug === PAYEE_SLUG_NEW_VENDOR ||
    props.vendorsForAccount.some(v => v.slug === props.payeeSlug) ||
    selectedVendor?.slug === props.payeeSlug;

  const isBeneficiary = props.expenseTypeOption === ExpenseType.GRANT;

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
            types={['VENDOR']}
            creatable={isHostAdmin ? ['VENDOR'] : false}
            includeVendorsForHostId={props.host.legacyId}
            disabled={props.isSubmitting}
            defaultCollectives={props.vendorsForAccount}
            collective={
              props.payeeSlug === PAYEE_SLUG_VENDOR || props.payeeSlug === PAYEE_SLUG_NEW_VENDOR
                ? null
                : selectedVendor || props.payee
            }
            handleCreateForm
            onCreateClick={() => {
              props.setFieldValue('payeeSlug', PAYEE_SLUG_NEW_VENDOR);
              setSelectedVendor(null);
            }}
            onChange={e => {
              const selected = e.value;
              const slug = selected?.slug;
              setSelectedVendor(selected);
              props.setFieldValue('payeeSlug', !slug ? PAYEE_SLUG_VENDOR : slug);
            }}
            vendorVisibleToAccountIds={props.account.legacyId}
          />
          {props.payeeSlug === PAYEE_SLUG_NEW_VENDOR && (
            <React.Fragment>
              <Separator className="mt-3" />
              <div className="mt-3">
                <VendorForm
                  isBeneficiary={isBeneficiary}
                  limitVisibilityOptionToAccount={props.account}
                  onSuccess={selected => {
                    props.setFieldValue('payeeSlug', selected?.slug);
                    setSelectedVendor(selected);
                  }}
                  hidePayoutMethod
                  host={props.host}
                  supportsTaxForm={false}
                  onCancel={() => {
                    props.setFieldValue('payeeSlug', PAYEE_SLUG_VENDOR);
                    setSelectedVendor(null);
                  }}
                />
              </div>
            </React.Fragment>
          )}
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
  account: ExpenseForm['options']['payoutProfiles'][number];
  onLegalNameUpdate: () => void;
}) {
  const intl = useIntl();
  const { toast } = useToast();
  const [legalName, setLegalName] = React.useState('');
  const [legalNameUpdated, setLegalNameUpdated] = React.useState(false);
  const timeoutRef = React.useRef(null);

  const [submitLegalNameMutation, { loading }] = useMutation(updateAccountLegalNameMutation, {
    variables: {
      account: {
        id: props.account.id,
        legalName,
      },
    },
  });

  const { onLegalNameUpdate } = props;
  const handleLegalNameUpdate = React.useCallback(() => {
    const timeout = setTimeout(() => {
      onLegalNameUpdate();
    }, 5000);
    setLegalNameUpdated(true);
    timeoutRef.current = timeout;
  }, [onLegalNameUpdate]);

  React.useEffect(() => {
    return () => timeoutRef.current && clearTimeout(timeoutRef.current);
  }, []);

  const onSubmitLegalName = React.useCallback(async () => {
    try {
      await submitLegalNameMutation();
      handleLegalNameUpdate();
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Legal name updated', id: 'aLu6aT' }),
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  }, [submitLegalNameMutation, toast, intl, handleLegalNameUpdate]);

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
