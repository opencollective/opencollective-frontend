import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Flex } from '../Grid';
import Link from '../Link';
import StyledRoundButton from '../StyledRoundButton';
import { P } from '../Text';

import { CONTRIBUTE_CARD_BORDER_RADIUS, CONTRIBUTE_CARD_WIDTH } from './Contribute';

const CreateNewCard = styled(Link)`
  display: block;
  background: white;
  height: 100%;
  width: ${CONTRIBUTE_CARD_WIDTH}px;
  border-radius: ${CONTRIBUTE_CARD_BORDER_RADIUS}px;
  border: 1px dashed #c0c5cc;
  padding: 32px;

  a {
    text-decoration: none;
    display: block;
  }

  &:hover {
    background: ${props => props.theme.colors.black[50]};
  }
`;

/**
 * A special card dedicated to admins to show them a `Create new ...` card (ex: Create new tier).
 */
const CreateNew = ({ route, children, ...props }) => {
  return (
    <CreateNewCard {...props} href={route}>
      <Flex alignItems="center" justifyContent="center" height="100%">
        <Flex flexDirection="column" justifyContent="center" alignItems="center" height="100%">
          <StyledRoundButton buttonStyle="primary" fontSize={25}>
            +
          </StyledRoundButton>
          <P mt={3} color="black.700">
            {children}
          </P>
        </Flex>
      </Flex>
    </CreateNewCard>
  );
};

CreateNew.propTypes = {
  /** The link to redirect to when users click */
  route: PropTypes.string.isRequired,
  /** The label/description */
  children: PropTypes.node.isRequired,
};

export default CreateNew;
