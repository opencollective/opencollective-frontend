import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';

import { PencilAlt } from 'styled-icons/fa-solid/PencilAlt';

import StyledLink from '../StyledLink';
import Container from '../Container';
import { P } from '../Text';
import ExportData from '../ExportData';

const MENU_WIDTH = 180;

const SidebarContainer = styled.div`
  position: fixed;
  display: flex;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 99999;
  transform: translateX(-${MENU_WIDTH}px);
  transition: transform 0.3s;

  ${props =>
    props.isFixed &&
    css`
      transform: translateX(0);
    `}
`;

const ToggleSidebarContainer = styled.div`
  height: 100%;
  width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
  color: #969ba3;
  cursor: pointer;

  ${props =>
    props.isFixed &&
    css`
      color: ${props => props.theme.colors.primary[500]};
    `}

  &:hover {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const messages = defineMessages({
  info: {
    id: 'EditCollective.Info',
    defaultMessage: 'General Info',
  },
  'connected-accounts': {
    id: 'EditCollective.Accounts',
    defaultMessage: 'Connected accounts',
  },
  expenses: {
    id: 'EditCollective.Expenses',
    defaultMessage: 'Expense policy',
  },
  export: {
    id: 'EditCollective.Export',
    defaultMessage: 'Export',
  },
});

class EditCollectiveSidebar extends Component {
  static propTypes = {
    collective: PropTypes.shape({}).isRequired,
    intl: PropTypes.object.isRequired,
  };

  state = { isFixed: false, selected: 'info' };

  toggle = () => this.setState(state => ({ isFixed: !state.isFixed }));

  renderSection(section) {
    switch (section) {
      case 'export':
        return <ExportData collective={this.props.collective} />;
      default:
        return null;
    }
  }

  render() {
    const { intl } = this.props;
    const { isFixed, selected } = this.state;
    const sections = ['info', 'connected-accounts', 'expenses', 'export'];

    return (
      <React.Fragment>
        {isFixed && (
          <Container
            position="fixed"
            top={0}
            left={0}
            background="rgba(0, 0, 0, 0.5)"
            width="100%"
            height="100%"
            zIndex={99998}
          />
        )}
        <SidebarContainer isFixed={isFixed} width={isFixed ? 1 : undefined}>
          <Container
            display="flex"
            flexDirection="column"
            background="#F5F7FA"
            width={MENU_WIDTH}
            height="100%"
            fontSize="Tiny"
            p="34px 16px"
          >
            <P fontSize="Tiny" fontWeight="bold" color="black.800" mb={4}>
              <FormattedMessage id="EditCollectiveSidebar.Title" defaultMessage="Edit Collective" />
            </P>
            {sections.map(section => (
              <StyledLink
                key={section}
                mb={10}
                fontWeight={section === selected ? 'bold' : 'normal'}
                onClick={() => this.setState({ selected: section })}
              >
                {intl.formatMessage(messages[section])}
              </StyledLink>
            ))}
          </Container>
          <ToggleSidebarContainer onClick={this.toggle} isFixed={isFixed}>
            <PencilAlt size={12} />
          </ToggleSidebarContainer>
          {isFixed && (
            <Container
              background="white"
              width={1200}
              height="100%"
              boxShadow="25px 0px 25px -20px #d1d1d1 inset"
              p={4}
              css={{ overflowY: 'auto' }}
            >
              {this.renderSection(selected)}
            </Container>
          )}
        </SidebarContainer>
      </React.Fragment>
    );
  }
}

export default injectIntl(EditCollectiveSidebar);
