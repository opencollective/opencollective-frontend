import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { PlusIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../lib/errors';
import type { FilterComponentConfigs, FiltersToVariables } from '../../../lib/filters/filter-types';
import { integer } from '../../../lib/filters/schemas';
import { gql } from '../../../lib/graphql/helpers';
import type { HostAgreementsQueryVariables } from '../../../lib/graphql/types/v2/graphql';
import type { Agreement } from '../../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';
import { FEATURES, requiresUpgrade } from '@/lib/allowed-features';

import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';

import { useAgreementActions } from '../../agreements/actions';
import AgreementDrawer from '../../agreements/AgreementDrawer';
import AgreementsTable from '../../agreements/AgreementsTable';
import { AGREEMENT_VIEW_FIELDS_FRAGMENT } from '../../agreements/fragments';
import FilesViewerModal from '../../FilesViewerModal';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import ConfirmationModal from '../../NewConfirmationModal';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/useToast';
import { DashboardContext } from '../DashboardContext';
import DashboardHeader from '../DashboardHeader';
import { EmptyResults } from '../EmptyResults';
import { Filterbar } from '../filters/Filterbar';
import { hostedAccountFilter } from '../filters/HostedAccountFilter';
import { Pagination } from '../filters/Pagination';
import type { DashboardSectionProps } from '../types';

const hostDashboardAgreementsQuery = gql`
  query HostAgreements($hostSlug: String!, $limit: Int!, $offset: Int!, $account: [AccountReferenceInput]) {
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
  mutation DeleteAgreement($id: String!) {
    deleteAgreement(agreement: { id: $id }) {
      id
    }
  }
`;

const NB_AGREEMENTS_DISPLAYED = 10;

const schema = z.object({
  limit: integer.default(NB_AGREEMENTS_DISPLAYED),
  offset: integer.default(0),
  account: hostedAccountFilter.schema,
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostAgreementsQueryVariables> = {
  account: hostedAccountFilter.toVariables,
};

type FilterMeta = {
  hostSlug: string;
};

const filters: FilterComponentConfigs<z.infer<typeof schema>, FilterMeta> = {
  account: hostedAccountFilter.filter,
};

const HostDashboardAgreements = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const [agreementDrawerOpen, setAgreementDrawerOpen] = React.useState(false);
  const [agreementInDrawer, setAgreementInDrawer] = React.useState(null);
  const [agreementFilePreview, setAgreementFilePreview] = React.useState<Agreement | null>(null);
  const [isEditingAgreement, setIsEditingAgreement] = React.useState(false);
  const [agreementToDelete, setAgreementToDelete] = React.useState<Agreement | null>(null);
  const [deleteAgreement] = useMutation(DELETE_AGREEMENT_MUTATION);
  const { toast } = useToast();
  const intl = useIntl();
  const { account } = React.useContext(DashboardContext);
  const isUpgradeRequired = requiresUpgrade(account, FEATURES.AGREEMENTS);

  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    meta: { hostSlug },
  });

  const { data, error, variables, loading, refetch } = useQuery(hostDashboardAgreementsQuery, {
    variables: { hostSlug, ...queryFilter.variables },

    skip: isUpgradeRequired,
  });

  const canEdit = Boolean(LoggedInUser && !LoggedInUser.isAccountantOnly(data?.host));

  const handleEdit = React.useCallback((agreement: Agreement) => {
    setAgreementInDrawer(agreement);
    setIsEditingAgreement(true);
    setAgreementDrawerOpen(true);
  }, []);

  const handleDelete = React.useCallback((agreement: Agreement) => {
    setAgreementToDelete(agreement);
    setAgreementDrawerOpen(false);
    setIsEditingAgreement(false);
  }, []);

  const handleFilePreview = React.useCallback((agreement: Agreement) => {
    setAgreementFilePreview(agreement);
  }, []);

  const getActions = useAgreementActions(handleEdit, handleDelete);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="Agreements" defaultMessage="Agreements" />}
        actions={
          canEdit && (
            <Button
              data-cy="btn-new-agreement"
              className="gap-1"
              size="sm"
              variant="outline"
              disabled={loading || loadingLoggedInUser || isUpgradeRequired}
              onClick={() => {
                setAgreementInDrawer(null);
                setAgreementDrawerOpen(true);
              }}
            >
              <span>
                <FormattedMessage id="HostDashboardAgreements.New" defaultMessage="Add New" />
              </span>
              <PlusIcon size={20} />
            </Button>
          )
        }
      />

      {isUpgradeRequired ? (
        <UpgradePlanCTA featureKey={FEATURES.AGREEMENTS} />
      ) : (
        <React.Fragment>
          <Filterbar {...queryFilter} />

          {error ? (
            <MessageBoxGraphqlError error={error} my={4} />
          ) : !loading && !data?.host.hostedAccountAgreements?.nodes?.length ? (
            <EmptyResults
              hasFilters={queryFilter.hasFilters}
              entityType="AGREEMENTS"
              onResetFilters={() => queryFilter.resetFilters({})}
            />
          ) : (
            <React.Fragment>
              <AgreementsTable
                agreements={data?.host.hostedAccountAgreements}
                loading={loading}
                nbPlaceholders={NB_AGREEMENTS_DISPLAYED}
                resetFilters={() => queryFilter.resetFilters({})}
                onFilePreview={handleFilePreview}
                openAgreement={agreement => {
                  setAgreementDrawerOpen(true);
                  setAgreementInDrawer(agreement);
                }}
                getActions={getActions}
              />
              <Pagination queryFilter={queryFilter} total={data?.host?.hostedAccountAgreements?.totalCount} />
            </React.Fragment>
          )}
        </React.Fragment>
      )}

      <AgreementDrawer
        open={agreementDrawerOpen}
        agreement={agreementInDrawer}
        canEdit={canEdit}
        hostLegacyId={data?.host.legacyId} // legacyId required by CollectivePickerAsync
        isEditing={isEditingAgreement}
        getActions={getActions}
        onClose={() => {
          setAgreementDrawerOpen(false);
          setIsEditingAgreement(false);
        }}
        onCreate={() => {
          setAgreementDrawerOpen(false);
          setIsEditingAgreement(false);
          refetch({ ...variables, offset: 0 }); // Resetting offset to 0 since entries are displayed by creation date DESC
        }}
        onEdit={updatedAgreement => {
          // Update the agreement in drawer with the latest data
          setAgreementInDrawer(updatedAgreement);
          setIsEditingAgreement(false);
        }}
        onDelete={() => {
          setAgreementDrawerOpen(false);
          setIsEditingAgreement(false);
          refetch(variables);
        }}
      />
      {agreementFilePreview && (
        <FilesViewerModal
          files={[agreementFilePreview.attachment]}
          openFileUrl={agreementFilePreview.attachment.url}
          onClose={() => setAgreementFilePreview(null)}
          parentTitle={`${agreementFilePreview.account.name} / ${agreementFilePreview.title}`}
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
              toast({
                variant: 'error',
                message: i18nGraphqlException(intl, e),
              });
              throw e; // Re-throw to let the modal handle the error
            }
          }}
        />
      )}
    </div>
  );
};

export default HostDashboardAgreements;
