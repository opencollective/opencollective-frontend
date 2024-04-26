import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { Account, Host, LegalDocument } from '../../../../lib/graphql/types/v2/graphql';

import LinkCollective from '../../../LinkCollective';
import StyledLink from '../../../StyledLink';
import StyledTextarea from '../../../StyledTextarea';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { useToast } from '../../../ui/useToast';

const editLegalDocumentStatusMutation = gql`
  mutation EditLegalDocumentStatus(
    $id: String!
    $host: AccountReferenceInput!
    $status: LegalDocumentRequestStatus!
    $message: String
  ) {
    editLegalDocumentStatus(id: $id, status: $status, message: $message, host: $host) {
      id
      status
    }
  }
`;

export const InvalidateTaxFormModal = ({
  legalDocument,
  host,
  onSuccess,
  ...props
}: {
  legalDocument: LegalDocument;
  host: Account | Host;
  onSuccess?: () => void;
} & React.ComponentProps<typeof Dialog>) => {
  const intl = useIntl();
  const [message, setMessage] = React.useState('');
  const { toast } = useToast();
  const [editLegalDocumentStatus, { loading }] = useMutation(editLegalDocumentStatusMutation, {
    context: API_V2_CONTEXT,
  });
  const onTextChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value),
    [setMessage],
  );

  return (
    <Dialog {...props} onOpenChange={loading ? null : props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Invalidate Tax Form" id="Z7ZY3k" />
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async e => {
            e.preventDefault();
            try {
              await editLegalDocumentStatus({
                variables: {
                  id: legalDocument.id,
                  host: { id: host.id },
                  status: 'INVALID',
                  message,
                },
              });
              props.onOpenChange(false);
              onSuccess?.();
              toast({
                variant: 'success',
                title: intl.formatMessage({ defaultMessage: 'Tax form invalidated', id: 'TaxForm.Invalidate.Success' }),
              });
            } catch (e) {
              toast({
                variant: 'error',
                title: intl.formatMessage({
                  defaultMessage: 'Failed to invalidate tax form',
                  id: 'TaxForm.Invalidate.Error',
                }),
                message: i18nGraphqlException(intl, e),
              });
            }
          }}
        >
          <div className="mb-4 text-base">
            <p>
              <FormattedMessage
                id="raAnVA"
                defaultMessage="You're about to invalidate the {year} tax form for {account}. This will force them to re-submit a new tax form in order to receive payments."
                values={{
                  year: legalDocument.year,
                  account: <StyledLink as={LinkCollective} openInNewTab collective={legalDocument.account} />,
                }}
              />
            </p>
            <br />
            <label htmlFor="invalidate-tax-form-reason" className="bold mb-2 text-base">
              <FormattedMessage
                id="withColon"
                defaultMessage="{item}:"
                values={{
                  item: (
                    <FormattedMessage
                      id="EX4lWe"
                      defaultMessage="Message for {account}"
                      values={{ account: legalDocument.account.name }}
                    />
                  ),
                }}
              />
            </label>
            <StyledTextarea
              id="invalidate-tax-form-reason"
              value={message}
              onChange={onTextChange}
              minHeight={200}
              required
              placeholder={intl.formatMessage({
                defaultMessage: 'Your tax form is invalid because...',
                id: 'TaxForm.Invalidate.Message.Placeholder',
              })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => props.onOpenChange(false)} disabled={loading}>
              <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
            </Button>
            <Button type="submit" loading={loading}>
              <FormattedMessage defaultMessage="Invalidate Tax Form" id="Z7ZY3k" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
