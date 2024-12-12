import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { isEmpty } from 'lodash';
import { Lock } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { i18nGraphqlException } from '../../../lib/errors';
import { gqlV1 } from '../../../lib/graphql/helpers';
import { AccountType } from '../../../lib/graphql/types/v2/graphql';

import CollectivePicker from '../../CollectivePicker';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import LoadingPlaceholder from '../../LoadingPlaceholder';
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
import { InviteUserOption } from './InviteUserOption';

type WhoIsGettingPaidSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function WhoIsGettingPaidSection(props: WhoIsGettingPaidSectionProps) {
  const [lastUsedProfile, setLastUsedProfile] = React.useState<ExpenseForm['options']['payoutProfiles'][number]>(null);
  const [isMyOtherProfilesSelected, setIsMyOtherProfilesSelected] = React.useState(false);

  const myProfiles = React.useMemo(() => props.form.options.payoutProfiles || [], [props.form.options.payoutProfiles]);
  const personalProfile = React.useMemo(() => myProfiles.find(p => p.type === AccountType.INDIVIDUAL), [myProfiles]);

  const otherProfiles = React.useMemo(
    () => myProfiles.filter(p => p.slug !== personalProfile?.slug && p.slug !== lastUsedProfile?.slug),
    [lastUsedProfile?.slug, myProfiles, personalProfile?.slug],
  );
  const hasOtherProfiles = otherProfiles.length > 0;
  const vendorOptions = props.form.options.vendors || [];

  const isVendorSelected =
    props.form.values.payeeSlug === '__vendor' || vendorOptions.some(v => v.slug === props.form.values.payeeSlug);

  const { setFieldValue, setFieldTouched } = props.form;
  React.useEffect(() => {
    const myProfileSlugs = myProfiles.map(m => m.slug);
    const recentExpensesToMyProfiles = props.form.options.recentlySubmittedExpenses?.nodes?.filter(
      e => e?.payee?.slug && myProfileSlugs.includes(e.payee.slug),
    );

    const lastUsedProfileId = recentExpensesToMyProfiles?.length > 0 && recentExpensesToMyProfiles.at(0).payee?.id;

    const lastUsed = props.form.options.payoutProfiles?.find(p => p.id === lastUsedProfileId);

    if (lastUsed) {
      setLastUsedProfile(lastUsed);
    } else {
      setLastUsedProfile(null);
    }

    let newPayeeSlug = props.form.values.payeeSlug;
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
  }, [
    props.form.options.payoutProfiles,
    props.form.options.recentlySubmittedExpenses,
    myProfiles,
    setFieldValue,
    props.form.values.payeeSlug,
    personalProfile,
    otherProfiles,
    hasOtherProfiles,
    isVendorSelected,
    lastUsedProfile?.slug,
  ]);

  return (
    <FormSectionContainer step={Step.WHO_IS_GETTING_PAID} form={props.form} inViewChange={props.inViewChange}>
      <RadioGroup
        id="payeeSlug"
        value={props.form.values.payeeSlug}
        onValueChange={payeeSlug => {
          setFieldValue('payeeSlug', payeeSlug);
          setFieldTouched('payeeSlug', true);
        }}
      >
        {!props.form.initialLoading && lastUsedProfile && lastUsedProfile?.slug !== personalProfile?.slug && (
          <RadioGroupCard
            value={lastUsedProfile.slug}
            showSubcontent={props.form.values.payeeSlug === lastUsedProfile.slug && isEmpty(lastUsedProfile.legalName)}
            subContent={<LegalNameWarning account={lastUsedProfile} onLegalNameUpdate={props.form.refresh} />}
          >
            <ExpenseAccountItem account={lastUsedProfile} />
          </RadioGroupCard>
        )}

        {(personalProfile || props.form.initialLoading) && (
          <RadioGroupCard
            value={!props.form.initialLoading ? personalProfile.slug : ''}
            disabled={props.form.initialLoading}
            checked={props.form.initialLoading || props.form.values.payeeSlug === personalProfile.slug}
            showSubcontent={
              !props.form.initialLoading &&
              props.form.values.payeeSlug === personalProfile.slug &&
              isEmpty(personalProfile.legalName)
            }
            subContent={<LegalNameWarning account={personalProfile} onLegalNameUpdate={props.form.refresh} />}
          >
            {props.form.initialLoading ? (
              <LoadingPlaceholder height={24} width={1} />
            ) : (
              <ExpenseAccountItem account={personalProfile} />
            )}
          </RadioGroupCard>
        )}

        {!props.form.initialLoading && hasOtherProfiles && (
          <RadioGroupCard
            value="__findAccountIAdminister"
            checked={isMyOtherProfilesSelected}
            showSubcontent={isMyOtherProfilesSelected}
            subContent={
              <div>
                <CollectivePicker
                  collectives={otherProfiles}
                  collective={
                    props.form.values.payeeSlug === '__findAccountIAdminister' ? null : props.form.options.payee
                  }
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

        <RadioGroupCard
          value="__inviteSomeone"
          checked={['__inviteSomeone', '__invite', '__inviteExistingUser'].includes(props.form.values.payeeSlug)}
          showSubcontent={['__inviteSomeone', '__invite', '__inviteExistingUser'].includes(props.form.values.payeeSlug)}
          disabled={props.form.initialLoading}
          subContent={
            <div>
              <CollectivePickerAsync
                inputId="payee-invite-picker"
                onFocus={() => props.form.setFieldValue('payeeSlug', '__inviteSomeone')}
                invitable
                collective={props.form.values.payeeSlug === '__inviteExistingUser' ? props.form.options.payee : null}
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
                    props.form.setFieldValue('inviteeExistingAccount', option.value.slug);
                    props.form.setFieldValue('payeeSlug', '__inviteExistingUser');
                  }
                }}
                onInvite={() => {
                  props.form.setFieldValue('payeeSlug', '__invite');
                }}
              />

              {props.form.values.payeeSlug === '__invite' && (
                <React.Fragment>
                  <Separator className="mt-3" />
                  <div className="mt-3">
                    <InviteUserOption form={props.form} />
                  </div>
                </React.Fragment>
              )}
            </div>
          }
        >
          <FormattedMessage defaultMessage="Invite someone" id="SMZ/xh" />
        </RadioGroupCard>

        {vendorOptions.length > 0 && (
          <RadioGroupCard
            value="__vendor"
            checked={isVendorSelected}
            showSubcontent={isVendorSelected}
            subContent={
              <div>
                <CollectivePicker
                  collectives={vendorOptions}
                  collective={props.form.values.payeeSlug === '__vendor' ? null : props.form.options.payee}
                  onChange={e => {
                    const slug = e.value.slug;
                    setFieldValue('payeeSlug', !slug ? '__vendor' : slug);
                  }}
                />
              </div>
            }
          >
            <FormattedMessage defaultMessage="A vendor" id="rth3eX" />
          </RadioGroupCard>
        )}
      </RadioGroup>
    </FormSectionContainer>
  );
}

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
