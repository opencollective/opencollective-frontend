import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AlertTriangle } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '@/lib/errors';
import { gql } from '@/lib/graphql/helpers';
import { ContributorInfoAddressField, ContributorInfoField } from '@/lib/graphql/types/v2/graphql';

import { isValidLegalName, locationHasAddress } from '@/components/contribution-flow/utils';
import { type BaseModalProps } from '@/components/ModalContext';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/useToast';

const MESSAGE_MAX_LENGTH = 1000;

const requestContributorInfoMutation = gql`
  mutation RequestContributorInfo($input: RequestContributorInfoInput!) {
    requestContributorInfo(input: $input)
  }
`;

const pendingContributorInfoRequestQuery = gql`
  query PendingContributorInfoRequest($accountId: String!, $host: AccountReferenceInput!) {
    account(id: $accountId) {
      id
      communityStats(host: $host) {
        id
        pendingContributorInfoRequest {
          requestedAt
          fields
          addressFields
        }
      }
    }
  }
`;

/** Address parts, with their key in `location.structured` (or `country`) */
export const ADDRESS_PARTS: { field: ContributorInfoAddressField; key: string; label: React.ReactNode }[] = [
  {
    field: ContributorInfoAddressField.ADDRESS_LINE1,
    key: 'address1',
    label: <FormattedMessage defaultMessage="Street address" id="RequestContributorInfo.StreetAddress" />,
  },
  {
    field: ContributorInfoAddressField.ADDRESS_LINE2,
    key: 'address2',
    label: <FormattedMessage defaultMessage="Apartment, suite, etc." id="address.address2" />,
  },
  {
    field: ContributorInfoAddressField.CITY,
    key: 'city',
    label: <FormattedMessage defaultMessage="City" id="TE4fIS" />,
  },
  {
    field: ContributorInfoAddressField.POSTAL_CODE,
    key: 'postalCode',
    label: <FormattedMessage defaultMessage="Postal Code" id="address.postalCode" />,
  },
  {
    field: ContributorInfoAddressField.ZONE,
    key: 'zone',
    label: <FormattedMessage defaultMessage="State/Province" id="address.zone" />,
  },
  {
    field: ContributorInfoAddressField.COUNTRY,
    key: 'country',
    label: <FormattedMessage defaultMessage="Country" id="collective.country.label" />,
  },
];

type RequestContributorInfoModalProps = BaseModalProps & {
  host: { slug: string };
  account: {
    id: string;
    name?: string | null;
    legalName?: string | null;
    location?: { country?: string | null; address?: string | null; structured?: Record<string, unknown> | null } | null;
  };
  refetchQueries?: string[];
};

const CurrentValue = ({ value }: { value?: string | null }) =>
  value ? (
    <span className="text-muted-foreground">{value}</span>
  ) : (
    <span className="text-muted-foreground italic">
      <FormattedMessage defaultMessage="Not set" id="p5LNtB" />
    </span>
  );

/** List of requested fields, shared with the activity timeline */
export const RequestedContributorInfoList = ({
  legalName,
  address,
  addressParts,
}: {
  legalName: boolean;
  address: boolean;
  addressParts: typeof ADDRESS_PARTS;
}) => (
  <ul className="list-inside list-disc">
    {legalName && (
      <li>
        <FormattedMessage defaultMessage="Legal name" id="OozR1Y" />
      </li>
    )}
    {address && (
      <li>
        <FormattedMessage defaultMessage="Address" id="collective.address.label" />
        {addressParts.length > 0 && (
          <React.Fragment>
            {': '}
            {addressParts.map((part, idx) => (
              <React.Fragment key={part.key}>
                {idx > 0 && ', '}
                {part.label}
              </React.Fragment>
            ))}
          </React.Fragment>
        )}
      </li>
    )}
  </ul>
);

const PendingRequestWarning = ({
  pendingRequest,
}: {
  pendingRequest: { requestedAt: string; fields: ContributorInfoField[]; addressFields: ContributorInfoAddressField[] };
}) => {
  const addressParts = ADDRESS_PARTS.filter(part => pendingRequest.addressFields.includes(part.field));
  return (
    <Alert className="border-yellow-300 bg-yellow-50">
      <AlertTriangle size={16} className="text-yellow-700!" />
      <AlertDescription className="flex flex-col gap-1">
        <FormattedMessage
          defaultMessage="Information requested on {date} has not been provided yet:"
          id="RequestContributorInfo.PendingRequest"
          values={{ date: <FormattedDate value={pendingRequest.requestedAt} dateStyle="medium" /> }}
        />
        <RequestedContributorInfoList
          legalName={pendingRequest.fields.includes(ContributorInfoField.LEGAL_NAME)}
          address={pendingRequest.fields.includes(ContributorInfoField.ADDRESS)}
          addressParts={addressParts}
        />
      </AlertDescription>
    </Alert>
  );
};

