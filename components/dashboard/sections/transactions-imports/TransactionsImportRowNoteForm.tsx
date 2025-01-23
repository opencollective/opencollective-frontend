import React from 'react';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { updateTransactionsImportRows } from './lib/graphql';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';

import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';

export const TransactionsImportRowNoteForm = ({ row, transactionsImportId, autoFocus = false }) => {
  const [updateRows, { loading }] = useMutation(updateTransactionsImportRows, { context: API_V2_CONTEXT });
  const [newText, setNewText] = React.useState(row.comment || '');

  return (
    <div>
      <Label htmlFor="import-row-note" className="mb-1 font-bold text-gray-600">
        <FormattedMessage defaultMessage="Note" id="qMePPG" />
      </Label>
      <Textarea
        id="import-row-note"
        className="min-h-40"
        value={newText}
        onChange={e => setNewText(e.target.value)}
        autoFocus={autoFocus}
        maxLength={5000}
      />
      <div className={'mt-2 flex w-full justify-end'}>
        <Button
          variant="outline"
          size="sm"
          loading={loading}
          disabled={newText === (row.note || '')}
          onClick={() => {
            updateRows({ variables: { importId: transactionsImportId, rows: [{ id: row.id, note: newText }] } });
          }}
        >
          <FormattedMessage defaultMessage="Save" id="save" />
        </Button>
      </div>
    </div>
  );
};
