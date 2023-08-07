import * as Separator from '@radix-ui/react-separator';
import styled from 'styled-components';

export const VerticalSeparator = styled(Separator.Root).attrs({
  decorative: true,
  orientation: 'vertical',
})<{ thickness?: string; color?: string }>`
  background-color: ${props => props.color || props.theme.colors.black[200]};
  width: ${props => props.thickness || '1px'};
`;

export const HorziontalSeparator = styled(Separator.Root).attrs({
  decorative: true,
  orientation: 'horizontal',
})<{ thickness?: string; color?: string }>`
  background-color: ${props => props.color || props.theme.colors.black[200]};
  height: ${props => props.thickness || '1px'};
`;
