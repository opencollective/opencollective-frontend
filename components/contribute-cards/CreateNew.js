import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import styled from 'styled-components';

import { CONTRIBUTE_CARD_WIDTH, CONTRIBUTE_CARD_BORDER_RADIUS } from './Contribute';
import Link from '../Link';
import StyledRoundButton from '../StyledRoundButton';
import { P } from '../Text';

const CreateNewCard = styled.div`
  background: white;
  height: 100%;
  width: ${CONTRIBUTE_CARD_WIDTH}px;
  border-radius: ${CONTRIBUTE_CARD_BORDER_RADIUS}px;
  border: 1px dashed #c0c5cc;

  a {
    text-decoration: none;
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
    <CreateNewCard {...props}>
      <Link route={route}>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" height="100%">
          <StyledRoundButton buttonStyle="dark" fontSize={25}>
            +
          </StyledRoundButton>
          <P mt={3} color="black.700">
            {children}
          </P>
        </Flex>
      </Link>
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
