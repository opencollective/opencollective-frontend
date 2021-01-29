import React from 'react';
import PropTypes from 'prop-types';
import { PlusCircle } from '@styled-icons/feather/PlusCircle';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';

import { Box, Flex, Grid } from './Grid';
import StyledButton from './StyledButton';

/** Return the caption associated to a given collective type */
const getTypeCaption = type => {
  if (type === CollectiveType.USER) {
    return <FormattedMessage id="user.create" defaultMessage="Create new user" />;
  } else if (type === CollectiveType.ORGANIZATION) {
    return <FormattedMessage id="organization.create" defaultMessage="Create Organization" />;
  } else if (type === CollectiveType.COLLECTIVE) {
    return <FormattedMessage id="collective.create" defaultMessage="Create Collective" />;
  } else {
    return null;
  }
};

/**
 * A component showing big buttons to pick between collective types (user, org...etc)
 */
const CollectiveTypePicker = ({ types, onChange }) => {
  const isSingleType = types.length === 1;
  return (
    <Grid gridGap={1} gridTemplateColumns={`repeat(${types.length}, 1fr)`}>
      {types.map(type => (
        <StyledButton
          key={type}
          borderRadius="14px"
          onClick={() => onChange(type)}
          data-cy={`collective-type-picker-${type}`}
        >
          <Flex alignItems="center" flexDirection={isSingleType ? 'row' : 'column'}>
            <PlusCircle size={24} />
            <Box ml={isSingleType ? '16px' : 0} fontSize="11px">
              {getTypeCaption(type)}
            </Box>
          </Flex>
        </StyledButton>
      ))}
    </Grid>
  );
};

CollectiveTypePicker.propTypes = {
  /** List of allowed types for this collective creator */
  types: PropTypes.arrayOf(PropTypes.oneOf(Object.values(CollectiveType))).isRequired,
  /** Called when user pick a button */
  onChange: PropTypes.func.isRequired,
};

CollectiveTypePicker.defaultProps = {
  types: [CollectiveType.USER, CollectiveType.COLLECTIVE, CollectiveType.ORGANIZATION],
};

export default CollectiveTypePicker;
