import React from 'react';
import PropTypes from 'prop-types';
import { Close } from '@styled-icons/material/Close';
import styled from 'styled-components';

import Container from './Container';
import { Flex } from './Grid';
import Link from './Link';
import StyledLinkButton from './StyledLinkButton';
import { H1, P } from './Text';

export const NotificationBarLink = styled(Link)`
  color: ${props => props.theme.colors.blue[900]};
  font-weight: 700;
  text-decoration-line: underline;
  text-decoration-thickness: 2px;
  font-size: 1.4rem;
  line-height: 2rem;
`;

export const NotificationBarButton = styled(StyledLinkButton)`
  color: ${props => props.theme.colors.blue[900]};
  font-weight: 700;
  text-decoration-line: underline;
  text-decoration-thickness: 2px;
  font-size: 1.4rem;
  line-height: 2rem;
`;

const CloseIcon = styled(Close)`
  font-size: 12px;
  width: 24px;
  height: 24px;
  padding: 4px;
  background: #fff;
  color: ${props => props.theme.colors.blue[900]};
  border-radius: 99999px;
  cursor: pointer;
`;

const NotificationBarContainer = styled(Container)`
  background-color: ${props => getBackgroundColor(props)};
  color: ${props => props.theme.colors.blue[900]};
  position: relative;
`;

const getBackgroundColor = props => {
  switch (props.type) {
    case 'alert':
      return props.theme.colors.yellow[100];
    case 'error':
      return props.theme.colors.red[100];
    case 'success':
      return props.theme.colors.green[100];
    case 'info':
    default:
      return props.theme.colors.blue[200];
  }
};

class NotificationBar extends React.Component {
  static propTypes = {
    title: PropTypes.node,
    description: PropTypes.node,
    type: PropTypes.oneOf(['info', 'success', 'error', 'alert']),
    dismissible: PropTypes.bool,
    dismiss: PropTypes.func,
    inline: PropTypes.bool,
    actions: PropTypes.oneOf([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
  };

  render() {
    const { title, description, type, dismissible, dismiss, actions, inline } = this.props;
    return (
      <NotificationBarContainer
        data-cy="notification-bar"
        type={type}
        display="flex"
        alignItems="center"
        flexDirection="row"
        padding="12px 25px"
      >
        {title && (
          <Container display="flex" alignItems="center" flexDirection="column" textAlign="center" flex="1">
            <Container maxWidth={inline ? '1200px' : '640px'}>
              <H1
                fontSize="1.4rem"
                lineHeight="2rem"
                {...(description && { mb: '6px' })}
                mx="4px"
                textAlign="center"
                letterSpacing="0px"
                {...(inline && { display: 'inline' })}
              >
                {title}
              </H1>
              {description && (
                <P
                  fontSize="1.4rem"
                  lineHeight="2rem"
                  textAlign="center"
                  letterSpacing="0px"
                  mx="4px"
                  {...(inline && { display: 'inline' })}
                  {...(actions && { mb: '6px' })}
                >
                  {description}
                </P>
              )}

              {actions && (
                <Container display={inline ? 'inline-flex' : 'block'} mx="4px">
                  <Flex justifyContent="center" gridGap="8px">
                    {Array.isArray(actions) ? actions.map(action => action) : actions}
                  </Flex>
                </Container>
              )}
            </Container>
          </Container>
        )}

        {dismissible && (
          <StyledLinkButton onClick={dismiss}>
            <CloseIcon />
          </StyledLinkButton>
        )}
      </NotificationBarContainer>
    );
  }
}

export default NotificationBar;
