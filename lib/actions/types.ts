import type { LucideIcon } from 'lucide-react';
import type React from 'react';

export type Action = {
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  href?: string; // used for links
  target?: string; // used for links
  Icon?: LucideIcon;
  isLoading?: boolean;
  disabled?: boolean;
  'data-cy'?: string;
  key: string;
  tooltip?: React.ReactNode;
};

export type GetActions<V> = (
  value: V,
  onCloseFocusRef?: React.MutableRefObject<HTMLElement>,
  refetch?: () => void,
) => { primary?: Action[]; secondary?: Action[] };
