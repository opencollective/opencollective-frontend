import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { useFormikContext } from 'formik';
import { isEmpty, pick } from 'lodash';
import { Lock } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { i18nGraphqlException } from '../../../lib/errors';
import { gqlV1 } from '../../../lib/graphql/helpers';
import { AccountType } from '../../../lib/graphql/types/v2/schema';
import { ExpenseStatus } from '@/lib/graphql/types/v2/graphql';

import LoginBtn from '@/components/LoginBtn';
import StyledInputFormikField from '@/components/StyledInputFormikField';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';

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
    ...pick(form.values, ['payeeSlug', 'inviteeAccountType']),
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
      hasOtherProfiles && (!newPayeeSlug || newPayeeSlug === '__findAccountIAdminister' || !!otherProfileSelection);
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
    <RadioGroup
      id="payeeSlug"
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
        >
          <ExpenseAccountItem account={lastUsedProfile} />
        </RadioGroupCard>
      )}

      {(personalProfile || isLoading) && (
        <RadioGroupCard
          value={!isLoading ? personalProfile.slug : ''}
          disabled={isLoading || props.isSubmitting}
          checked={isLoading ? false : props.payeeSlug === personalProfile.slug}
          showSubcontent={!isLoading && props.payeeSlug === personalProfile.slug && isEmpty(personalProfile.legalName)}
          subContent={<LegalNameWarning account={personalProfile} onLegalNameUpdate={props.refresh} />}
        >
          {isLoading ? <Skeleton className="h-6 w-full" /> : <ExpenseAccountItem account={personalProfile} />}
        </RadioGroupCard>
      )}

      {!isLoading && hasOtherProfiles && (
        <RadioGroupCard
          value="__findAccountIAdminister"
          checked={isMyOtherProfilesSelected}
          showSubcontent={isMyOtherProfilesSelected}
          disabled={props.isSubmitting}
          subContent={
            <div>
              <CollectivePicker
                disabled={props.isSubmitting}
                collectives={otherProfiles}
                collective={props.payeeSlug === '__findAccountIAdminister' ? null : props.payee}
                onChange={e => {
                  const slug = e.value.slug;
                  setFieldValue('payeeSlug', !slug ? '__findAccountIAdminister' : slug);
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
          checked={['__inviteSomeone', '__invite', '__inviteExistingUser'].includes(props.payeeSlug)}
          showSubcontent={['__inviteSomeone', '__invite', '__inviteExistingUser'].includes(props.payeeSlug)}
          disabled={props.initialLoading || props.isSubmitting}
          subContent={
            <div>
              <CollectivePickerAsync
                inputId="payee-invite-picker"
                disabled={props.isSubmitting}
                onFocus={() => props.setFieldValue('payeeSlug', '__inviteSomeone')}
                invitable
                collective={props.payeeSlug === '__inviteExistingUser' ? props.payee : null}
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
                    props.setFieldValue('payeeSlug', '__inviteExistingUser');
                  }
                }}
                onInvite={() => {
                  props.setFieldValue('payeeSlug', '__invite');
                }}
              />

              {props.payeeSlug === '__inviteExistingUser' && props.payee && (
                <React.Fragment>
                  <Separator className="mt-3" />
                  <div className="mt-3">
                    <StyledInputFormikField
                      disabled={props.isSubmitting}
                      isFastField
                      label={intl.formatMessage({ defaultMessage: 'Notes for the recipient (optional)', id: 'd+MntU' })}
                      name="inviteNote"
                    >
                      {({ field }) => <Textarea className="w-full" {...field} />}
                    </StyledInputFormikField>
                  </div>
                </React.Fragment>
              )}

              {props.payeeSlug === '__invite' && (
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
                  defaultMessage="We will use this email to create your account. If you already have an account {loginLink}."
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
  );
}, getFormProps);

function VendorOptionWrapper() {
  const form = useFormikContext() as ExpenseForm;

  return (
    <VendorOption
      isSubmitting={form.isSubmitting}
      setFieldValue={form.setFieldValue}
      payeeSlug={form.values.payeeSlug}
      payee={form.options.payee}
      vendors={form.options.vendors || []}
      host={form.options.host}
    />
  );
}

// eslint-disable-next-line prefer-arrow-callback
const VendorOption = React.memo(function VendorOption(props: {
  setFieldValue: ExpenseForm['setFieldValue'];
  isSubmitting: ExpenseForm['isSubmitting'];
  payeeSlug: ExpenseForm['values']['payeeSlug'];
  payee: ExpenseForm['options']['payee'];
  vendors: ExpenseForm['options']['vendors'];
  host: ExpenseForm['options']['host'];
}) {
  // Setting a state variable to keep the Vendor option open when a vendor that is not part of the preloaded vendors is selected
  const [selectedVendorSlug, setSelectedVendorSlug] = React.useState(undefined);
  const isVendorSelected =
    props.payeeSlug === '__vendor' ||
    props.vendors.some(v => v.slug === props.payeeSlug) ||
    selectedVendorSlug === props.payeeSlug;
  return (
    <React.Fragment>
      {props.vendors.length > 0 && (
        <RadioGroupCard
          value="__vendor"
          checked={isVendorSelected}
          showSubcontent={isVendorSelected}
          disabled={props.isSubmitting}
          subContent={
            <div>
              <CollectivePickerAsync
                inputId="__vendor"
                isSearchable
                types={['VENDOR']}
                includeVendorsForHostId={props.host.legacyId}
                disabled={props.isSubmitting}
                defaultCollectives={props.vendors}
                collective={props.payeeSlug === '__vendor' ? null : props.payee}
                onChange={e => {
                  const slug = e.value.slug;
                  setSelectedVendorSlug(slug);
                  props.setFieldValue('payeeSlug', !slug ? '__vendor' : slug);
                }}
              />
            </div>
          }
        >
          <FormattedMessage defaultMessage="A vendor" id="rth3eX" />
        </RadioGroupCard>
      )}
    </React.Fragment>
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

  const [submitLegalNameMutation, { loading }] = useMutation(
    gqlV1`
    mutation UpdatePayoutProfileLegalName($input: CollectiveInputType!) {
      editCollective(collective: $input) {
        id
        legalName
      }
    }
  `,
    {
      variables: {
        input: {
          id: props.account.legacyId,
          legalName,
        },
      },
      update(cache, result) {
        cache.writeFragment({
          id: `Individual:${props.account.id}`,
          fragment: gql`
            fragment PayoutProfile on Account {
              legalName
            }
          `,
          data: {
            legalName: result.data.editCollective.legalName,
          },
        });
      },
    },
  );

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
      toast({ variant: 'success', message: 'Updated' });
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
        <FormattedMessage defaultMessage=" Save legal name" id="WslCdZ" />
      </Button>
    </MessageBox>
  );
}
