import { LucideIcon } from 'lucide-react';
import type React from 'react';
export enum ActionType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
}

export type Action = {
  type: ActionType;
  label: string;
  onClick: () => void;
  Icon?: LucideIcon;
  isLoading?: boolean;
  disabled?: boolean;
};

export type GetActions<V> = (
  value: V,
  onCloseFocusRef?: React.RefObject<HTMLElement>,
  refetch?: () => void,
) => Action[];
