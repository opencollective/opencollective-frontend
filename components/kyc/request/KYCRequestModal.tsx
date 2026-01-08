import React from 'react';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '@/lib/constants/collectives';
import { gql } from '@/lib/graphql/helpers';
import type {
  AccountReferenceInput,
  KycRequestModalQuery,
  KycRequestModalQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import { type Account, KycProvider } from '@/lib/graphql/types/v2/schema';

import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import type { BaseModalProps } from '../../ModalContext';
import { Dialog, DialogContent } from '../../ui/Dialog';
import { kycVerificationFields } from '../graphql';

import { ManualKYCRequest } from './manual/ManualKYCRequest';
import { PersonaKYCRequest } from './persona/PersonaKYCRequest';
import { KYCRequestIntroduction } from './KYCRequestIntroduction';
import { KYCRequestPickUser } from './KYCRequestPickUser';

enum Steps {
  INTRODUCTION = 'INTRODUCTION',
  PICK_USER = 'PICK_USER',
  PROVIDER_FORM = 'PROVIDER_FORM',
}

export type KYCRequestModalProviderOptions = {
  persona?: {
    isImport?: boolean;
  };
};

type KYCRequestModalProps = {
  requestedByAccount: AccountReferenceInput;
  verifyAccount: AccountReferenceInput;
  refetchQueries?: string[];
  provider: KycProvider;
  providerOptions?: KYCRequestModalProviderOptions;
} & BaseModalProps;

export function KYCRequestModal(props: KYCRequestModalProps) {
  const isAccountSelected = !!props.verifyAccount;
  const query = useQuery<KycRequestModalQuery, KycRequestModalQueryVariables>(
    gql`
      query KYCRequestModal($requestedByAccountSlug: String!, $verifyAccountId: String, $isAccountSelected: Boolean!) {
        requestedByAccount: account(slug: $requestedByAccountSlug) {
          id
          name
          settings
          personaConnectedAccount: connectedAccounts(service: persona) {
            id
          }
        }
        verifyAccount: account(id: $verifyAccountId) @include(if: $isAccountSelected) {
          id
          name
          type
          ... on Individual {
            kycStatus(requestedByAccount: { slug: $requestedByAccountSlug }) {
              manual {
                ...KYCVerificationFields
              }
            }
          }
        }
      }
      ${kycVerificationFields}
    `,
    {
      variables: {
        requestedByAccountSlug: props.requestedByAccount.slug,
        verifyAccountId: props.verifyAccount?.id,
        isAccountSelected,
      },
    },
  );

  return (
    <Dialog open={props.open} onOpenChange={isOpen => props.setOpen(isOpen)}>
      <DialogContent className="sm:min-w-[600px]">
        {query.loading && <Loading />}
        {query.error && <MessageBoxGraphqlError error={query.error} />}
        {isAccountSelected &&
          query.data?.verifyAccount?.type &&
          query.data?.verifyAccount?.type !== CollectiveType.INDIVIDUAL && (
            <MessageBox type="error" withIcon>
              <FormattedMessage
                defaultMessage="The account you are trying to verify is not an individual."
                id="2o+1Ic"
              />
            </MessageBox>
          )}

        {query.data && (
          <KYCRequestModalContent
            requestedByAccount={props.requestedByAccount}
            verifyAccount={props.verifyAccount}
            refetchQueries={props.refetchQueries}
            skipIntroductionSet={
              get(query.data?.requestedByAccount?.settings, 'kyc.skipRequestIntroduction', false) === true
            }
            data={query.data}
            provider={props.provider}
            providerOptions={props.providerOptions}
            setOpen={props.setOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type KYCRequestModalContentProps = {
  requestedByAccount: AccountReferenceInput;
  verifyAccount: AccountReferenceInput;
  refetchQueries?: string[];
  skipIntroductionSet: boolean;
  data: KycRequestModalQuery;
  provider: KycProvider;
  providerOptions?: KYCRequestModalProviderOptions;
  setOpen: (open: boolean) => void;
};

function KYCRequestModalContent(props: KYCRequestModalContentProps) {
  const [selectedAccount, setSelectedAccount] = React.useState<Account>(null);
  const hasPickUserStep = !props.verifyAccount;

  const [step, setStep] = React.useState<Steps>(
    props.skipIntroductionSet ? (hasPickUserStep ? Steps.PICK_USER : Steps.PROVIDER_FORM) : Steps.INTRODUCTION,
  );

  const verifyAccountReferenceInput = React.useMemo(() => {
    if (selectedAccount) {
      return {
        slug: selectedAccount.slug,
      };
    }
    return props.verifyAccount;
  }, [selectedAccount, props.verifyAccount]);

  return (
    <React.Fragment>
      {step === Steps.INTRODUCTION && (
        <KYCRequestIntroduction
          skipIntroductionSet={
            get(props.data.requestedByAccount.settings, 'kyc.skipRequestIntroduction', false) === true
          }
          onNext={() => setStep(hasPickUserStep ? Steps.PICK_USER : Steps.PROVIDER_FORM)}
          requestedByAccount={props.requestedByAccount}
        />
      )}
      {step === Steps.PICK_USER && (
        <KYCRequestPickUser
          onNext={() => setStep(Steps.PROVIDER_FORM)}
          selectedAccount={selectedAccount}
          onSelectedAccountChange={account => setSelectedAccount(account)}
          onBack={() => setStep(Steps.INTRODUCTION)}
        />
      )}
      {step === Steps.PROVIDER_FORM &&
        (props.provider === KycProvider.MANUAL ? (
          <ManualKYCRequest
            backLabel={
              hasPickUserStep ? (
                <FormattedMessage defaultMessage="Back" id="Back" />
              ) : (
                <FormattedMessage defaultMessage="Return to KYC Introduction" id="gL+IfB" />
              )
            }
            onNext={() => props.setOpen(false)}
            onBack={() => setStep(hasPickUserStep ? Steps.PICK_USER : Steps.INTRODUCTION)}
            requestedByAccount={props.requestedByAccount}
            verifyAccount={verifyAccountReferenceInput}
            refetchQueries={props.refetchQueries}
          />
        ) : props.provider === KycProvider.PERSONA ? (
          <PersonaKYCRequest
            backLabel={
              hasPickUserStep ? (
                <FormattedMessage defaultMessage="Back" id="Back" />
              ) : (
                <FormattedMessage defaultMessage="Return to KYC Introduction" id="gL+IfB" />
              )
            }
            hasPersonaConnectedAccount={!!props.data?.requestedByAccount?.personaConnectedAccount?.length}
            onNext={() => props.setOpen(false)}
            onBack={() => setStep(hasPickUserStep ? Steps.PICK_USER : Steps.INTRODUCTION)}
            requestedByAccount={props.requestedByAccount}
            verifyAccount={verifyAccountReferenceInput}
            refetchQueries={props.refetchQueries}
            options={props.providerOptions?.persona}
          />
        ) : null)}
    </React.Fragment>
  );
}
