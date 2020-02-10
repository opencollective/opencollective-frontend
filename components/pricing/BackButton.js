import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { ArrowBack } from '@styled-icons/boxicons-regular/ArrowBack';

import StyledButton from '../StyledButton';
import { Span } from '../Text';

const BackButton = ({ onClick }) => (
  <StyledButton buttonStyle="secondary" onClick={onClick} py="5px" width="69px" px="12px">
    <ArrowBack size="13" />{' '}
    <Span fontSize="12px" lineHeight="14px">
      <FormattedMessage id="pricing.back.btn" defaultMessage="Back" />
    </Span>
  </StyledButton>
);

BackButton.propTypes = {
  onClick: PropTypes.func,
};

export default BackButton;
