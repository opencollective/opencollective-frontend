import React from 'react';
import styled from 'styled-components';

import { useWindowResize, VIEWPORTS } from '../lib/hooks/useWindowResize';

import { Flex } from './Grid';
import StyledSelect from './StyledSelect';

const abbreviateNumber = number => {
  if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)}B`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  } else {
    return number;
  }
};

const TabButton = styled.button<{ selected?: boolean }>`
  appearance: none;
  border: none;
  cursor: pointer;
  outline: 0;
  min-width: max-content;
  background: transparent;
  padding: 16px 4px;
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;

  color: ${props => (props.selected ? props.theme.colors.primary[700] : props.theme.colors.black[600])};
  transition: color 50ms ease-in-out, border-color 50ms ease-in-out;
  border-bottom: 2px solid ${props => (props.selected ? props.theme.colors.primary[500] : 'transparent')};

  &:hover {
    color: ${props => (props.selected ? props.theme.colors.primary[700] : props.theme.colors.black[700])};
    border-color: ${props => (props.selected ? props.theme.colors.primary[500] : props.theme.colors.black[300])};
  }

  > span {
    padding: 2px 10px;
    align-items: center;
    margin-left: 12px;
    border-radius: 100px;
    background: ${props => (props.selected ? props.theme.colors.primary[100] : props.theme.colors.black[100])};
    color: ${props => (props.selected ? props.theme.colors.primary[700] : props.theme.colors.black[700])};
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    
`;

type TabsProps = {
  tabs: Array<{ id: string | number; label: React.ReactNode | string; count?: number; selected?: boolean }>;
  selectedId: string | number;
  onChange?: Function;
};

const TabsBar = styled.div`
  border-bottom: 1px solid ${props => props.theme.colors.black[300]};
`;

const Tabs = ({ tabs, selectedId, onChange, ...props }: TabsProps & Parameters<typeof Flex>[0]) => {
  const { viewport } = useWindowResize();

  if (viewport === VIEWPORTS.XSMALL) {
    const options = tabs.map(tab => ({ label: tab.count ? `${tab.label} (${tab.count})` : tab.label, value: tab.id }));
    return (
      <StyledSelect
        {...props}
        inputId="tabs"
        options={options}
        onChange={option => onChange?.(option.value)}
        value={options.find(option => option.value === selectedId)}
      />
    );
  }

  return (
    <TabsBar {...props}>
      <Flex gap="24px" mb="-1px" overflowX="auto">
        {tabs.map(tab => (
          <TabButton key={tab.id} onClick={() => onChange?.(tab.id)} selected={tab.id === selectedId}>
            {tab.label} {typeof tab.count !== 'undefined' && <span>{abbreviateNumber(tab.count)}</span>}
          </TabButton>
        ))}
      </Flex>
    </TabsBar>
  );
};

export default Tabs;
