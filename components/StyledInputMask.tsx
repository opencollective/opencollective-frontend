import React from 'react';
import type { MaskitoOptions } from '@maskito/core';
import { MASKITO_DEFAULT_OPTIONS } from '@maskito/core';
import { useMaskito } from '@maskito/react';

import StyledInput from './StyledInput';

interface StyledInputMaskProps extends React.ComponentProps<typeof StyledInput> {
  render?: (ref: React.Ref<unknown>, props: unknown) => React.ReactNode;
  maskito?: MaskitoOptions;
}

const DefaultMaskRenderer = (ref, props) => <StyledInput ref={ref} {...props} />;

const StyledInputMask = ({
  render = DefaultMaskRenderer,
  maskito = MASKITO_DEFAULT_OPTIONS,
  ...props
}: StyledInputMaskProps) => render(useMaskito({ options: maskito }), props);

export default StyledInputMask;
