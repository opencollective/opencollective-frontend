import type { LucideIcon } from 'lucide-react';
import type React from 'react';

type Action = {
  label: string;
  onClick: () => void;
  Icon?: LucideIcon;
  isLoading?: boolean;
  disabled?: boolean;
  'data-cy'?: string;
};

export type GetActions<V> = (
  value: V,
  onCloseFocusRef?: React.MutableRefObject<HTMLElement>,
  refetch?: () => void,
) => { primary?: Action[]; secondary?: Action[] };
