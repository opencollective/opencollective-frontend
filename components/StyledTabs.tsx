import React from 'react';
import styled from 'styled-components';

import { Flex } from './Grid';

const TabButton = styled.button<{ selected?: boolean }>`
  appearance: none;
  border: none;
  cursor: pointer;
  outline: 0;
  min-width: max-content;
  background: transparent;
  background-color: transparent;
  padding: 8px 12px 16px;
  line-height: 20px;

  ${props =>
    props.selected
      ? `
        color: ${props.theme.colors.primary[900]};
        font-size: 14px;
        font-weight: 700;
        `
      : `
        color: ${props => props.theme.colors.black[700]};
        font-size: 14px;
        font-weight: 500;
      `}
  

  border-bottom: 2px solid ${props => (props.selected ? props.theme.colors.primary[500] : 'transparent')};

  > span {
    padding: 4px 8px;
    align-items: center;
    margin-left: 8px;
    border-radius: 100px;
    background: ${props => props.theme.colors.primary[100]};

    
    line-height: 16px;
    color: ${props => props.theme.colors.primary[500]};
    font-size: 12px;
    font-weight: 500;
    
`;

type TabsProps = {
  tabs: Array<{ id: string | number; label: React.ReactNode | string; count?: number; selected?: boolean }>;
  selectedId: string | number;
  onChange?: (id: string | number) => void;
};

const TabsBar = styled(Flex)`
  border: 1px solid transparent;
  border-bottom: 1px solid ${props => props.theme.colors.black[300]};
`;

const Tabs = ({ tabs, selectedId, onChange, ...props }: TabsProps & Parameters<typeof Flex>[0]) => {
  return (
    <TabsBar {...props} gap="12px">
      {tabs.map(tab => (
        <TabButton key={tab.id} onClick={() => onChange?.(tab.id)} selected={tab.id === selectedId}>
          {tab.label} {tab.count && <span>{tab.count}</span>}
        </TabButton>
      ))}
    </TabsBar>
  );
};

export default Tabs;
