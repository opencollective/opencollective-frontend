import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box } from '@rebass/grid';

import { User } from '@styled-icons/feather/User';

import formatCollectiveType from '../lib/i18n-collective-type';
import { CollectiveType } from '../lib/constants/collectives';
import { Span } from './Text';
import StyledButton from './StyledButton';
import Container from './Container';
import CollectiveIcon from './icons/CollectiveIcon';
import OrganizationIcon from './icons/OrganizationIcon';

/** Return the icon associated to a given collective type */
const getTypeIcon = type => {
  if (type === CollectiveType.USER) {
    return <User size="1.5em" />;
  } else if (type === CollectiveType.ORGANIZATION) {
    return <OrganizationIcon size="1.5em" />;
  } else if (type === CollectiveType.COLLECTIVE) {
    return <CollectiveIcon size="1.5em" />;
  } else {
    return null;
  }
};

/**
 * A component showing big buttons to pick between collective types (user, org...etc)
 */
const CollectiveTypePicker = ({ types, onChange }) => {
  const { formatMessage } = useIntl();
  const marginBetweenButtons = 0.025;
  const buttonWidth = 1 / (types.length || 1) - marginBetweenButtons;
  const buttonFlex = `0 0 ${buttonWidth * 100}%`;

  return (
    <Container display="flex" background="white" justifyContent="space-between">
      {types.map(type => (
        <StyledButton key={type} flex={buttonFlex} px={2} py={4} borderRadius={8} onClick={() => onChange(type)}>
          <Box mb={2}>{getTypeIcon(type)}</Box>
          <Span fontSize="Caption">{formatCollectiveType(formatMessage, type)}</Span>
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
