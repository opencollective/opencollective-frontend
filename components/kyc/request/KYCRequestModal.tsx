import React from 'react';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '@/lib/constants/collectives';
import { API_V2_CONTEXT, gql } from '@/lib/graphql/helpers';
import type {
  AccountReferenceInput,
  KycRequestModalQuery,
  KycRequestModalQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import type { BaseModalProps } from '../../ModalContext';
import { Dialog, DialogContent } from '../../ui/Dialog';
import { kycVerificationFields } from '../graphql';

import { ManualKYCRequest } from './manual/ManualKYCRequest';
import { KYCRequestIntroduction } from './KYCRequestIntroduction';

enum Steps {
  INTRODUCTION = 'INTRODUCTION',
  MANUAL_REQUEST_FORM = 'MANUAL_REQUEST_FORM',
}

type KYCRequestModalProps = {
  requestedByAccount: AccountReferenceInput;
  verifyAccount: AccountReferenceInput;
  refetchQueries?: string[];
} & BaseModalProps;

export function KYCRequestModal(props: KYCRequestModalProps) {
  const query = useQuery<KycRequestModalQuery, KycRequestModalQueryVariables>(
    gql`
      query KYCRequestModal($requestedByAccountSlug: String!, $verifyAccountId: String!) {
        requestedByAccount: account(slug: $requestedByAccountSlug) {
          id
          name
          settings
        }
        verifyAccount: account(id: $verifyAccountId) {
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
      context: API_V2_CONTEXT,
      variables: {
        requestedByAccountSlug: props.requestedByAccount.slug,
        verifyAccountId: props.verifyAccount.id,
      },
    },
  );

  return (
    <Dialog open={props.open} onOpenChange={isOpen => props.setOpen(isOpen)}>
      <DialogContent className="sm:min-w-[600px]">
        {query.loading && <Loading />}
        {query.error && <MessageBoxGraphqlError error={query.error} />}
        {query.data?.verifyAccount?.type && query.data?.verifyAccount?.type !== CollectiveType.INDIVIDUAL && (
          <MessageBox type="error" withIcon>
            <FormattedMessage defaultMessage="The account you are trying to verify is not an individual." id="2o+1Ic" />
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
  setOpen: (open: boolean) => void;
};

function KYCRequestModalContent(props: KYCRequestModalContentProps) {
  const [step, setStep] = React.useState<Steps>(
    props.skipIntroductionSet ? Steps.MANUAL_REQUEST_FORM : Steps.INTRODUCTION,
  );

  return (
    <React.Fragment>
      {step === Steps.INTRODUCTION && (
        <KYCRequestIntroduction
          skipIntroductionSet={
            get(props.data.requestedByAccount.settings, 'kyc.skipRequestIntroduction', false) === true
          }
          onNext={() => setStep(Steps.MANUAL_REQUEST_FORM)}
          requestedByAccount={props.requestedByAccount}
        />
      )}
      {step === Steps.MANUAL_REQUEST_FORM && (
        <ManualKYCRequest
          onNext={() => props.setOpen(false)}
          onBack={() => setStep(Steps.INTRODUCTION)}
          requestedByAccount={props.requestedByAccount}
          verifyAccount={props.verifyAccount}
          refetchQueries={props.refetchQueries}
        />
      )}
    </React.Fragment>
  );
}
