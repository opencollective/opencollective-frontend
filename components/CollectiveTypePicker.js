import React from 'react';
import PropTypes from 'prop-types';
import { Plus } from '@styled-icons/fa-solid/Plus';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';

import Container from './Container';
import StyledButton from './StyledButton';
import { Span } from './Text';

/** Return the caption associated to a given collective type */
const getTypeCaption = type => {
  if (type === CollectiveType.USER) {
    return <FormattedMessage id="user.create" defaultMessage="Create new user" />;
  } else if (type === CollectiveType.ORGANIZATION) {
    return <FormattedMessage id="organization.create" defaultMessage="Create organization" />;
  } else if (type === CollectiveType.COLLECTIVE) {
    return <FormattedMessage id="collective.create" defaultMessage="Create collective" />;
  } else {
    return null;
  }
};

/**
 * A component showing big buttons to pick between collective types (user, org...etc)
 */
const CollectiveTypePicker = ({ types, onChange }) => {
  const marginBetweenButtons = 0.025;
  const buttonWidth = 1 / (types.length || 1) - marginBetweenButtons;
  const buttonFlex = `0 0 ${buttonWidth * 100}%`;

  return (
    <Container display="flex" background="white" justifyContent="space-between">
      {types.map(type => (
        <StyledButton
          key={type}
          flex={buttonFlex}
          px={2}
          py="28px"
          borderRadius={8}
          onClick={() => onChange(type)}
          data-cy={`collective-type-picker-${type}`}
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Container
            mb={2}
            size={24}
            border="1px solid #C4C7CC"
            borderRadius="100px"
            textAlign="center"
            display="flex"
            justifyContent="center"
            alignItems="center"
            p={0}
          >
            <Plus size={12} color="black.500" />
          </Container>
          <Span fontSize="10px" fontWeight="500" lineHeight="15px">
            {getTypeCaption(type)}
          </Span>
        </StyledButton>
      ))}
    </Container>
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
