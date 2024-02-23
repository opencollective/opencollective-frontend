import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import type { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { elementFromClass } from '../../lib/react-utils';

import Avatar from '../Avatar';
import ConfirmationModal from '../ConfirmationModal';
import { useDrawerActionsContainer } from '../Drawer';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import { H4 } from '../Text';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { vendorFieldFragment } from './queries';

const organizationDetailsQuery = gql`
  query OrganizationDetails($organizationSlug: String!) {
    account(slug: $organizationSlug) {
      id
      type
      name
      slug
      createdAt
      orders {
        totalCount
      }
      expenses(status: PAID, direction: SUBMITTED) {
        totalCount
      }
      members(role: ADMIN, includeInherited: true) {
        nodes {
          id
          role
          account {
            id
            name
            slug
            type
            imageUrl(height: 64)
          }
        }
      }
    }
  }
`;

const convertOrganizationMutation = gql`
  mutation ConvertOrganizationToVendor($organization: AccountReferenceInput!, $host: AccountReferenceInput!) {
    convertOrganizationToVendor(organization: $organization, host: $host) {
      id
      ...VendorFields
    }
  }
  ${vendorFieldFragment}
`;

const SectionTitle = elementFromClass('div', 'text-md font-bold text-slate-800 mb-2 flex gap-4 items-center');

const HeaderInfo = ({ children }: PropsWithChildren) => (
  <div>
    <p className="text-xs text-slate-700">{children[0]}</p>
    <p className="mt-2 text-sm">{children[1]}</p>
  </div>
);

const OrganizationDetails = ({ organization, host, onCancel, editVendor }) => {
  const drawerActionsContainer = useDrawerActionsContainer();
  const { toast } = useToast();
  const intl = useIntl();
  const { data } = useQuery(organizationDetailsQuery, {
    variables: { organizationSlug: organization.slug },
    context: API_V2_CONTEXT,
  });
  const [displayConvertToVendor, setDisplayConvertToVendor] = React.useState(false);
  const [convertOrganizationToVendor] = useMutation(convertOrganizationMutation, {
    context: API_V2_CONTEXT,
  });

  const handleConvert = async () => {
    try {
      const result = await convertOrganizationToVendor({
        variables: { organization: { id: organization.id }, host: { id: host.id } },
      });
      toast({ variant: 'success', message: <FormattedMessage defaultMessage="Organization converted to vendor" /> });
      editVendor(result.data.convertOrganizationToVendor);
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
    return;
  };

  const admins = data?.account?.members?.nodes.map(m => m.account) || [];
  const activity = data?.account;
  const dashboardLink = `dashboard/${host.slug}`;
  return (
    <div>
      <H4 mb={32}>
        <FormattedMessage defaultMessage="Organization's Detail" />
      </H4>
      <SectionTitle>
        <Avatar collective={organization} radius={40} />
        {organization.name}
      </SectionTitle>
      <div className="mt-4 flex gap-8">
        <HeaderInfo>
          <FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />
          <FormattedDate value={organization.createdAt} dateStyle="medium" />
        </HeaderInfo>
      </div>

      <div className="flex justify-stretch">
        {admins.length > 0 && (
          <div className="mt-4 flex flex-1 flex-col">
            <SectionTitle>
              <FormattedMessage id="Admins" defaultMessage="Admins" />
            </SectionTitle>
            <div className="flex gap-4">
              {admins.map(admin => (
                <div className="flex items-center gap-1 text-sm" key={admin.id}>
                  <Avatar collective={admin} radius={24} />
                  <LinkCollective collective={admin} />
                </div>
              ))}
            </div>
          </div>
        )}
        {activity && (
          <div className="mt-4 flex flex-1 flex-col gap-1">
            <SectionTitle>
              <FormattedMessage defaultMessage="Activity" />
            </SectionTitle>
            <Link href={`${dashboardLink}/host-expenses?searchTerm=%40${organization.slug}`} className="text-sm">
              {activity.expenses.totalCount} <FormattedMessage id="Expenses" defaultMessage="Expenses" />
            </Link>
            <Link href={`${dashboardLink}/orders?searchTerm=%40${organization.slug}`} className="text-sm">
              {activity.orders.totalCount} <FormattedMessage id="Contributions" defaultMessage="Contributions" />
            </Link>
          </div>
        )}
      </div>
      {drawerActionsContainer &&
        createPortal(
          <div className="flex flex-grow justify-between gap-2">
            <Button onClick={onCancel} variant="outline" className="rounded-full">
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </Button>
            <Button onClick={() => setDisplayConvertToVendor(true)} className="rounded-full">
              <FormattedMessage defaultMessage="Convert to Vendor" />
            </Button>
          </div>,
          drawerActionsContainer,
        )}
      {displayConvertToVendor && (
        <ConfirmationModal
          width="100%"
          maxWidth="570px"
          onClose={() => setDisplayConvertToVendor(false)}
          header={<FormattedMessage defaultMessage="Convert to vendor?" />}
          continueHandler={handleConvert}
        >
          <p>
            <FormattedMessage
              defaultMessage="I understand that this organization will be: {br}- Transformed into a vendor; {br}- No longer be accessible to its admins as an organization on the platform; and, {br}- Will no longer have a public profile."
              values={{ br: <br /> }}
            />
          </p>
        </ConfirmationModal>
      )}
    </div>
  );
};

export default OrganizationDetails;
