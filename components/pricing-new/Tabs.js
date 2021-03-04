import React from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import Link from '../Link';

const Tab = styled.button`
  font-size: 15px;
  line-height: 22px;
  color: ${themeGet('colors.black.800')};
  padding: 0;
  margin-left: 8px;
  margin-right: 8px;
  font-weight: ${props => (props.active ? 'bold' : 'normal')};
  background: none;
  border: none;
  white-space: nowrap;
  text-transform: capitalize;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  @media screen and (min-width: 64em) {
    margin-left: 0;
    margin-right: 0;
    margin-top: 8px;
    margin-bottom: 8px;
  }
`;

const Tabs = ({ activeTab }) => (
  <Container
    display="flex"
    px={['16px', null, 0]}
    py={['15px', null, 0]}
    pt={[null, null, 3]}
    width={[null, '636px', '113px']}
    background="white"
    justifyContent={['center', 'flex-start']}
    alignItems={['center', null, 'flex-start']}
    flexDirection={[null, null, 'column']}
  >
    <Link href="#collective">
      <Tab active={activeTab === 'collective'}>
        <FormattedMessage id="pricing.forCollective" defaultMessage="For Collective" />
      </Tab>
    </Link>
    <Link href="#fiscalHost">
      <Tab active={activeTab === 'fiscalHost'}>
        <FormattedMessage id="pricing.forFiscalHost" defaultMessage="For fiscal hosts" />
      </Tab>
    </Link>
    <Link href="#faq">
      <Tab active={activeTab === 'faq'}>
        <FormattedMessage id="pricing.faq" defaultMessage="FAQ" />
      </Tab>
    </Link>
  </Container>
);

Tabs.propTypes = {
  activeTab: PropTypes.string,
};

export default Tabs;
