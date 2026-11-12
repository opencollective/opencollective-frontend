import React from 'react';
import { useMutation } from '@apollo/client';
import { AlertTriangle, CircleCheck, Info } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '@/lib/errors';
import { gql } from '@/lib/graphql/helpers';
import type { AccountReferenceInput, FiscalHostNoteType } from '@/lib/graphql/types/v2/graphql';
import { FiscalHostNoteType as FiscalHostNoteTypeEnum } from '@/lib/graphql/types/v2/graphql';

import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { useToast } from './ui/useToast';
import { normalizeRichTextContent } from './HTMLContent';
import { type BaseModalProps, useModal } from './ModalContext';
import RichTextEditor from './RichTextEditor';

const setFiscalHostNoteMutation = gql`
  mutation SetFiscalHostNote($input: SetFiscalHostNoteInput!) {
    setFiscalHostNote(input: $input) {
      type
      note
      updatedAt
      updatedBy {
        id
        name
        slug
      }
    }
  }
`;

const removeFiscalHostNoteMutation = gql`
  mutation RemoveFiscalHostNote($input: RemoveFiscalHostNoteInput!) {
    removeFiscalHostNote(input: $input)
  }
`;

type FiscalHostNoteModalAccount = {
  id: string;
  name?: string | null;
  fiscalHostNote?: {
    type: FiscalHostNoteType | 'WARNING' | 'INFO' | 'POSITIVE';
    note?: string | null;
  } | null;
};

type FiscalHostNoteModalProps = BaseModalProps & {
  host: AccountReferenceInput;
  account: FiscalHostNoteModalAccount;
  refetchQueries?: string[];
};

export function FiscalHostNoteModal(props: FiscalHostNoteModalProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const { showConfirmationModal } = useModal();
  const existingNote = props.account.fiscalHostNote;
  const [noteType, setNoteType] = React.useState<FiscalHostNoteType>(
    (existingNote?.type as FiscalHostNoteType) || FiscalHostNoteTypeEnum.INFO,
  );
  const [note, setNote] = React.useState(existingNote?.note || '');
  const [error, setError] = React.useState<string | null>(null);
  const isEmptyNote = !normalizeRichTextContent(note).trim();

  const [setFiscalHostNote, { loading: isSaving }] = useMutation(setFiscalHostNoteMutation, {
    refetchQueries: props.refetchQueries,
  });
  const [removeFiscalHostNote, { loading: isRemoving }] = useMutation(removeFiscalHostNoteMutation, {
    refetchQueries: props.refetchQueries,
  });

  const handleSave = async () => {
    setError(null);
    try {
      await setFiscalHostNote({
        variables: {
          input: {
            host: props.host,
            account: { id: props.account.id },
            type: noteType,
            note,
          },
        },
      });
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Fiscal host note saved" id="FiscalHostNote.Saved" />,
      });
      props.setOpen(false);
    } catch (e) {
      setError(i18nGraphqlException(intl, e));
    }
  };

  const handleRemove = () => {
    showConfirmationModal({
      type: 'remove',
      title: <FormattedMessage defaultMessage="Remove fiscal host note?" id="FiscalHostNote.Remove.Title" />,
      description: (
        <FormattedMessage
          defaultMessage="This note is only visible to admins of your fiscal host. Removing it cannot be undone."
          id="FiscalHostNote.Remove.Description"
        />
      ),
      onConfirm: async () => {
        try {
          await removeFiscalHostNote({
            variables: { input: { host: props.host, account: { id: props.account.id } } },
          });
          toast({
            variant: 'success',
            message: <FormattedMessage defaultMessage="Fiscal host note removed" id="FiscalHostNote.Removed" />,
          });
          props.setOpen(false);
        } catch (e) {
          setError(i18nGraphqlException(intl, e));
        }
      },
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Fiscal host note" id="FiscalHostNote.Title" />
          </DialogTitle>
          <DialogDescription>
            {props.account.name ? (
              <FormattedMessage
                defaultMessage="Add a private note about {account}. Only admins of your fiscal host can see it."
                id="FiscalHostNote.Modal.Description"
                values={{ account: props.account.name }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Add a private note about this account. Only admins of your fiscal host can see it."
                id="FiscalHostNote.Modal.DescriptionFallback"
              />
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="fiscal-host-note-type" className="text-sm font-medium">
              <FormattedMessage defaultMessage="Type" id="FiscalHostNote.Type" />
            </label>
            <Select value={noteType} onValueChange={value => setNoteType(value as FiscalHostNoteType)}>
              <SelectTrigger id="fiscal-host-note-type" className="w-48 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FiscalHostNoteTypeEnum.WARNING}>
                  <span className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-600" />
                    <FormattedMessage defaultMessage="Warning" id="FiscalHostNote.Type.Warning" />
                  </span>
                </SelectItem>
                <SelectItem value={FiscalHostNoteTypeEnum.INFO}>
                  <span className="flex items-center gap-2">
                    <Info size={14} className="text-slate-500" />
                    <FormattedMessage defaultMessage="Info" id="editCollective.menu.info" />
                  </span>
                </SelectItem>
                <SelectItem value={FiscalHostNoteTypeEnum.POSITIVE}>
                  <span className="flex items-center gap-2">
                    <CircleCheck size={14} className="text-green-600" />
                    <FormattedMessage defaultMessage="Positive" id="FiscalHostNote.Type.Positive" />
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="fiscal-host-note" className="text-sm font-medium">
              <FormattedMessage defaultMessage="Note" id="qMePPG" />
            </label>
            <RichTextEditor
              id="fiscal-host-note"
              version="simplified"
              withBorders
              showCount
              maxLength={5000}
              editorMinHeight="8rem"
              defaultValue={existingNote?.note || ''}
              placeholder={intl.formatMessage({
                defaultMessage: 'Add context about this account for your host admins...',
                id: 'FiscalHostNote.Placeholder',
              })}
              onChange={event => setNote(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div>
            {existingNote && (
              <Button
                type="button"
                variant="outline"
                className="text-red-600"
                onClick={handleRemove}
                disabled={isRemoving}
              >
                <FormattedMessage defaultMessage="Remove note" id="FiscalHostNote.Remove.Button" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => props.setOpen(false)}>
              <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              loading={isSaving}
              disabled={isEmptyNote}
              data-cy="save-fiscal-host-note"
            >
              <FormattedMessage defaultMessage="Save" id="save" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