export function RequestContributorInfoModal(props: RequestContributorInfoModalProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const { account } = props;
  const location = account.location;
  const structured = (location?.structured || {}) as Record<string, unknown>;
  const getPartValue = (key: string) => {
    const value = key === 'country' ? location?.country : structured[key];
    return value ? String(value).trim() : null;
  };
  const hasStructuredAddress = locationHasAddress({ structured });

  // Preselect what is missing or invalid
  const [fields, setFields] = React.useState<ContributorInfoField[]>(() =>
    [
      !isValidLegalName(account.legalName) && ContributorInfoField.LEGAL_NAME,
      (!location?.country || !locationHasAddress(location)) && ContributorInfoField.ADDRESS,
    ].filter(Boolean),
  );
  const [addressParts, setAddressParts] = React.useState<ContributorInfoAddressField[]>(() =>
    hasStructuredAddress ? ADDRESS_PARTS.filter(part => !getPartValue(part.key)).map(part => part.field) : [],
  );
  const pendingQuery = useQuery(pendingContributorInfoRequestQuery, {
    variables: { accountId: account.id, host: { slug: props.host.slug } },
    fetchPolicy: 'network-only',
  });
  const pendingRequest = pendingQuery.data?.account?.communityStats?.pendingContributorInfoRequest;
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [requestContributorInfo, { loading }] = useMutation(requestContributorInfoMutation, {
    refetchQueries: props.refetchQueries,
  });

  const toggle = <T,>(list: T[], value: T, checked: boolean): T[] =>
    checked ? [...list.filter(v => v !== value), value] : list.filter(v => v !== value);
  const isAddressSelected = fields.includes(ContributorInfoField.ADDRESS);

  const handleSubmit = async () => {
    setError(null);
    try {
      await requestContributorInfo({
        variables: {
          input: {
            host: { slug: props.host.slug },
            account: { id: account.id },
            fields,
            addressFields: isAddressSelected && hasStructuredAddress ? addressParts : [],
            message: message.trim() || null,
          },
        },
      });
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Information requested" id="RequestContributorInfo.Success" />,
      });
      props.setOpen(false);
    } catch (e) {
      setError(i18nGraphqlException(intl, e));
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Request information" id="RequestContributorInfo.Title" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage
              defaultMessage="Select the information {account} needs to add or correct. They will receive an email with a link to update their profile."
              id="RequestContributorInfo.Description"
              values={{ account: account.name || account.id }}
            />
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 text-sm">
          {pendingRequest && <PendingRequestWarning pendingRequest={pendingRequest} />}
          <div className="flex items-start gap-2">
            <Checkbox
              id="request-info-legal-name"
              checked={fields.includes(ContributorInfoField.LEGAL_NAME)}
              onCheckedChange={checked => setFields(toggle(fields, ContributorInfoField.LEGAL_NAME, Boolean(checked)))}
            />
            <label htmlFor="request-info-legal-name" className="flex cursor-pointer flex-col gap-1 leading-none">
              <span className="font-medium">
                <FormattedMessage defaultMessage="Legal name" id="OozR1Y" />
              </span>
              <CurrentValue value={account.legalName?.trim()} />
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Checkbox
                id="request-info-address"
                checked={isAddressSelected}
                onCheckedChange={checked => setFields(toggle(fields, ContributorInfoField.ADDRESS, Boolean(checked)))}
              />
              <label htmlFor="request-info-address" className="flex cursor-pointer flex-col gap-1 leading-none">
                <span className="font-medium">
                  <FormattedMessage defaultMessage="Address" id="collective.address.label" />
                </span>
                {!hasStructuredAddress ? (
                  <CurrentValue value={[location?.address?.trim(), location?.country].filter(Boolean).join(', ')} />
                ) : (
                  // Each part is listed with its own checkbox once the address is selected
                  !isAddressSelected && (
                    <CurrentValue
                      value={ADDRESS_PARTS.map(part => getPartValue(part.key))
                        .filter(Boolean)
                        .join(', ')}
                    />
                  )
                )}
              </label>
            </div>
            {isAddressSelected && hasStructuredAddress && (
              <div className="ml-6 flex flex-col gap-2 border-l pl-4">
                <p className="text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="Select the parts to correct, or none for the whole address."
                    id="RequestContributorInfo.AddressParts"
                  />
                </p>
                {ADDRESS_PARTS.map(part => (
                  <div key={part.field} className="flex items-start gap-2">
                    <Checkbox
                      id={`request-info-${part.key}`}
                      checked={addressParts.includes(part.field)}
                      onCheckedChange={checked => setAddressParts(toggle(addressParts, part.field, Boolean(checked)))}
                    />
                    <label htmlFor={`request-info-${part.key}`} className="flex cursor-pointer gap-2 leading-none">
                      <span>{part.label}:</span>
                      <CurrentValue value={getPartValue(part.key)} />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="request-info-message" className="font-medium">
              <FormattedMessage defaultMessage="Message" id="Contact.Message" />{' '}
              <span className="font-normal text-muted-foreground">
                (<FormattedMessage defaultMessage="optional" id="FormField.optional" />)
              </span>
            </label>
            <Textarea
              id="request-info-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={MESSAGE_MAX_LENGTH}
              rows={4}
              className="h-auto"
              showCount
              placeholder={intl.formatMessage({
                defaultMessage: 'Added to the email, e.g. what is wrong with the current information',
                id: 'RequestContributorInfo.MessagePlaceholder',
              })}
            />
          </div>

          {error && <p className="text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.setOpen(false)} disabled={loading}>
            <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!fields.length}>
            <FormattedMessage defaultMessage="Send request" id="RequestContributorInfo.Send" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
