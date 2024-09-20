import React from 'react';
import { useIntl } from 'react-intl';

import { ExpenseType } from '../../lib/graphql/types/v2/graphql';
import { i18nExpenseType } from '../../lib/i18n/expense';
import defaultColors from '../../lib/theme/colors';

import LoadingPlaceholder from '../LoadingPlaceholder';
import type { StyledTagProps } from '../StyledTag';
import StyledTag from '../StyledTag';

interface ExpenseTypeTagProps extends Omit<StyledTagProps, 'type'> {
  type: ExpenseType;
  legacyId?: number;
  isLoading?: boolean;
}

const TAG_COLOR = {
  [ExpenseType.INVOICE]: defaultColors.blue[200],
  [ExpenseType.RECEIPT]: defaultColors.green[200],
  [ExpenseType.GRANT]: defaultColors.yellow[200],
  [ExpenseType.CHARGE]: defaultColors.purple[200],
};

const ExpenseTypeTag = ({ type, legacyId = undefined, isLoading = false, ...props }: ExpenseTypeTagProps) => {
  const intl = useIntl();
  return !type && !legacyId && isLoading ? (
    <LoadingPlaceholder height={24} width={73} borderRadius="12px 2px 2px 12px" />
  ) : (
    <StyledTag
      variant="rounded-left"
      type="grey"
      mb="4px"
      mr="10px"
      textTransform="uppercase"
      fontSize="10px"
      fontWeight="600"
      backgroundColor={TAG_COLOR[type]}
      {...props}
    >
      {i18nExpenseType(intl, type, legacyId)}
    </StyledTag>
  );
};

export default ExpenseTypeTag;
