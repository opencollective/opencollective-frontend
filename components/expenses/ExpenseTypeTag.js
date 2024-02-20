import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import expenseTypes from '../../lib/constants/expenseTypes';
import { i18nExpenseType } from '../../lib/i18n/expense';

import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledTag from '../StyledTag';

const ExpenseTypeTag = ({ type, legacyId = undefined, isLoading = false, ...props }) => {
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
      {...props}
    >
      {i18nExpenseType(intl, type, legacyId)}
    </StyledTag>
  );
};

ExpenseTypeTag.propTypes = {
  type: PropTypes.oneOf(Object.values(expenseTypes)).isRequired,
  legacyId: PropTypes.number,
  isLoading: PropTypes.bool,
};

ExpenseTypeTag.defaultProps = {
  isLoading: false,
};

export default ExpenseTypeTag;
