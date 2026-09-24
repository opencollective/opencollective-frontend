import { Edit, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import type { Agreement } from '../../lib/graphql/types/v2/graphql';

export function useAgreementActions(
  onEdit: (agreement: Agreement) => void,
  onDelete: (agreement: Agreement) => void,
): GetActions<Agreement> {
  const intl = useIntl();

  const getActions: GetActions<Agreement> = (agreement: Agreement) => {
    const actions: ReturnType<GetActions<Agreement>> = { primary: [], secondary: [] };

    actions.primary.push({
      key: 'edit',
      label: intl.formatMessage({ defaultMessage: 'Edit', id: 'Edit' }),
      Icon: Edit,
      onClick: () => onEdit(agreement),
      'data-cy': 'btn-edit-agreement',
    });

    actions.primary.push({
      key: 'delete',
      label: intl.formatMessage({ defaultMessage: 'Delete', id: 'actions.delete' }),
      Icon: Trash2,
      onClick: () => onDelete(agreement),
      'data-cy': 'more-actions-delete-expense-btn',
    });

    return actions;
  };

  return getActions;
}
