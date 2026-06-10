import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '@/lib/errors';
import { gql } from '@/lib/graphql/helpers';
import type { Agreement } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { useAgreementActions } from '@/components/agreements/actions';
import AgreementDrawer from '@/components/agreements/AgreementDrawer';
import AgreementsTable from '@/components/agreements/AgreementsTable';
import { AGREEMENT_VIEW_FIELDS_FRAGMENT } from '@/components/agreements/fragments';
import FilesViewerModal from '@/components/FilesViewerModal';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import ConfirmationModal from '@/components/NewConfirmationModal';
import { useToast } from '@/components/ui/useToast';

import type { HostedAccountProfileData } from './types';

const NB_AGREEMENTS = 100;
const NB_PLACEHOLDERS = 5;

const hostedAccountAgreementsQuery = gql`
  query HostedAccountAgreements($hostSlug: String!, $account: [AccountReferenceInput], $limit: Int!, $offset: Int!) {
    host(slug: $hostSlug) {
      id
      legacyId
      slug
      hostedAccountAgreements(limit: $limit, offset: $offset, accounts: $account) {
        totalCount
        nodes {
          id
          ...AgreementViewFields
        }
      }
    }
  }
  ${AGREEMENT_VIEW_FIELDS_FRAGMENT}
`;

const DELETE_AGREEMENT_MUTATION = gql`
  mutation HostedAccountDeleteAgreement($id: String!) {
    deleteAgreement(agreement: { id: $id }) {
      id
    }
  }
`;

type HostedAccountAgreementsTabProps = {
  account?: HostedAccountProfileData;
  hostSlug: string;
};

export function HostedAccountAgreementsTab({ account, hostSlug }: HostedAccountAgreementsTabProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const { LoggedInUser } = useLoggedInUser();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [agreementInDrawer, setAgreementInDrawer] = React.useState<Agreement | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [filePreview, setFilePreview] = React.useState<Agreement | null>(null);
  const [agreementToDelete, setAgreementToDelete] = React.useState<Agreement | null>(null);
  const [deleteAgreement] = useMutation(DELETE_AGREEMENT_MUTATION);

  // Include the main account AND each child account (events/projects)
  const accounts = React.useMemo(() => {
    if (!account?.slug) {
      return [];
    }
    const childRefs = (account.childrenAccounts?.nodes || []).map(child => ({ slug: child.slug }));
    return [{ slug: account.slug }, ...childRefs];
  }, [account]);

  const { data, error, loading, variables, refetch } = useQuery(hostedAccountAgreementsQuery, {
    variables: { hostSlug, account: accounts, limit: NB_AGREEMENTS, offset: 0 },
    skip: !account?.slug,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const canEdit = Boolean(LoggedInUser && !LoggedInUser.isAccountantOnly(data?.host));

  const handleEdit = React.useCallback((agreement: Agreement) => {
    setAgreementInDrawer(agreement);
    setIsEditing(true);
    setDrawerOpen(true);
  }, []);

  const handleDelete = React.useCallback((agreement: Agreement) => {
    setAgreementToDelete(agreement);
    setDrawerOpen(false);
    setIsEditing(false);
  }, []);

  const getActions = useAgreementActions(handleEdit, handleDelete);
  const agreements = data?.host?.hostedAccountAgreements;

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <AgreementsTable
          agreements={agreements}
          loading={loading}
          nbPlaceholders={NB_PLACEHOLDERS}
          onFilePreview={setFilePreview}
          openAgreement={agreement => {
            setDrawerOpen(true);
            setIsEditing(false);
            setAgreementInDrawer(agreement);
          }}
          getActions={getActions}
        />
      )}

      <AgreementDrawer
        open={drawerOpen}
        agreement={agreementInDrawer}
        canEdit={canEdit}
        hostLegacyId={data?.host?.legacyId}
        isEditing={isEditing}
        getActions={getActions}
        onClose={() => {
          setDrawerOpen(false);
          setIsEditing(false);
        }}
        onCreate={() => {
          setDrawerOpen(false);
          setIsEditing(false);
          refetch({ ...variables, offset: 0 });
        }}
        onEdit={updated => {
          setAgreementInDrawer(updated);
          setIsEditing(false);
        }}
        onCancelEdit={() => setIsEditing(false)}
        onDelete={() => {
          setDrawerOpen(false);
          setIsEditing(false);
          refetch(variables);
        }}
      />

      {filePreview && (
        <FilesViewerModal
          files={[filePreview.attachment]}
          openFileUrl={filePreview.attachment.url}
          onClose={() => setFilePreview(null)}
          parentTitle={`${filePreview.account.name} / ${filePreview.title}`}
        />
      )}

      {agreementToDelete && (
        <ConfirmationModal
          open={!!agreementToDelete}
          setOpen={open => !open && setAgreementToDelete(null)}
          title={<FormattedMessage defaultMessage="Delete Agreement" id="iVzX67" />}
          description={
            <FormattedMessage
              defaultMessage="This will permanently delete the agreement and all its attachments."
              id="SuVMZP"
            />
          }
          variant="destructive"
          type="delete"
          onConfirm={async () => {
            try {
              await deleteAgreement({ variables: { id: agreementToDelete.id } });
              toast({
                variant: 'success',
                message: <FormattedMessage defaultMessage="Agreement deleted successfully" id="RJt89q" />,
              });
              setAgreementToDelete(null);
              refetch(variables);
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
              throw e;
            }
          }}
        />
      )}
    </div>
  );
}
